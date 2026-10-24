export type Amount = number | null;
export type Preferences = { bedrooms: number; occupants: number; transport: string };
export type Expense = { id: string; name: string; amount: Amount; applicable: boolean; period: 'monthly' | 'funding'; override: boolean; source: Reference | null };
export type Reference = { value?: Amount; source: string; period: string; geography: string; population?: string; [key: string]: unknown };
export type City = {
  id: string; referenceId: string; name: string; mode: 'career' | 'student';
  preferences: Preferences; income: Amount; gross: Amount; totalRent: Amount; rentShare: Amount;
  rentOverride: boolean; rentSource: Reference | null; utilitiesIncluded: boolean;
  expenses: Expense[]; savings: Amount; moving: Amount;
  months: number; funding: { work: Amount; grants: Amount; family: Amount; loans: Amount };
  tuition: Amount; tuitionApplicable: boolean; tuitionPeriod: 'monthly' | 'funding';
};
export type Comparison = { version: 1; name: string; baseline: Preferences; cities: City[] };
export type ReferenceCity = { id: string; name: string; state: string; latitude: number; longitude: number; earnings?: Reference & { median: Amount; mean: Amount }; rents?: (Reference & { bedrooms: number; value: Amount })[]; wages?: (Reference & { occupation: string; code: string; median: Amount; mean: Amount })[] };
export type Institution = { id: string; name: string; city: string; state: string; latitude: number; longitude: number; type: 'two-year' | 'four-year'; website: string; source: string; period: string };
export type Dataset = { version: number; retrievedAt: string; cities: ReferenceCity[]; institutions: Institution[] };
