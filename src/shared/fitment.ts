import type { Part, Vehicle } from "./types";

/**
 * Returns true when a part is compatible with a vehicle, or universal.
 * Without an active vehicle, parts are assumed compatible (fitment guarantee).
 */
export function isCompatible(part: Part, vehicle: Vehicle | null): boolean {
  if (!vehicle) return true;
  const c = part.compatibility;
  if (c.universal) return true;
  if (c.makes?.length && !c.makes.includes(vehicle.make)) return false;
  if (c.models?.length && !c.models.includes(vehicle.model)) return false;
  if (c.years?.length && !c.years.includes(vehicle.year)) return false;
  if (c.engines?.length && vehicle.engine && !c.engines.includes(vehicle.engine)) return false;
  return true;
}
