import type { HospitalId } from "./types";

export const HOSPITALS: { id: HospitalId; name: string; city: string }[] = [
  {
    id: "sri-venkateswara-hyderabad",
    name: "Sri Venkateswara Multispeciality Hospital",
    city: "Hyderabad",
  },
  { id: "kaveri-care-bengaluru", name: "Kaveri Care Hospital", city: "Bengaluru" },
  { id: "sahyadri-lifeline-pune", name: "Sahyadri Lifeline Hospital", city: "Pune" },
  { id: "ganga-seva-varanasi", name: "Ganga Seva Medical Centre", city: "Varanasi" },
];

export const PROCEDURES = [
  {
    name: "Laparoscopic cholecystectomy",
    tag: "procedure:cholecystectomy",
    packageCode: "JRY-GEN-042",
  },
  { name: "Cataract surgery", tag: "procedure:cataract-surgery", packageCode: "JRY-EYE-018" },
  { name: "C-section delivery", tag: "procedure:c-section-delivery", packageCode: "JRY-OBS-011" },
  { name: "Total knee replacement", tag: "procedure:total-knee-replacement", packageCode: "JRY-ORTHO-067" },
] as const;

export function hospitalById(id: HospitalId) {
  const hospital = HOSPITALS.find((item) => item.id === id);
  if (!hospital) throw new Error(`Unknown hospital: ${id}`);
  return hospital;
}

export function procedureByName(name: string) {
  return PROCEDURES.find((item) => item.name.toLowerCase() === name.trim().toLowerCase());
}
