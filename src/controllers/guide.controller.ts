import type { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Diagram } from "../models/diagram.model.js";
import { MaintenanceTask } from "../models/maintenanceTask.model.js";

/** GET /api/diagrams */
export const listDiagrams = asyncHandler(async (_req, res: Response) => {
  const diagrams = await Diagram.find().sort({ sortOrder: 1 }).lean();
  res.json({ items: diagrams });
});

/** GET /api/maintenance-tasks */
export const listMaintenanceTasks = asyncHandler(async (_req, res: Response) => {
  const tasks = await MaintenanceTask.find().sort({ mileageInterval: 1, sortOrder: 1 }).lean();
  res.json({ items: tasks });
});
