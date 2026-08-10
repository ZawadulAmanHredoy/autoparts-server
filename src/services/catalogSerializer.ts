import type { Part, PartSpec } from "../shared/index.js";
import type { PartDoc } from "../models/part.model.js";

export function toPublicPart(doc: PartDoc): Part {
  return {
    id: String(doc._id),
    name: doc.name,
    brand: doc.brand,
    partNumber: doc.partNumber,
    oemNumber: doc.oemNumber ?? "",
    category: doc.category,
    subcategory: doc.subcategory ?? "",
    price: doc.price,
    originalPrice: doc.originalPrice ?? undefined,
    rating: doc.rating,
    reviewCount: doc.reviewCount,
    inStock: doc.inStock,
    stockCount: doc.stockCount,
    images: doc.images,
    description: doc.description ?? "",
    specifications: (doc.specifications ?? []).map((s) => ({ name: s.name, value: s.value }) as PartSpec),
    compatibility: {
      makes: doc.compatibility?.makes ?? [],
      models: doc.compatibility?.models ?? [],
      years: doc.compatibility?.years ?? [],
      engines: doc.compatibility?.engines ?? [],
      universal: doc.compatibility?.universal ?? false,
    },
    difficulty: doc.difficulty,
    estimatedInstallTime: doc.estimatedInstallTime ?? "",
    warranty: doc.warranty ?? "",
    isPopular: doc.isPopular,
    isBestSeller: doc.isBestSeller,
  };
}
