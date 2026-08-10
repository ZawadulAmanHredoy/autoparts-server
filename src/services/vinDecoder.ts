import { AppError } from "../middleware/errorHandler.js";

/**
 * Local VIN decoder (deterministic, no external API).
 * Extracts WMI -> make, model-year from position 10, and reports engine/body
 * from the VDS positions when known. Extend WMI tables or swap for a paid
 * VIN API later without changing the route contract.
 */

const YEAR_CHARS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N",
  "P", "R", "S", "T", "V", "W", "X", "Y",
  "1", "2", "3", "4", "5", "6", "7", "8", "9",
] as const;

/**
 * VIN model-year characters repeat on a 30-year cycle starting at 1980.
 * Resolve ambiguity (e.g. "J" = 1988 or 2018) by picking the most recent
 * year not more than one year in the future.
 */
function yearFromChar(char: string, currentYear: number): number {
  const idx = YEAR_CHARS.indexOf(char as (typeof YEAR_CHARS)[number]);
  if (idx === -1) {
    throw new AppError(400, "Could not determine model year from VIN");
  }
  let year = 1980 + idx;
  while (year <= currentYear + 1) year += 30;
  year -= 30;
  return year;
}

const WMI_MAKES: Array<{ prefix: string; make: string }> = [
  { prefix: "JHM", make: "Honda" },
  { prefix: "JHG", make: "Honda" },
  { prefix: "JHL", make: "Honda" },
  { prefix: "1HG", make: "Honda" },
  { prefix: "5YF", make: "Toyota" },
  { prefix: "2T1", make: "Toyota" },
  { prefix: "4T1", make: "Toyota" },
  { prefix: "JTD", make: "Toyota" },
  { prefix: "1FM", make: "Ford" },
  { prefix: "1FT", make: "Ford" },
  { prefix: "2F", make: "Ford" },
  { prefix: "3F", make: "Ford" },
  { prefix: "1F", make: "Ford" },
  { prefix: "1GC", make: "Chevrolet" },
  { prefix: "2GC", make: "Chevrolet" },
  { prefix: "3GC", make: "Chevrolet" },
  { prefix: "1G1", make: "Chevrolet" },
  { prefix: "WBA", make: "BMW" },
  { prefix: "WBS", make: "BMW" },
  { prefix: "WDB", make: "Mercedes-Benz" },
  { prefix: "WDD", make: "Mercedes-Benz" },
  { prefix: "WVW", make: "Volkswagen" },
  { prefix: "3VW", make: "Volkswagen" },
  { prefix: "WAU", make: "Audi" },
  { prefix: "1N4", make: "Nissan" },
  { prefix: "1N6", make: "Nissan" },
  { prefix: "JN1", make: "Nissan" },
  { prefix: "3N1", make: "Nissan" },
  { prefix: "1HD", make: "Harley-Davidson" },
  { prefix: "19X", make: "Honda" },
  { prefix: "KMH", make: "Hyundai" },
  { prefix: "5N1", make: "Nissan" },
  { prefix: "1C3", make: "Chrysler" },
  { prefix: "2C3", make: "Chrysler" },
  { prefix: "1XK", make: "Kia" },
  { prefix: "5XYP", make: "Kia" },
  { prefix: "5X", make: "Kia" },
  { prefix: "3V3", make: "Volkswagen" },
];

const MODEL_HINTS: Array<{ pattern: string; model: string; engine?: string }> = [
  { pattern: "1FMY", model: "Explorer" },
  { pattern: "1FTF", model: "F-150", engine: "5.0L V8" },
  { pattern: "1FTE", model: "F-150", engine: "3.5L EcoBoost V6" },
  { pattern: "1GCG", model: "Silverado 1500", engine: "5.3L V8" },
  { pattern: "2T1BU", model: "Camry" },
  { pattern: "4T1B", model: "Camry" },
  { pattern: "1HGCM", model: "Accord", engine: "1.5L Turbo" },
  { pattern: "1HGCV", model: "Civic", engine: "2.0L 4-Cyl" },
  { pattern: "JHMFA", model: "Civic", engine: "1.5L Turbo" },
  { pattern: "JHLR", model: "CR-V" },
  { pattern: "WBA3", model: "3 Series" },
  { pattern: "WBA4", model: "4 Series" },
  { pattern: "WBA5", model: "5 Series" },
  { pattern: "WAUB", model: "A4" },
  { pattern: "WAU2", model: "A3" },
  { pattern: "1N4B", model: "Altima" },
  { pattern: "1N4AA", model: "Altima" },
  { pattern: "KMHD", model: "Elantra" },
  { pattern: "5N1A", model: "Rogue" },
];

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

export interface DecodedVehicle {
  vin: string;
  year: number;
  make: string;
  model: string;
  engine?: string;
  trim?: string;
  plant?: string;
  serial?: string;
  source: "local-decoder";
}

export function decodeVin(vinRaw: string): DecodedVehicle {
  const vin = vinRaw.trim().toUpperCase();
  if (!VIN_REGEX.test(vin)) {
    throw new AppError(400, "Invalid VIN: must be 17 characters (I, O, Q excluded)");
  }

  const wmi = vin.slice(0, 3);
  const vds = vin.slice(3, 9);
  const yearChar = vin[9] ?? "";

  const makeMatch = WMI_MAKES.find((entry) => wmi.startsWith(entry.prefix));
  const make = makeMatch?.make ?? "Unknown";

  const year = yearFromChar(yearChar, new Date().getFullYear());

  const modelHint = MODEL_HINTS.find((h) => vin.startsWith(h.pattern));
  const model = modelHint?.model ?? "Unknown";

  return {
    vin,
    year,
    make,
    model,
    engine: modelHint?.engine,
    plant: vin[10] ?? undefined,
    serial: vin.slice(11),
    source: "local-decoder",
  };
}
