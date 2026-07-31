/**
 * Suburbs commonly used by HIT students, with approximate centre
 * coordinates and whether they have a shuttle pickup point.
 *
 * When we add more universities, each can have its own suburbs file
 * or we can make this a Firestore collection keyed by universityId.
 * For now, hardcoding HIT's suburbs is fine for launch.
 */
export interface Suburb {
  name: string;
  lat: number;
  lng: number;
  hasShuttle: boolean;
}

export const HIT_SUBURBS: Suburb[] = [
  { name: "Hatcliffe", lat: -17.7410, lng: 31.0350, hasShuttle: true },
  { name: "Borrowdale", lat: -17.7540, lng: 31.0890, hasShuttle: true },
  { name: "Glen Lorne", lat: -17.7260, lng: 31.1120, hasShuttle: false },
  { name: "Chisipite", lat: -17.7690, lng: 31.1140, hasShuttle: false },
];

export const SUBURB_NAMES = HIT_SUBURBS.map((s) => s.name);

/**
 * HIT academic calendar — three semesters per year.
 * Used for filtering listings by semester and showing the current
 * semester badge in the UI.
 */
export const SEMESTERS = [
  { number: 1, label: "Semester 1", months: "Jan – Apr", startMonth: 1, endMonth: 4 },
  { number: 2, label: "Semester 2", months: "May – Aug", startMonth: 5, endMonth: 8 },
  { number: 3, label: "Semester 3", months: "Sep – Dec", startMonth: 9, endMonth: 12 },
];

export function getCurrentSemester(): (typeof SEMESTERS)[number] {
  const month = new Date().getMonth() + 1; // 1-12
  return SEMESTERS.find((s) => month >= s.startMonth && month <= s.endMonth) ?? SEMESTERS[0];
}

export const PROPERTY_TYPES = [
  { value: "single_room" as const, label: "Single room" },
  { value: "shared" as const, label: "Shared" },
  { value: "flat" as const, label: "Flat" },
  { value: "house" as const, label: "House" },
];

export const AMENITIES = ["WiFi", "Water", "Electricity", "Security", "Parking", "Backup power", "Borehole"];
