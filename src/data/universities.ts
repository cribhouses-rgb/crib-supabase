import type { University } from "../types";

/**
 * IMPORTANT: verify every domain below against the university's real student
 * email format before you go live. Getting one wrong locks out real students
 * or, worse, lets the wrong people in. HIT's is confirmed (hit.ac.zw, used
 * throughout your own account). The rest are best-effort and should be
 * checked against each university's IT/registry page.
 *
 * adminCode is only shown inside the admin panel — it unlocks that
 * university's filtered data view there. It's independent of everything
 * else and safe to change any time (no other part of the app reads it).
 *
 * Add a new university by adding one line here — nothing else in the auth
 * flow needs to change.
 */
export const UNIVERSITIES: University[] = [
  { id: "hit", name: "Harare Institute of Technology", domain: "hit.ac.zw", lat: -17.7935, lng: 31.0640, adminCode: "HIT-4821" },
  { id: "uz", name: "University of Zimbabwe", domain: "uz.ac.zw", lat: -17.7833, lng: 31.0534, adminCode: "UZ-3057" },
  { id: "nust", name: "National University of Science and Technology", domain: "nust.ac.zw", lat: -20.1525, lng: 28.6315, adminCode: "NUST-6194" },
  { id: "msu", name: "Midlands State University", domain: "msu.ac.zw", lat: -19.4505, lng: 29.8170, adminCode: "MSU-2740" },
  { id: "cut", name: "Chinhoyi University of Technology", domain: "cut.ac.zw", lat: -17.3580, lng: 30.2010, adminCode: "CUT-8365" },
  { id: "gzu", name: "Great Zimbabwe University", domain: "gzu.ac.zw", lat: -20.2710, lng: 30.8570, adminCode: "GZU-1926" },
  { id: "buse", name: "Bindura University of Science Education", domain: "buse.ac.zw", lat: -17.3010, lng: 31.3320, adminCode: "BUSE-5013" },
  { id: "lsu", name: "Lupane State University", domain: "lsu.ac.zw", lat: -18.9310, lng: 28.5830, adminCode: "LSU-7482" },
  { id: "africau", name: "Africa University", domain: "africau.edu", lat: -18.9730, lng: 32.6690, adminCode: "AU-9260" },
  { id: "wua", name: "Women's University in Africa", domain: "wua.ac.zw", lat: -17.8280, lng: 31.0530, adminCode: "WUA-4713" },
];

export function getUniversity(id: string | undefined | null): University | undefined {
  return UNIVERSITIES.find((u) => u.id === id);
}
