/**
 * Maintenance schedule seed data, ported from the prototype's MaintenancePlanner.
 * recommendedPartIds reference prototype part ids ("part-00X") that the seed
 * script resolves to real Mongo ids.
 */
export interface MaintenanceSeed {
  mileageInterval: number;
  title: string;
  label: string;
  badge: string;
  description: string;
  importance: "Critical" | "Recommended" | "Inspection";
  recommendedPartIds: string[];
}

export const MAINTENANCE_SEED: MaintenanceSeed[] = [
  {
    mileageInterval: 30000,
    title: "30,000 Mile Minor Service",
    label: "Minor Service",
    badge: "Routine Inspection",
    description:
      "Keep your engine clean and breathing at peak efficiency with a full synthetic oil change and fresh filtration.",
    importance: "Inspection",
    recommendedPartIds: ["part-005", "part-004"],
  },
  {
    mileageInterval: 60000,
    title: "60,000 Mile Major Tune-Up",
    label: "Major Tune-Up",
    badge: "Essential Maintenance",
    description:
      "Restore ignition spark energy, braking performance, and intake airflow with a factory-spec tune-up kit.",
    importance: "Recommended",
    recommendedPartIds: ["part-003", "part-001", "part-004"],
  },
  {
    mileageInterval: 90000,
    title: "90,000 Mile Heavy Inspection & Brake Overhaul",
    label: "Heavy Inspection & Brake Overhaul",
    badge: "Critical Overhaul",
    description:
      "Eliminate brake pulsation, cold-start failures, and suspension wear with a critical 90k overhaul.",
    importance: "Critical",
    recommendedPartIds: ["part-002", "part-001", "part-009", "part-007"],
  },
];
