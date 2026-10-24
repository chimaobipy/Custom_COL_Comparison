#!/usr/bin/env python3
"""Build the public reference snapshot; only Python's standard library is required.

Usage: python3 scripts/refresh-data.py [--cache-dir /tmp/col-reference]
Set CENSUS_API_KEY to ingest matching S2001 median/mean; otherwise B20018
provides the same-population median and the mean remains explicitly unknown.
Downloads are cached. A failed mandatory download never overwrites the snapshot.
"""
import argparse
import csv
import datetime
import io
import json
import math
import os
from pathlib import Path
import urllib.parse
import urllib.request
import zipfile

YEAR = 2024
ROOT = Path(__file__).resolve().parents[1]
BULK = 'https://www2.census.gov/programs-surveys/acs/summary_file/2024/table-based-SF/data/1YRData/'
GAZ = 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_place_national.zip'
IPEDS = 'https://nces.ed.gov/ipeds/datacenter/data/HD2024.zip'
# Broad-program or tribal colleges only: conservative launch discovery subset.
ELIGIBLE_CARNEGIE = {str(n) for n in (*range(1, 10), *range(14, 24), 33)}
CITIES = [
    ('new-york', 'New York City', 'NY', '3651000'),
    ('boston', 'Boston', 'MA', '2507000'),
    ('washington-dc', 'Washington DC', 'DC', '1150000'),
    ('atlanta', 'Atlanta', 'GA', '1304000'),
    ('chicago', 'Chicago', 'IL', '1714000'),
    ('austin', 'Austin', 'TX', '4805000'),
    ('denver', 'Denver', 'CO', '0820000'),
    ('seattle', 'Seattle', 'WA', '5363000'),
    ('los-angeles', 'Los Angeles', 'CA', '0644000'),
    ('philadelphia', 'Philadelphia', 'PA', '4260000'),
    ('pittsburgh', 'Pittsburgh', 'PA', '4261000'),
    ('houston', 'Houston', 'TX', '4835000'),
]
POPULATION = 'Resident workers aged 16+ with earnings who worked full time, year round; all ages, not Gen Z-specific'
# Transcribed from official May 2023 metro HTML, SOC 15-1252. Kept here so
# refresh is reproducible even where BLS rejects automated archive downloads.
# (area code, published metro name, hourly median, published annual mean)
SOFTWARE_WAGES = [
    ('35620', 'New York-Newark-Jersey City, NY-NJ-PA', 71.68, 152100),
    ('71650', 'Boston-Cambridge-Nashua, MA-NH', 66.87, 148100),
    ('47900', 'Washington-Arlington-Alexandria, DC-VA-MD-WV', 68.03, 148480),
    ('12060', 'Atlanta-Sandy Springs-Roswell, GA', 62.36, 127720),
    ('16980', 'Chicago-Naperville-Elgin, IL-IN-WI', 62.11, 127960),
    ('12420', 'Austin-Round Rock, TX', 63.14, 132500),
    ('19740', 'Denver-Aurora-Lakewood, CO', 64.90, 139670),
    ('42660', 'Seattle-Tacoma-Bellevue, WA', 80.30, 164130),
    ('31080', 'Los Angeles-Long Beach-Anaheim, CA', 73.83, 151780),
    ('37980', 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD', 61.13, 125850),
    ('38300', 'Pittsburgh, PA', 51.50, 112490),
    ('26420', 'Houston-The Woodlands-Sugar Land, TX', 60.44, 126810),
]


def amount(value):
    """Census negative sentinel values and text suppression flags are unknown."""
    try:
        number = float(value)
        return number if math.isfinite(number) and number >= 0 else None
    except (ValueError, TypeError):
        return None


def distance(a, b):
    lat1, lat2 = math.radians(a['latitude']), math.radians(b['latitude'])
    dl = math.radians(b['longitude'] - a['longitude'])
    h = math.sin((lat2-lat1)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dl/2)**2
    return 3958.7613 * 2 * math.asin(min(1, math.sqrt(h)))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache-dir', type=Path, default=Path('/tmp/col-reference'))
    args = parser.parse_args()
    args.cache_dir.mkdir(parents=True, exist_ok=True)

    def fetch(url, filename):
        path = args.cache_dir / filename
        if not path.exists():
            with urllib.request.urlopen(url, timeout=90) as response:
                content = response.read()
            path.write_bytes(content)
        return path.read_bytes()

    def table(code):
        content = fetch(BULK + f'acsdt1y2024-{code}.dat', f'{code}.dat')
        rows = csv.DictReader(io.StringIO(content.decode()), delimiter='|')
        return {r['GEO_ID']: r for r in rows}

    rents, medians = table('b25031'), table('b20018')
    archive = zipfile.ZipFile(io.BytesIO(fetch(GAZ, 'places2024.zip')))
    rows = csv.DictReader(io.StringIO(archive.read(archive.namelist()[0]).decode()), delimiter='\t')
    centers = {r['GEOID']: {k.strip(): v.strip() for k, v in r.items()} for r in rows}
    cities = []
    for city_index, (city_id, name, state, fips) in enumerate(CITIES):
        geography = f'{name}, {state} (Census place {fips})'
        geo_id = '1600000US' + fips
        median = amount(medians[geo_id]['B20018_E001'])
        mean = None
        source = 'https://data.census.gov/table/ACSDT1Y2024.B20018'
        status = 'Mean unavailable: S2001 requires a Census API key; median from matching-population B20018.'
        if os.environ.get('CENSUS_API_KEY'):
            query = urllib.parse.urlencode({'get':'S2001_C01_013E,S2001_C01_014E', 'for':'place:'+fips[2:], 'in':'state:'+fips[:2], 'key':os.environ['CENSUS_API_KEY']})
            # Never persist the authenticated URL or API key in public output/cache.
            with urllib.request.urlopen('https://api.census.gov/data/2024/acs/acs1/subject?' + query, timeout=90) as response:
                values = json.load(response)
            median, mean = amount(values[1][0]), amount(values[1][1])
            source = 'https://data.census.gov/table/ACSST1Y2024.S2001'
            status = 'S2001 total full-time, year-round resident earnings; suppressed values remain unknown.'
        city = {'id': city_id, 'name':name, 'state':state,
            'latitude':float(centers[fips]['INTPTLAT']), 'longitude':float(centers[fips]['INTPTLONG']),
            'coordinateSource':GAZ, 'coordinateDefinition':'2024 Census Gazetteer internal point of place; discovery origin, not a commute origin',
            'earnings':{'median':median, 'mean':mean, 'source':source, 'period':'2024 ACS 1-year', 'geography':geography, 'population':POPULATION, 'status':status},
            'rents':[], 'wages':[], 'wageStatus':'May 2023 OEWS historical occupation benchmark. May 2024 archive download was unavailable; 2024 has no static metro HTML tables.'}
        area, metro, hourly_median, annual_mean = SOFTWARE_WAGES[city_index]
        city['wages'].append({'occupation':'Software Developers', 'code':'15-1252',
            'median':round(hourly_median * 2080 / 10) * 10, 'mean':annual_mean,
            'hourlyMedian':hourly_median, 'source':f'https://www.bls.gov/oes/2023/may/oes_{area}.htm',
            'period':'May 2023 OEWS', 'geography':metro + f' (OEWS area {area})',
            'population':'Covered wage-and-salary jobs at metropolitan establishments, all experience levels; excludes self-employed workers; workplace-based, not city residents',
            'medianMethod':'Approximate annual equivalent derived from published hourly median × 2,080 hours, rounded to nearest $10. Not a directly published annual median or actual annual earnings.',
            'meanMethod':'Directly published annual mean wage; BLS uses 2,080 full-time, year-round hours for annualization.',
            'status':'Historical occupation benchmark, not an early-career offer or take-home income. Annual median is an approximate full-time equivalent.'})
        for bedrooms, variable in enumerate(range(2,8)):
            raw = rents[geo_id][f'B25031_E{variable:03d}']
            value = amount(raw)
            # Census encodes the upper open-ended median rent category as 3501.
            # Do not turn that lower bound into an exact apartment suggestion.
            capped = value == 3501
            city['rents'].append({'bedrooms':bedrooms, 'value':None if capped else value,
                'sourceValue':raw, 'lowerBound':3500 if capped else None,
                'source':'https://data.census.gov/table/ACSDT1Y2024.B25031', 'period':'2024 ACS 1-year', 'geography':geography,
                'population':'Occupied housing units paying cash rent',
                'status':('Source reports $3,500 or more; exact amount unknown. ' if capped else '') + 'Historical median gross rent; not current asking rent. Includes contract rent plus tenant-paid electricity, gas, water/sewer, and other fuels. Five bedrooms means five or more.'})
        cities.append(city)

    archive = zipfile.ZipFile(io.BytesIO(fetch(IPEDS, 'HD2024.zip')))
    rows = csv.DictReader(io.StringIO(archive.read('HD2024.csv').decode('utf-8-sig')))
    institutions = []
    for row in rows:
        if row['DEGGRANT'] != '1' or row['ICLEVEL'] not in ('1','2') or row['CYACTIVE'] != '1':
            continue
        if row['C21BASIC'] not in ELIGIBLE_CARNEGIE:
            continue
        try:
            lat, lon = float(row['LATITUDE']), float(row['LONGITUD'])
        except ValueError:
            continue
        if not (math.isfinite(lat) and math.isfinite(lon) and -90 <= lat <= 90 and -180 <= lon <= 180):
            continue
        institution = {'id':row['UNITID'], 'name':row['INSTNM'], 'city':row['CITY'], 'state':row['STABBR'],
            'latitude':lat, 'longitude':lon, 'type':'four-year' if row['ICLEVEL']=='1' else 'two-year',
            'website':row['WEBADDR'].strip(), 'source':IPEDS, 'period':'IPEDS HD2024',
            'carnegie2021Basic':row['C21BASIC'],
            'locationNote':'IPEDS reporting institution coordinate; satellite-campus coverage is not implied.'}
        if not any(distance(city, institution) <= 100 for city in cities):
            continue
        if institution['website'] and not institution['website'].startswith(('https://','http://')):
            institution['website'] = 'https://' + institution['website']
        institutions.append(institution)
    assert len(cities) == 12 and all(len(c['rents']) == 6 for c in cities)
    assert all(c['earnings']['median'] is not None for c in cities)
    assert len({i['id'] for i in institutions}) == len(institutions)
    assert all(any(distance(c,i)<=25 for i in institutions) for c in cities)
    output = {'version':1, 'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'cities':cities, 'institutions':sorted(institutions, key=lambda i:i['name']),
        'institutionCoverageMiles':100, 'institutionCoverageNote':'Conservative subset of active degree-granting two/four-year reporting institutions in broad-program or tribal Carnegie categories, within 100 straight-line miles of a supported place internal point. Special-focus and unclassified institutions are excluded; directory is not exhaustive.'}
    destination = ROOT / 'data/reference.json'
    destination.parent.mkdir(exist_ok=True)
    destination.write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
    print(f'Wrote {len(cities)} cities and {len(institutions)} institutions to {destination}')


if __name__ == '__main__':
    main()
