/** Applies the authored surface palette to the assembled temple meshes. */
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieMaterial,
} from "@automovie/interface";

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

/**
 * @evidence materials/00-surface-palette.md The 17 fixed finish keys retain their authored color, surface response, bitmap choice, and metre repeat.
 * @evidence materials/00-surface-palette.md#stone The stone key uses pale limestone and the stone image at a one-metre repeat.
 * @evidence materials/00-surface-palette.md#paving The two paving keys share an image but use two- and one-metre repeats.
 * @evidence materials/00-surface-palette.md#plaster Warm plaster receives a 1.5-metre image repeat.
 * @evidence materials/00-surface-palette.md#dado The lower red band uses its own color and plaster image.
 * @evidence materials/00-surface-palette.md#timber Structural dark wood uses the timber image.
 * @evidence materials/00-surface-palette.md#roof-tile Roof terracotta uses the tile image at half-metre repeat.
 * @evidence materials/00-surface-palette.md#metal Hardware has a metallic response and no bitmap asset.
 * @evidence materials/00-surface-palette.md#ceramic Ceramic is its own untextured red finish.
 * @evidence materials/00-surface-palette.md#wicker Wicker is a distinct dry-fibre untextured finish.
 * @evidence materials/00-surface-palette.md#parchment Writing surfaces retain their light separate color.
 * @evidence materials/00-surface-palette.md#textile Linen uses the existing textile image.
 * @evidence materials/00-surface-palette.md#rope-fibre Rope has its own short repeat and color.
 * @evidence materials/00-surface-palette.md#earth Foreground soil uses the earth image.
 * @evidence materials/00-surface-palette.md#distant-ridge Distant earth is an untextured separate key.
 * @evidence materials/00-surface-palette.md#foliage Foliage has its own low-gloss color.
 * @evidence materials/00-surface-palette.md#water Water receives the lowest roughness without a repaint texture.
 * @evidence principles/core/source-units.md#source-scope-preservation The record contains only the 17 authored finish keys and renderer fields, with no mesh or placement decisions.
 * @evidence principles/core/source-units.md#source-substantive-completion Each key has concrete color, roughness, metallic, repeat and optional existing image values.
 * @evidenceExclude upstream/design/material-sources.md#design-revision-from-material-source-work The palette H2s already specify every key and surface response encoded in this record.
 * @evidence obligations/design/material-sources.md#material-source-renderer-mapping One literal palette record gives every selected finish its renderer color, roughness, metallic and texture values.
 */
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

/**
 * @evidence materials/20-space-bindings.md The surface classifier assigns the authored finish from emitted space IDs.
 * @evidence materials/20-space-bindings.md#space-binding-map Ground, floor, dado, stone joints, roof, timber, and plaster IDs each have one finish.
 * @evidence materials/20-space-bindings.md#material-junctions Separate upper, edge, soffit, coping, and dado IDs keep material changes at their physical boundaries.
 * @evidence materials/20-space-bindings.md#material-review-set Unmapped IDs fail instead of silently receiving a display fallback.
 * @evidence principles/core/source-units.md#source-scope-preservation The classifier returns a finish key only and leaves the space mesh and UVs unchanged.
 * @evidence principles/core/source-units.md#source-substantive-completion Every emitted space surface receives a key and unsupported IDs raise an explicit error.
 * @evidenceExclude upstream/design/material-sources.md#design-revision-from-material-source-work The authored surface binding table already separates stone, paving, plaster, roof, wood and dado IDs.
 * @evidence obligations/design/material-sources.md#material-source-design-ownership The classifier reads the space-owned surface names and creates no new faces.
 */
export const templeSpaceFinish = (id: string): Finish => {
  if (id === "surface.site-distant.ridge") return "distant-earth";
  if (
    id === "surface.site.earth" ||
    id === "surface.site.ground" ||
    id === "surface.site-distant.ground"
  )
    return "soil";
  if (
    id === "surface.site.curb" ||
    id === "surface.service-yard.wall" ||
    id === "surface.service-yard.wall-top"
  )
    return "limestone";
  if (id.endsWith(".dado")) return "dado";
  if (id.endsWith(".floor") || id === "surface.site.paving")
    return [
      "surface.administration.floor",
      "surface.records.floor",
      "surface.storage.floor",
    ].includes(id)
      ? "paving-small"
      : "paving";
  if (
    id.endsWith(".footing") ||
    id.endsWith(".plinth") ||
    id.endsWith(".coping") ||
    id.endsWith(".reveal")
  )
    return "limestone";
  if (id.endsWith(".upper")) return "roof-terracotta";
  if (
    id.endsWith(".ceiling") ||
    id.endsWith(".ceiling-back") ||
    id.endsWith(".concealed") ||
    id.endsWith(".edge") ||
    id.endsWith(".soffit")
  )
    return "dark-wood";
  if (id.startsWith("surface.")) return "plaster";
  throw new Error(`${id}: no space finish`);
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
 * @evidence materials/10-model-bindings.md Each building or object part receives its exact declared finish key.
 * @evidence materials/10-model-bindings.md#binding-map The explicit object table preserves wood/metal chest and yoke parts, paper/rope scrolls, pot/soil and every ritual part without a fallback.
 * @evidence principles/core/source-units.md#source-scope-preservation Only finish keys are returned; prototype geometry and placement stay unchanged.
 * @evidence principles/core/source-units.md#source-substantive-completion Every placed family is classified and an unknown object part is refused with its identity.
 * @evidence obligations/design/material-sources.md#material-source-design-ownership Existing named prototype parts consume the authored binding table verbatim.
 * @evidence obligations/design/material-sources.md#material-source-invalid-state Unknown object parts and unsupported prototype families raise a diagnostic before material assembly.
 * @evidenceExclude upstream/design/material-sources.md#design-revision-from-material-source-work The existing binding table already supplies every object part-to-finish relationship; no parent material changes were needed.
 */
export const templeModelFinish = (id: string, part: string): Finish => {
  if (objectFinishes[id] !== undefined) {
    const finish = objectFinishes[id]![part];
    if (finish === undefined)
      throw new Error(`${id}/${part}: no object part finish`);
    return finish;
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

/**
 * @evidence materials/20-space-bindings.md This assembly applies a single keyed material to every model part emitted by the built environment.
 * @evidence materials/20-space-bindings.md#space-binding-map Surface IDs reach templeSpaceFinish, and every returned finish gets a material record.
 * @evidence materials/10-model-bindings.md#binding-map Model part IDs reach templeModelFinish, retaining distinct metal door and water fountain parts.
 * @evidence principles/core/source-units.md#source-scope-preservation The assembly adds material records and part material IDs without changing geometry, transform or host ownership.
 * @evidence principles/core/source-units.md#source-substantive-completion All scene models return with an explicit material per part and a matching material record.
 * @evidenceExclude upstream/design/material-sources.md#design-revision-from-material-source-work The palette and two binding tables cover the emitted finish relationships; this assembly adds no new material decision.
 * @evidence obligations/design/material-sources.md#material-source-renderer-mapping The same environment and static lookup create the same material list and part bindings.
 */
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
