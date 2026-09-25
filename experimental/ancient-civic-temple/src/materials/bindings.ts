/**
 * Bind the temple's existing, named model surfaces to its authored finish palette.
 * Model and space owners keep geometry and UVs; this layer assigns only optical
 * response. A new part without an explicit material rule fails at assembly, so
 * the renderer never silently returns to the neutral review clay.
 */
import type { IAutoMovieBuiltEnvironment, IAutoMovieMaterial } from "@automovie/interface";

type Finish = "stone" | "paving" | "plaster" | "dado" | "timber" | "tile" | "bronze" | "textile" | "earth" | "ceramic" | "wicker" | "paper" | "water";
const recipe: Record<Finish, { name: string; color: number; roughness: number; metallic: number }> = {
  stone: { name: "pale limestone", color: 0xc9c0ad, roughness: 0.86, metallic: 0 },
  paving: { name: "jointed limestone paving", color: 0xc9c0ad, roughness: 0.9, metallic: 0 },
  plaster: { name: "warm lime plaster", color: 0xcdb68e, roughness: 0.96, metallic: 0 },
  dado: { name: "earthen lower wall", color: 0x866350, roughness: 0.95, metallic: 0 },
  timber: { name: "weathered timber", color: 0x795339, roughness: 0.78, metallic: 0 },
  tile: { name: "fired roof tile", color: 0x874b38, roughness: 0.84, metallic: 0 },
  bronze: { name: "dark bronze", color: 0x574b39, roughness: 0.39, metallic: 0.82 },
  textile: { name: "muted woven cloth", color: 0x8a7564, roughness: 0.98, metallic: 0 },
  earth: { name: "packed earth", color: 0x8c795c, roughness: 1, metallic: 0 },
  ceramic: { name: "fired earthenware", color: 0x9a684b, roughness: 0.72, metallic: 0 },
  wicker: { name: "dry plant fibre", color: 0xa58658, roughness: 0.96, metallic: 0 },
  paper: { name: "parchment and waxed writing face", color: 0xc6aa77, roughness: 0.91, metallic: 0 },
  water: { name: "fountain water", color: 0x668b91, roughness: 0.2, metallic: 0 },
};

const linear = (channel: number): number => {
  const srgb = channel / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
};

const tileMetres: Partial<Record<Finish, number>> = {
  stone: 1,
  paving: 2,
  plaster: 1.5,
  timber: 1,
  tile: 0.5,
  textile: 0.25,
  earth: 1,
};

const material = (finish: Finish): IAutoMovieMaterial => {
  const { name, color, roughness, metallic } = recipe[finish];
  const tile = tileMetres[finish];
  return {
    id: `temple.${finish}`,
    name,
    baseColor: { r: linear((color >> 16) & 255), g: linear((color >> 8) & 255), b: linear(color & 255), a: 1, hex: null },
    metallic,
    roughness,
    emissive: null,
    opacity: 1,
    baseColorTexture: tile === undefined ? null : {
      asset: `textures/${finish}.png`,
      texCoord: 0,
      coordinateSource: "surface-metres",
      colorSpace: "srgb",
      transform: { offset: { x: 0, y: 0 }, scale: { x: 1 / tile, y: 1 / tile }, rotationDeg: 0 },
      sampler: { wrapS: "repeat", wrapT: "repeat", minFilter: "linearMipmapLinear", magFilter: "linear" },
    },
  };
};

const objectFinish = (model: string, part: string): Finish => {
  const id = model.slice("object.".length);
  if (id === "fountain") return ["water", "jet", "ripple"].includes(part) ? "water" : "stone";
  if (["altar", "niche", "votive-plaque"].includes(id)) return "stone";
  if (["lampstand", "portable-lamp", "stylus", "jar-stand"].includes(id)) return "bronze";
  if (id === "censer") return ["ash", "incense"].includes(part) ? "earth" : "bronze";
  if (["storage-jar", "carry-jar", "small-vessel", "offering-bowl"].includes(id)) return "ceramic";
  if (id === "planter") return part === "soil" ? "earth" : "ceramic";
  if (["basket", "rope-coil"].includes(id)) return "wicker";
  if (["scroll", "scroll-bundle", "open-scroll"].includes(id)) return part === "sheet" ? "paper" : "textile";
  if (id === "textile" || id === "floor-cushion") return "textile";
  if (id === "writing-tablet" && part === "writing-face") return "paper";
  if (id === "chest" && ["hasp", "strap"].includes(part)) return "bronze";
  if (id === "carrying-yoke" && part === "hook") return "bronze";
  if (["offering-table", "display-shelf", "display-shelf-office", "desk", "reading-desk", "stool", "scroll-shelf", "chest", "bench", "jar-rack", "carrying-yoke", "handcart", "bucket", "offering-tray", "writing-tablet"].includes(id)) return "timber";
  throw new Error(`${model}/${part}: material surface has no authored assignment`);
};

const finishFor = (model: string, part: string): Finish => {
  if (model.startsWith("object.")) return objectFinish(model, part);
  if (part === "surface.site.earth" || part === "surface.site.ground" || part.startsWith("surface.site-distant.")) return "earth";
  if (part === "surface.site.paving") return "paving";
  if (part === "surface.site.curb") return "stone";
  if (part.endsWith(".dado")) return "dado";
  if (part.endsWith(".floor")) return "paving";
  if (part.endsWith(".footing") || part.endsWith(".plinth") || part.endsWith(".coping") || part.endsWith(".reveal")) return "stone";
  if (part.endsWith(".upper")) return "tile";
  if (part.endsWith(".soffit") || part.endsWith(".ceiling-back") || part === "surface.colonnade.ceiling") return "timber";
  if (part.startsWith("surface.")) return "plaster";
  throw new Error(`${model}/${part}: material surface has no authored assignment`);
};

/** Assign one finish to every existing part while preserving geometry and placements. */
export const bindTempleMaterials = (environment: IAutoMovieBuiltEnvironment): IAutoMovieBuiltEnvironment => ({
  ...environment,
  models: environment.models.map((model) => {
    const assignments = model.parts.map((part) => ({ part, finish: finishFor(model.id, part.id) }));
    const finishes = [...new Set(assignments.map((entry) => entry.finish))];
    return {
      ...model,
      materials: finishes.map(material),
      parts: assignments.map(({ part, finish }) => ({ ...part, material: `temple.${finish}` })),
    };
  }),
});
