# Public reference snapshot

`data/reference.json` is a versioned public snapshot, separate from personal
budgets. ACS dollar references are nominal 2024 USD; OEWS wages are nominal
May 2023 USD. They are historical
observations and never automatically supply take-home income.

## Census earnings

The snapshot uses the [2024 ACS 1-year B20018 detailed table](https://data.census.gov/table/ACSDT1Y2024.B20018),
variable `B20018_001E`, from the [official table-based summary file](https://www2.census.gov/programs-surveys/acs/summary_file/2024/table-based-SF/data/1YRData/acsdt1y2024-b20018.dat).
Its population is resident workers aged 16+ who worked full time, year round
and had earnings. Geography is the incorporated Census place, including DC.
This is pretax individual earnings for all ages, not household income,
Gen Z earnings, workplace wages, or take-home income.

The matching median/mean candidates are [S2001](https://api.census.gov/data/2024/acs/acs1/subject/groups/S2001.html)
total estimates `S2001_C01_013E` and `S2001_C01_014E`. Labels were checked
against official group metadata. Data requests returned an HTML “Missing Key”
page during ingestion. B20018 supplies the matching-population median; mean
remains `null`, with an availability explanation. No mean is inferred from a
median. Running the refresh with `CENSUS_API_KEY` retrieves both S2001 values
and updates the source attribution. The key is never written to the snapshot.

## Census rent

[2024 ACS 1-year B25031](https://data.census.gov/table/ACSDT1Y2024.B25031)
comes from the [official summary file](https://www2.census.gov/programs-surveys/acs/summary_file/2024/table-based-SF/data/1YRData/acsdt1y2024-b25031.dat).
Variables 002–007 represent no bedroom (studio), one, two, three, four, and
five-or-more bedrooms. These are monthly median gross rents among occupied
units paying cash rent. They are not asking rents or available apartment
quotes. There is no bedroom-specific mean in this table.

Gross rent includes contract rent plus tenant-paid electricity, gas,
water/sewer and other heating fuels. Internet and phone are separate.
Users must reconcile these included utilities before adding a utilities
expense. Only the individual's share contributes to a shared budget.

Negative Census sentinel values and nonnumeric suppression flags become
`null`, never zero. The upper open-ended median category encoded as `3501`
is retained as `sourceValue`, with `lowerBound: 3500`, but its exact `value`
is `null`; the UI must not treat it as an exact rent. Source periods,
geographies, and original source values remain attached to each rent record.
Margins of error are not used as budget estimates; ACS figures are survey
estimates, not guarantees about an individual's situation.

## Occupation wages

The [BLS May 2024 metropolitan OEWS download](https://www.bls.gov/oes/special-requests/oesm24ma.zip)
returned HTTP 403. The [official tables index](https://www.bls.gov/oes/tables.htm)
lists 2024 XLSX data only; static 2024 metro HTML tables are not available.
The snapshot instead includes **Software Developers, SOC 15-1252, May 2023**
for each of the twelve metropolitan areas. The source URL on each row links
its official BLS metro table. These rows were transcribed and checked against
the published annual mean and hourly median columns; their values are pinned
in the refresh script so a refresh remains reproducible despite archive access
failures. There is no claim of complete occupation coverage.

Annual mean is directly published. Annual median is an explicitly approximate
full-time annual equivalent: published hourly median × 2,080, rounded to the
nearest $10. Each row retains `hourlyMedian`, `medianMethod` and `meanMethod`.
The [BLS table footnotes](https://www.bls.gov/oes/2023/may/oes_35620.htm)
document 2,080 hours for annualizing hourly wages; the annual median shown here
is derived from the rounded published hourly median rather than a directly
downloaded annual-median estimate. It is not actual annual earnings or a claim
that every covered worker works those hours.

OEWS describes covered wage-and-salary jobs in metropolitan establishments
across experience levels and excludes self-employed workers. It is workplace
based, not resident based, and must remain separate from Census earnings. Metro
names and area codes use the **2023 release definitions**, including Boston's
then-current NECTA area 71650, rather than applying newer boundaries to old data.
No Census earnings figure is substituted as an occupational wage. Additional
occupations require source/geography/period/population and suppression validation.

## Institutions and discovery coordinates

The [NCES IPEDS HD2024 directory](https://nces.ed.gov/ipeds/datacenter/data/HD2024.zip)
supplies institution ID, name, reporting location, website, institutional
level and coordinates. Eligibility requires `DEGGRANT=1`, `CYACTIVE=1`, and
`ICLEVEL` 1 (four-year) or 2 (two-year). The launch directory uses an additional
conservative classification filter validated against the official
[HD2024 data dictionary](https://nces.ed.gov/ipeds/datacenter/data/HD2024_Dict.zip):
`C21BASIC` must be 1–9 (broad-program associate's colleges), 14–23
(baccalaureate/associate's, doctoral, master's or baccalaureate colleges), or 33
(tribal colleges). This excludes all special-focus categories 10–13 and 24–32,
plus unclassified or missing records. The classification is retained per row.

This deliberately excludes standalone trade schools, including Colorado School
of Trades (UNITID 126784, code 11: Special Focus Two-Year, Technical Professions).
It also omits some legitimate specialized arts, health, religious, law and
technical colleges, and newer institutions without a 2021 classification. This
is a **conservative discovery subset, not an exhaustive directory**. Broad-program
community colleges offering technical programs remain eligible. Names are not
used for filtering; Georgia Institute of Technology and MIT remain included.
The [classification methodology](https://carnegieclassifications.acenet.edu/carnegie-classification/classification-methodology/2021-basic-classification/)
uses program concentration to distinguish special-focus institutions. No claim
is made about a specific institution's current degree-program availability.
Missing, nonfinite or invalid coordinates are excluded.

The file includes **906 unique reporting institutions** (237 two-year and 669
four-year) within 100 straight-line
miles of at least one supported city. Every supported city has eligible
institutions inside the default 25 miles. The user interface can filter the
snapshot through 100 miles; coverage beyond this is not promised. IPEDS
coordinates describe reporting institutions; satellite campuses are not inferred.
Websites are institution-provided directory values and are not endorsements.

The discovery origins are [2024 Census Gazetteer place internal points](https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_place_national.zip),
joined by seven-digit state/place GEOID, rather than undocumented downtown
coordinates. The source and definition are stored on each city. Distances use
the haversine formula with an Earth radius of 3,958.7613 miles and represent
straight-line distance, never driving distance or commute time.

## Reproduction and reuse

Run `python3 scripts/refresh-data.py` with network access. The script needs only
Python's standard library, caches official downloads under `/tmp/col-reference`,
and validates city count, source metadata construction, coordinate ranges,
institution IDs and local discovery coverage before replacing the snapshot.
Use `--cache-dir` to select a cache; remove cached files intentionally to fetch
the same release again. Releases are pinned to 2024; changing the vintage is
a reviewed code/data change. The snapshot's `retrievedAt` records build time.

These are publicly distributed US federal statistical datasets, reused with
agency attribution and links. No paid dataset, apartment listing, proprietary
dataset, institutional logo or individual student record is included. Census
and NCES publication does not imply endorsement. Changes to public source
access, API keys, institution status or statistical releases require an explicit
refresh; saved personal overrides must never be replaced by that refresh.
