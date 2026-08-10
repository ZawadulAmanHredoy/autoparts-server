/**
 * Interactive diagram seed data, ported from the prototype (diagramData.ts).
 * Hotspots reference prototype part ids ("part-00X") that the seed script
 * resolves to real Mongo ids before writing to the database.
 */
export interface DiagramSeed {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  hotspots: {
    id: string;
    partId: string;
    partName: string;
    partNumber: string;
    xPercent: number;
    yPercent: number;
    price: number;
  }[];
}

export const DIAGRAM_SEED: DiagramSeed[] = [
  {
    id: "diag-brake-front",
    title: "Front Disc Brake & Hub Assembly Schematic",
    subtitle:
      "Interactive exploded view: Click any component pin to inspect fitment, OEM cross-reference, and add directly to your cart.",
    image:
      "https://images.unsplash.com/photo-1600706432520-22108a901ffc?auto=format&fit=crop&w=1200&q=80",
    hotspots: [
      {
        id: "hs-1",
        partId: "part-001",
        partName: "Front Ceramic Brake Pad Set",
        partNumber: "P83082N",
        xPercent: 32,
        yPercent: 48,
        price: 64.99,
      },
      {
        id: "hs-2",
        partId: "part-002",
        partName: "Vented Brake Rotor Disc",
        partNumber: "15011428",
        xPercent: 64,
        yPercent: 52,
        price: 52.49,
      },
      {
        id: "hs-3",
        partId: "part-007",
        partName: "Front Shock / Strut Absorber",
        partNumber: "22-230912",
        xPercent: 78,
        yPercent: 25,
        price: 148.0,
      },
    ],
  },
  {
    id: "diag-engine-bay",
    title: "Engine Ignition & Air Intake System Schematic",
    subtitle: "Air induction path, spark ignition coils, and battery charging circuit layout.",
    image:
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80",
    hotspots: [
      {
        id: "hs-4",
        partId: "part-003",
        partName: "Laser Iridium Spark Plug Set",
        partNumber: "93175-4PK",
        xPercent: 45,
        yPercent: 38,
        price: 43.99,
      },
      {
        id: "hs-5",
        partId: "part-004",
        partName: "High-Flow Washable Air Filter",
        partNumber: "33-2385",
        xPercent: 22,
        yPercent: 62,
        price: 59.99,
      },
      {
        id: "hs-6",
        partId: "part-009",
        partName: "Optima AGM Group 35 Battery",
        partNumber: "8040-218",
        xPercent: 72,
        yPercent: 70,
        price: 249.99,
      },
    ],
  },
];
