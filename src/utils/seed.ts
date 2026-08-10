import { connectDb, disconnectDb } from "../config/db.js";
import logger from "../config/logger.js";
import { Category } from "../models/category.model.js";
import { Diagram } from "../models/diagram.model.js";
import { MaintenanceTask } from "../models/maintenanceTask.model.js";
import { Part } from "../models/part.model.js";
import { Review } from "../models/review.model.js";
import { CATEGORY_SEED, PART_SEED, REVIEW_SEED } from "../data/catalogSeed.js";
import { DIAGRAM_SEED } from "../data/diagramSeed.js";
import { MAINTENANCE_SEED } from "../data/maintenanceSeed.js";

async function seed(): Promise<void> {
  await connectDb();

  logger.info("Seeding categories…");
  const categories = await Promise.all(
    CATEGORY_SEED.map((c) =>
      Category.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true }).lean(),
    ),
  );
  logger.info(`Seeded ${categories.length} categories.`);

  logger.info("Seeding parts…");
  const partByPrototypeId = new Map<string, string>();
  for (const p of PART_SEED) {
    const { id, ...rest } = p;
    const doc = await Part.findOneAndUpdate(
      { partNumber: rest.partNumber },
      { ...rest },
      { upsert: true, new: true },
    ).lean();
    partByPrototypeId.set(id, String(doc?._id));
  }
  logger.info(`Seeded ${PART_SEED.length} parts.`);

  logger.info("Seeding reviews…");
  for (const r of REVIEW_SEED) {
    const mongoPartId = partByPrototypeId.get(r.partId);
    if (!mongoPartId) continue;
    await Review.findOneAndUpdate(
      { partId: mongoPartId, title: r.title },
      { ...r, partId: mongoPartId },
      { upsert: true, new: true },
    ).lean();
  }
  logger.info(`Seeded ${REVIEW_SEED.length} reviews.`);

  logger.info("Seeding diagrams…");
  for (const d of DIAGRAM_SEED) {
    const { id, ...rest } = d;
    const hotspots = d.hotspots.map((h) => ({
      ...h,
      partId: partByPrototypeId.get(h.partId) ?? h.partId,
    }));
    await Diagram.findOneAndUpdate(
      { slug: id },
      { ...rest, slug: id, hotspots },
      { upsert: true, new: true },
    ).lean();
  }
  logger.info(`Seeded ${DIAGRAM_SEED.length} diagrams.`);

  logger.info("Seeding maintenance tasks…");
  for (const [index, t] of MAINTENANCE_SEED.entries()) {
    const recommendedPartIds = t.recommendedPartIds.map(
      (pid) => partByPrototypeId.get(pid) ?? pid,
    );
    await MaintenanceTask.findOneAndUpdate(
      { mileageInterval: t.mileageInterval },
      { ...t, recommendedPartIds, sortOrder: index },
      { upsert: true, new: true },
    ).lean();
  }
  logger.info(`Seeded ${MAINTENANCE_SEED.length} maintenance tasks.`);

  await disconnectDb();
  logger.info("Catalog seed complete.");
}

seed().catch((err) => {
  logger.error({ err }, "Seeding failed");
  process.exit(1);
});
