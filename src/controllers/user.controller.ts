import type { NextFunction, Request, Response } from "express";
import { AppError } from "../middleware/errorHandler.js";
import type { VehicleDoc } from "../models/vehicle.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { toPublicUser } from "../services/token.service.js";
import type { ProfileUpdateInput } from "../shared/index.js";

export function getMe(req: Request, res: Response): void {
  res.json({ user: toPublicUser(req.user!) });
}

export async function updateMe(
  req: Request<object, object, ProfileUpdateInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = req.user!;
    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.address !== undefined) user.address = req.body.address;
    await user.save();
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function listVehicles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vehicles = await Vehicle.find({ userId: req.user!._id }).sort({ isPrimary: -1, createdAt: 1 });
    res.json({ vehicles });
  } catch (err) {
    next(err);
  }
}

export async function addVehicle(
  req: Request<object, object, Record<string, unknown>>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!._id;
    const count = await Vehicle.countDocuments({ userId });
    if (count >= 10) {
      throw new AppError(400, "Garage limit reached (max 10 vehicles)");
    }

    const vehicle = await Vehicle.create({
      userId,
      ...req.body,
      isPrimary: req.body.isPrimary === true || count === 0,
    });

    if (vehicle.isPrimary) {
      await Vehicle.updateMany(
        { userId, _id: { $ne: vehicle._id } },
        { $set: { isPrimary: false } },
      );
    }

    res.status(201).json({ vehicle });
  } catch (err) {
    next(err);
  }
}

export async function updateVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vehicle = await getOwnedVehicle(req);
    if (!vehicle) {
      throw new AppError(404, "Vehicle not found");
    }

    const body = req.body as Record<string, unknown>;
    if (body.isPrimary === true) {
      await Vehicle.updateMany(
        { userId: req.user!._id, _id: { $ne: vehicle._id } },
        { $set: { isPrimary: false } },
      );
    }

    const allowed = ["year", "make", "model", "engine", "trim", "vin", "isPrimary"];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        (vehicle as unknown as Record<string, unknown>)[key] = body[key];
      }
    }
    await vehicle.save();
    res.json({ vehicle });
  } catch (err) {
    next(err);
  }
}

export async function deleteVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vehicle = await getOwnedVehicle(req);
    if (!vehicle) {
      throw new AppError(404, "Vehicle not found");
    }
    await vehicle.deleteOne();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function getOwnedVehicle(req: Request): Promise<VehicleDoc | null> {
  const { id } = req.params as { id: string };
  return Vehicle.findOne({ _id: id, userId: req.user!._id });
}
