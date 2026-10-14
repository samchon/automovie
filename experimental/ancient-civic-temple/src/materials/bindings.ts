/** Applies the authored surface palette to the assembled temple meshes. */
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieMaterial,
} from "@automovie/interface";
import { templeSpaceFinishes } from "./templeSpaceFinishes";

type Finish =
  | "limestone"
  | "paving"
  | "paving-small"
  | "dado"
  | "dark-metal"
  | "dark-wood"
  | "terracotta"
  | "roof-terracotta"
  | "wicker"
  | "parchment"
  | "linen"
  | "rope-fibre"
  | "soil"
  | "distant-earth"
  | "water"
  | "foliage"
  | "plaster";
export const templeMaterialPalette: Record<
  Finish,
  {
    color: number;
    roughness: number;
    metallic: number;
    scale: number;
    image: string | null;
  }
> = {
  limestone: {
    color: 0xc9c0ad,
    roughness: 0.86,
    metallic: 0,
    scale: 1,
    image: "stone",
  },
  paving: {
    color: 0xc9c0ad,
    roughness: 0.9,
    metallic: 0,
    scale: 2,
    image: "paving",
  },
  "paving-small": {
    color: 0xc9c0ad,
    roughness: 0.9,
    metallic: 0,
    scale: 1,
    image: "paving",
  },
  dado: {
    color: 0x866350,
    roughness: 0.94,
    metallic: 0,
    scale: 1.5,
    image: "plaster",
  },
  "dark-metal": {
    color: 0x574b39,
    roughness: 0.39,
    metallic: 0.82,
    scale: 0.18,
    image: null,
  },
  "dark-wood": {
    color: 0x795339,
    roughness: 0.78,
    metallic: 0,
    scale: 1,
    image: "timber",
  },
  terracotta: {
    color: 0x9a684b,
    roughness: 0.72,
    metallic: 0,
    scale: 0.22,
    image: null,
  },
  "roof-terracotta": {
    color: 0x874b38,
    roughness: 0.84,
    metallic: 0,
    scale: 0.5,
    image: "tile",
  },
  wicker: {
    color: 0xa58658,
    roughness: 0.96,
    metallic: 0,
    scale: 0.11,
    image: null,
  },
  parchment: {
    color: 0xc6aa77,
    roughness: 0.92,
    metallic: 0,
    scale: 0.16,
    image: null,
  },
  linen: {
    color: 0x8a7564,
    roughness: 0.98,
    metallic: 0,
    scale: 0.25,
    image: "textile",
  },
  "rope-fibre": {
    color: 0x96805c,
    roughness: 0.96,
    metallic: 0,
    scale: 0.1,
    image: null,
  },
  soil: {
    color: 0x8c795c,
    roughness: 1,
    metallic: 0,
    scale: 0.25,
    image: "earth",
  },
  "distant-earth": {
    color: 0x827e69,
    roughness: 1,
    metallic: 0,
    scale: 1,
    image: null,
  },
  water: {
    color: 0x668b91,
    roughness: 0.2,
    metallic: 0,
    scale: 0.5,
    image: null,
  },
  foliage: {
    color: 0x526448,
    roughness: 1,
    metallic: 0,
    scale: 0.28,
    image: null,
  },
  plaster: {
    color: 0xcdb68e,
    roughness: 0.96,
    metallic: 0,
    scale: 1.5,
    image: "plaster",
  },
};

const linear = (channel: number): number => {
  const srgb = channel / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
};

const material = (finish: Finish): IAutoMovieMaterial => {
  const { color, roughness, metallic, image, scale } =
    templeMaterialPalette[finish];
  return {
    id: `temple.${finish}`,
    name: finish,
    baseColor: {
      r: linear((color >> 16) & 255),
      g: linear((color >> 8) & 255),
      b: linear(color & 255),
      a: 1,
      hex: null,
    },
    metallic,
    roughness,
    emissive: null,
    opacity: 1,
    baseColorTexture:
      image === null
        ? null
        : {
            asset: `textures/${image}.png`,
            texCoord: 0,
            coordinateSource: "surface-metres",
            colorSpace: "srgb",
            transform: {
              offset: { x: 0, y: 0 },
              scale: { x: 1 / scale, y: 1 / scale },
              rotationDeg: 0,
            },
            sampler: {
              wrapS: "repeat",
              wrapT: "repeat",
              minFilter: "linearMipmapLinear",
              magFilter: "linear",
            },
          },
  };
};
export const templeSpaceFinish: (id: string) => Finish = (id: string): Finish => {
  if (!Object.hasOwn(templeSpaceFinishes, id))
    throw new Error(`${id}: no space finish`);
  return templeSpaceFinishes[id]!;
};

/** Private part table consumed by the public templeModelFinish classifier. */
const objectFinishes: Readonly<
  Record<string, Readonly<Record<string, Finish>>>
> = {
  "fixture.altar": {
    step: "limestone",
    top: "limestone",
    support: "limestone",
  },
  "fixture.niche": {
    plinth: "limestone",
    body: "limestone",
    "recess-frame": "limestone",
    recess: "limestone",
    cap: "limestone",
  },
  "fixture.lampstand": {
    foot: "dark-metal",
    stem: "dark-metal",
    knop: "dark-metal",
    dish: "dark-metal",
  },
  "fixture.offering-table": { top: "limestone", trestle: "limestone" },
  "fixture.display-shelf.offering": { side: "dark-wood", board: "dark-wood" },
  "fixture.display-shelf.administration": {
    side: "dark-wood",
    board: "dark-wood",
  },
  "fixture.desk.writing": {
    top: "dark-wood",
    leg: "dark-wood",
    stretcher: "dark-wood",
  },
  "fixture.desk.reading": {
    top: "dark-wood",
    leg: "dark-wood",
    stretcher: "dark-wood",
  },
  "fixture.stool": {
    seat: "dark-wood",
    leg: "dark-wood",
    stretcher: "dark-wood",
  },
  "fixture.scroll-shelf": {
    frame: "dark-wood",
    board: "dark-wood",
    divider: "dark-wood",
  },
  "fixture.chest": {
    body: "dark-wood",
    lid: "dark-wood",
    hasp: "dark-metal",
    strap: "dark-metal",
  },
  "ware.storage-jar": { body: "terracotta", handle: "terracotta" },
  "ware.carry-jar": { body: "terracotta", handle: "terracotta" },
  "ware.small-vessel": { body: "terracotta", handle: "terracotta" },
  "ware.offering-bowl": { bowl: "dark-metal" },
  "ware.basket": { wall: "wicker", rim: "wicker", floor: "wicker" },
  "ware.scroll.rolled": { sheet: "parchment", tie: "rope-fibre" },
  "ware.scroll.bundle": {
    "sheet-1": "parchment",
    "sheet-2": "parchment",
    "sheet-3": "parchment",
    tie: "rope-fibre",
  },
  "ware.scroll.open": { sheet: "parchment" },
  "portable.bench.standard": { seat: "limestone", pier: "limestone" },
  "portable.bench.short": { seat: "limestone", pier: "limestone" },
  "portable.lamp": {
    foot: "dark-metal",
    stem: "dark-metal",
    dish: "dark-metal",
  },
  "portable.jar-rack": {
    top: "dark-wood",
    leg: "dark-wood",
    well: "dark-wood",
  },
  "portable.carrying-yoke": { beam: "dark-wood", hook: "dark-metal" },
  "portable.handcart": {
    deck: "dark-wood",
    handle: "dark-wood",
    support: "dark-wood",
    axle: "dark-wood",
    wheel: "dark-wood",
  },
  "portable.bucket": { body: "terracotta", handle: "terracotta" },
  "portable.planter": { pot: "terracotta", soil: "soil" },
  "portable.votive-plaque": { base: "limestone", slab: "limestone" },
  "portable.offering-tray": { floor: "dark-metal", rim: "dark-metal" },
  "portable.textile.standard": { cloth: "linen" },
  "portable.textile.small": { cloth: "linen" },
  "portable.stylus": { shaft: "dark-metal", tip: "dark-metal" },
  "portable.writing-tablet": {
    frame: "dark-wood",
    "writing-face": "parchment",
  },
  "portable.rope-coil": { rope: "rope-fibre", tie: "rope-fibre" },
  "ritual.censer": {
    foot: "dark-metal",
    stem: "dark-metal",
    cup: "dark-metal",
    ash: "soil",
    incense: "soil",
  },
  "ritual.floor-cushion": { base: "linen", pad: "linen", fold: "linen" },
  "ritual.jar-stand": {
    foot: "limestone",
    post: "limestone",
    ring: "limestone",
  },
};

/**
 * Explicit object IDs and parts require own table keys. Building and landscape prefix branches consume the source owners' admitted family IDs/parts; this classifier does not independently enumerate or validate every member of those families.
 *
 */
export const templeModelFinish: (id: string, part: string) => Finish = (id: string, part: string): Finish => {
  if (Object.hasOwn(objectFinishes, id)) {
    const parts: Readonly<Record<string, Finish>> = objectFinishes[id]!;
    if (!Object.hasOwn(parts, part))
      throw new Error(`${id}/${part}: no object part finish`);
    return parts[part]!;
  }
  if (id.startsWith("landscape.neighbor-house."))
    return part === "roof"
      ? "roof-terracotta"
      : part === "plinth"
        ? "limestone"
        : "plaster";
  if (id === "landscape.cypress" || id === "landscape.broad-tree")
    return part === "crown" ? "foliage" : "dark-wood";
  if (id === "landscape.grass-tuft") return "foliage";
  if (
    id.startsWith("column.") ||
    id.startsWith("frame.") ||
    id === "entablature.porch"
  )
    return "limestone";
  if (
    id.startsWith("beam.") ||
    id.startsWith("rafter.") ||
    id.startsWith("truss.") ||
    id.startsWith("joist.")
  )
    return "dark-wood";
  if (id.startsWith("tile.")) return "roof-terracotta";
  if (id.startsWith("door."))
    return ["plate", "pin", "ring", "hinge", "strap"].includes(part)
      ? "dark-metal"
      : "dark-wood";
  if (id === "fixture.fountain" || id === "fountain")
    return ["water", "ripple", "jet"].includes(part) ? "water" : "limestone";
  throw new Error(`${id}/${part}: no model finish`);
};
export const bindTempleMaterials = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvironment => ({
  ...environment,
  models: environment.models.map((model) => {
    const assignments = model.parts.map((part) => ({
      part,
      finish: part.id.startsWith("surface.")
        ? templeSpaceFinish(part.id)
        : templeModelFinish(model.id, part.id),
    }));
    const finishes = [...new Set(assignments.map((entry) => entry.finish))];
    return {
      ...model,
      materials: finishes.map(material),
      parts: assignments.map(({ part, finish }) => ({
        ...part,
        material: `temple.${finish}`,
      })),
    };
  }),
});
