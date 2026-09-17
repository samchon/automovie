import { revolveAutoMovieProfile } from "@automovie/engine";
import type {
  IAutoMovieColor,
  IAutoMovieGeometry,
  IAutoMovieLibraryBuildContext,
  IAutoMovieLibraryContribution,
  IAutoMovieLibrarySourceOwner,
  IAutoMovieMaterial,
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
  AutoMoviePrimitiveShape,
} from "@automovie/interface";

const IDENTITY = {
  x: 0,
  y: 0,
  z: 0,
  w: 1,
} as const;

const vector = (x: number, y: number, z: number): IAutoMovieVector3 => ({
  x,
  y,
  z,
});

const transform = (translation: IAutoMovieVector3): IAutoMovieTransform => ({
  translation,
  rotation: IDENTITY,
  scale: vector(1, 1, 1),
});

type Palette = Readonly<{
  baseColor: IAutoMovieColor;
  metallic: number;
  roughness: number;
}>;

const PALETTES: Readonly<Record<string, Palette>> = {
  ceramic: {
    baseColor: { r: 0.42, g: 0.16, b: 0.07, a: 1, hex: "#a86645" },
    metallic: 0,
    roughness: 0.82,
  },
  fiber: {
    baseColor: { r: 0.28, g: 0.17, b: 0.08, a: 1, hex: "#8d6a43" },
    metallic: 0,
    roughness: 0.92,
  },
  metal: {
    baseColor: { r: 0.18, g: 0.2, b: 0.18, a: 1, hex: "#77786d" },
    metallic: 0.65,
    roughness: 0.5,
  },
  roof: {
    baseColor: { r: 0.34, g: 0.12, b: 0.05, a: 1, hex: "#9f593d" },
    metallic: 0,
    roughness: 0.88,
  },
  stone: {
    baseColor: { r: 0.47, g: 0.4, b: 0.3, a: 1, hex: "#b7aa92" },
    metallic: 0,
    roughness: 0.84,
  },
  water: {
    baseColor: { r: 0.08, g: 0.28, b: 0.31, a: 1, hex: "#4d9a9f" },
    metallic: 0,
    roughness: 0.3,
  },
  wood: {
    baseColor: { r: 0.28, g: 0.12, b: 0.04, a: 1, hex: "#8c5738" },
    metallic: 0,
    roughness: 0.78,
  },
};

const paletteFor = (surface: string): Palette => {
  if (surface.includes("water")) return PALETTES.water;
  if (surface.includes("ceramic")) return PALETTES.ceramic;
  if (surface.includes("fiber")) return PALETTES.fiber;
  if (surface.includes("metal")) return PALETTES.metal;
  if (surface.includes("roof")) return PALETTES.roof;
  if (surface.includes("wood")) return PALETTES.wood;
  if (surface.startsWith("lamp-")) return PALETTES.metal;
  if (
    surface.startsWith("bench-") ||
    surface.startsWith("records-table-") ||
    surface.startsWith("records-chest-") ||
    surface.startsWith("storage-chest-")
  )
    return PALETTES.wood;
  return PALETTES.stone;
};

const materialFor = (surface: string): IAutoMovieMaterial => {
  const palette = paletteFor(surface);
  return {
    id: surface,
    name: surface,
    baseColor: palette.baseColor,
    metallic: palette.metallic,
    roughness: palette.roughness,
    emissive: null,
    opacity: 1,
    baseColorTexture: null,
    alphaMode: "opaque",
    doubleSided: true,
  };
};

const primitive = (shape: AutoMoviePrimitiveShape): IAutoMovieGeometry => ({
  type: "primitive",
  shape,
});

const part = (
  id: string,
  geometry: IAutoMovieGeometry,
  at: IAutoMovieVector3,
  material: string,
): IAutoMovieModelPart => ({
  id,
  name: id,
  geometry,
  material,
  attachedBone: null,
  transform: transform(at),
});

const boxPart = (
  id: string,
  width: number,
  height: number,
  depth: number,
  at: IAutoMovieVector3,
  material: string,
): IAutoMovieModelPart =>
  part(
    id,
    primitive({ type: "box", width, height, depth }),
    at,
    material,
  );

const cylinderPart = (
  id: string,
  radius: number,
  height: number,
  at: IAutoMovieVector3,
  material: string,
): IAutoMovieModelPart =>
  part(id, primitive({ type: "cylinder", radius, height }), at, material);

const planePart = (
  id: string,
  width: number,
  depth: number,
  at: IAutoMovieVector3,
  material: string,
): IAutoMovieModelPart =>
  part(id, primitive({ type: "plane", width, depth }), at, material);

const revolvedPart = (
  id: string,
  profile: readonly { x: number; y: number }[],
  at: IAutoMovieVector3,
  material: string,
): IAutoMovieModelPart => {
  const mesh: IAutoMovieMesh = revolveAutoMovieProfile({
    profile,
    segments: 20,
  });
  return part(id, { type: "mesh", mesh }, at, material);
};

const model = (
  id: string,
  name: string,
  parts: IAutoMovieModelPart[],
): IAutoMovieModel => {
  const materials = [
    ...new Set(
      parts
        .map((item) => item.material)
        .filter((item): item is string => item !== null),
    ),
  ].map(materialFor);
  return {
    id,
    name,
    origin: "generated",
    parts,
    skeleton: null,
    body: null,
    materials,
    asset: null,
  };
};

const contribution = (built: IAutoMovieModel): IAutoMovieLibraryContribution => ({
  environments: [],
  models: [built],
});

const scaleBoardModel = (): IAutoMovieModel =>
  model("model/scale-board", "neutral comparison board", [
    boxPart(
      "scale-board/door-clear",
      1.1,
      2.1,
      0.08,
      vector(0, 1.05, 0),
      "scale-board-stone",
    ),
    boxPart(
      "scale-board/room-height",
      0.06,
      3.6,
      0.06,
      vector(0.9, 1.8, 0),
      "scale-board-stone",
    ),
  ]);

const columnModel = (): IAutoMovieModel =>
  model("model/column", "three-part stone column", [
    cylinderPart(
      "column/base",
      0.2,
      0.18,
      vector(0, 0.09, 0),
      "column-stone-base",
    ),
    revolvedPart(
      "column/shaft",
      [
        { x: 0.16, y: 0.18 },
        { x: 0.152, y: 2.92 },
      ],
      vector(0, 0, 0),
      "column-stone-shaft",
    ),
    cylinderPart(
      "column/capital",
      0.225,
      0.28,
      vector(0, 3.06, 0),
      "column-stone-capital",
    ),
  ]);

const doorModel = (): IAutoMovieModel =>
  model("model/door", "stone frame and wood leaf door", [
    boxPart(
      "door/frame-left",
      0.18,
      2.1,
      0.4,
      vector(-0.64, 1.05, 0),
      "door-frame-left-stone",
    ),
    boxPart(
      "door/frame-right",
      0.18,
      2.1,
      0.4,
      vector(0.64, 1.05, 0),
      "door-frame-right-stone",
    ),
    boxPart(
      "door/frame-lintel",
      1.46,
      0.22,
      0.4,
      vector(0, 2.21, 0),
      "door-frame-lintel-stone",
    ),
    boxPart(
      "door/leaf",
      1.1,
      2.1,
      0.32,
      vector(0, 1.05, 0),
      "door-leaf-wood",
    ),
  ]);

const basinModel = (): IAutoMovieModel =>
  model("model/fountain-basin", "open circular stone basin", [
    cylinderPart(
      "basin/foot",
      0.72,
      0.18,
      vector(0, 0.09, 0),
      "basin-stone-exterior",
    ),
    revolvedPart(
      "basin/wall",
      [
        { x: 0.85, y: 0.18 },
        { x: 0.85, y: 0.38 },
        { x: 0.62, y: 0.38 },
        { x: 0.62, y: 0.18 },
      ],
      vector(0, 0, 0),
      "basin-stone-exterior",
    ),
    revolvedPart(
      "basin/rim",
      [
        { x: 0.85, y: 0.38 },
        { x: 0.85, y: 0.42 },
        { x: 0.62, y: 0.42 },
        { x: 0.62, y: 0.38 },
      ],
      vector(0, 0, 0),
      "basin-stone-rim",
    ),
    planePart(
      "basin/water-seat",
      1.24,
      1.24,
      vector(0, 0.18, 0),
      "basin-water-seat",
    ),
  ]);

const streamModel = (): IAutoMovieModel =>
  model("model/fountain-stream", "single narrow static stream", [
    cylinderPart(
      "stream/base-contact",
      0.05,
      0.05,
      vector(0, 0.275, 0),
      "stream-water",
    ),
    cylinderPart(
      "stream/vertical-column",
      0.05,
      0.85,
      vector(0, 0.725, 0),
      "stream-water",
    ),
    cylinderPart(
      "stream/top-break",
      0.05,
      0.05,
      vector(0, 1.175, 0),
      "stream-water",
    ),
  ]);

const altarModel = (): IAutoMovieModel =>
  model("model/altar-plinth", "broad sanctuary altar and plinth", [
    boxPart(
      "altar/plinth",
      1.3,
      0.32,
      0.8,
      vector(0, 0.16, 0),
      "altar-plinth-stone",
    ),
    boxPart(
      "altar/body",
      0.9,
      0.5,
      0.48,
      vector(0, 0.57, 0),
      "altar-body-stone",
    ),
  ]);

const roofTileModel = (): IAutoMovieModel =>
  model("model/roof-tile", "overlapping terracotta roof tile", [
    boxPart(
      "roof-tile/body",
      0.72,
      0.08,
      0.44,
      vector(0.36, 0.04, 0.22),
      "roof-tile-top",
    ),
    boxPart(
      "roof-tile/overlap-lip",
      0.08,
      0.02,
      0.44,
      vector(0.68, 0.09, 0.22),
      "roof-tile-edge",
    ),
    planePart(
      "roof-tile/underside",
      0.72,
      0.44,
      vector(0.36, 0.005, 0.22),
      "roof-tile-underside",
    ),
  ]);

const recordsTableModel = (): IAutoMovieModel =>
  model("model/records-table", "records table", [
    boxPart(
      "records-table/top",
      1.2,
      0.1,
      0.6,
      vector(0, 0.71, 0),
      "records-table-top",
    ),
    ...[
      [-0.5, -0.2],
      [0.5, -0.2],
      [-0.5, 0.2],
      [0.5, 0.2],
    ].map(([x, z], index) =>
      boxPart(
        `records-table/leg-${index + 1}`,
        0.1,
        0.66,
        0.1,
        vector(x, 0.33, z),
        "records-table-legs",
      ),
    ),
  ]);

const recordsShelfModel = (): IAutoMovieModel =>
  model("model/records-shelf", "three-board records shelf", [
    boxPart(
      "records-shelf/frame-left",
      0.1,
      1.8,
      0.1,
      vector(-0.4, 0.9, 0),
      "records-shelf-frame-wood",
    ),
    boxPart(
      "records-shelf/frame-right",
      0.1,
      1.8,
      0.1,
      vector(0.4, 0.9, 0),
      "records-shelf-frame-wood",
    ),
    ...[
      [0.36, 0.44],
      [0.86, 0.94],
      [1.36, 1.44],
    ].map(([minY, maxY], index) =>
      boxPart(
        `records-shelf/board-${index + 1}`,
        0.8,
        maxY - minY,
        0.32,
        vector(0, (minY + maxY) / 2, 0),
        "records-shelf-board-wood",
      ),
    ),
  ]);

const recordsChestModel = (): IAutoMovieModel =>
  model("model/records-chest", "closed records chest", [
    boxPart(
      "records-chest/body",
      0.8,
      0.45,
      0.45,
      vector(0, 0.225, 0),
      "records-chest-body",
    ),
    boxPart(
      "records-chest/lid",
      0.8,
      0.1,
      0.45,
      vector(0, 0.5, 0),
      "records-chest-lid",
    ),
  ]);

const storageShelfModel = (): IAutoMovieModel =>
  model("model/storage-shelf", "four-board storage shelf", [
    boxPart(
      "storage-shelf/frame-left",
      0.1,
      1.7,
      0.1,
      vector(-0.4, 0.85, 0),
      "storage-shelf-frame-wood",
    ),
    boxPart(
      "storage-shelf/frame-right",
      0.1,
      1.7,
      0.1,
      vector(0.4, 0.85, 0),
      "storage-shelf-frame-wood",
    ),
    ...[
      [0.35, 0.43],
      [0.7, 0.78],
      [1.05, 1.13],
      [1.4, 1.48],
    ].map(([minY, maxY], index) =>
      boxPart(
        `storage-shelf/board-${index + 1}`,
        0.8,
        maxY - minY,
        0.34,
        vector(0, (minY + maxY) / 2, 0),
        "storage-shelf-board-wood",
      ),
    ),
  ]);

const storageChestModel = (): IAutoMovieModel =>
  model("model/storage-chest", "closed storage chest", [
    boxPart(
      "storage-chest/body",
      0.78,
      0.45,
      0.46,
      vector(0, 0.225, 0),
      "storage-chest-body",
    ),
    boxPart(
      "storage-chest/lid",
      0.78,
      0.1,
      0.46,
      vector(0, 0.5, 0),
      "storage-chest-lid",
    ),
  ]);

const storageBasketModel = (): IAutoMovieModel =>
  model("model/storage-basket", "open tapered storage basket", [
    cylinderPart(
      "storage-basket/base",
      0.18,
      0.08,
      vector(0, 0.04, 0),
      "storage-basket-fiber",
    ),
    revolvedPart(
      "storage-basket/body",
      [
        { x: 0.18, y: 0.08 },
        { x: 0.21, y: 0.4 },
        { x: 0.16, y: 0.4 },
        { x: 0.16, y: 0.08 },
      ],
      vector(0, 0, 0),
      "storage-basket-fiber",
    ),
    revolvedPart(
      "storage-basket/rim",
      [
        { x: 0.21, y: 0.4 },
        { x: 0.21, y: 0.44 },
        { x: 0.16, y: 0.44 },
        { x: 0.16, y: 0.4 },
      ],
      vector(0, 0, 0),
      "storage-basket-rim",
    ),
    boxPart(
      "storage-basket/handle",
      0.36,
      0.08,
      0.08,
      vector(0, 0.44, 0),
      "storage-basket-handle",
    ),
  ]);

const votiveDisplayModel = (): IAutoMovieModel =>
  model("model/votive-display", "recessed civic votive display", [
    boxPart(
      "votive-display/plinth",
      1.3,
      0.2,
      0.4,
      vector(0, 0.1, 0),
      "display-plinth-stone",
    ),
    boxPart(
      "votive-display/board-back",
      1.1,
      1.2,
      0.1,
      vector(0, 0.8, 0.03),
      "display-board-stone",
    ),
    boxPart(
      "votive-display/board-left",
      0.13,
      1.2,
      0.06,
      vector(-0.485, 0.8, -0.05),
      "display-board-stone",
    ),
    boxPart(
      "votive-display/board-right",
      0.13,
      1.2,
      0.06,
      vector(0.485, 0.8, -0.05),
      "display-board-stone",
    ),
    boxPart(
      "votive-display/board-bottom",
      0.84,
      0.6,
      0.06,
      vector(0, 0.5, -0.05),
      "display-board-stone",
    ),
    boxPart(
      "votive-display/board-top",
      0.84,
      0.18,
      0.06,
      vector(0, 1.31, -0.05),
      "display-board-stone",
    ),
    boxPart(
      "votive-display/ledge",
      1.16,
      0.1,
      0.22,
      vector(0, 0.67, -0.09),
      "display-ledge-stone",
    ),
  ]);

const ceramicVesselModel = (): IAutoMovieModel =>
  model("model/ceramic-vessel", "open-rim ceramic vessel", [
    cylinderPart(
      "ceramic-vessel/foot",
      0.1,
      0.04,
      vector(0, 0.02, 0),
      "ceramic-foot",
    ),
    revolvedPart(
      "ceramic-vessel/body",
      [
        { x: 0.16, y: 0.04 },
        { x: 0.16, y: 0.26 },
        { x: 0.1, y: 0.26 },
        { x: 0.1, y: 0.04 },
      ],
      vector(0, 0, 0),
      "ceramic-body",
    ),
    revolvedPart(
      "ceramic-vessel/neck",
      [
        { x: 0.1, y: 0.26 },
        { x: 0.1, y: 0.31 },
      ],
      vector(0, 0, 0),
      "ceramic-body",
    ),
    revolvedPart(
      "ceramic-vessel/rim",
      [
        { x: 0.1, y: 0.31 },
        { x: 0.13, y: 0.31 },
        { x: 0.13, y: 0.34 },
        { x: 0.1, y: 0.34 },
      ],
      vector(0, 0, 0),
      "ceramic-rim",
    ),
  ]);

const lampModel = (): IAutoMovieModel =>
  model("model/lamp", "three-part rigid lamp", [
    cylinderPart(
      "lamp/base",
      0.1,
      0.08,
      vector(0, 0.04, 0),
      "lamp-base",
    ),
    cylinderPart(
      "lamp/stem",
      0.03,
      0.22,
      vector(0, 0.19, 0),
      "lamp-stem",
    ),
    revolvedPart(
      "lamp/shade",
      [
        { x: 0.09, y: 0.3 },
        { x: 0.09, y: 0.42 },
        { x: 0.05, y: 0.42 },
        { x: 0.05, y: 0.3 },
      ],
      vector(0, 0, 0),
      "lamp-shade",
    ),
  ]);

const benchModel = (): IAutoMovieModel =>
  model("model/bench", "low civic bench with back rail", [
    boxPart(
      "bench/seat",
      1.4,
      0.12,
      0.48,
      vector(0, 0.36, 0),
      "bench-seat",
    ),
    ...[
      [-0.55, -0.14],
      [0.55, -0.14],
      [-0.55, 0.14],
      [0.55, 0.14],
    ].map(([x, z], index) =>
      boxPart(
        `bench/leg-${index + 1}`,
        0.1,
        0.3,
        0.1,
        vector(x, 0.15, z),
        "bench-legs",
      ),
    ),
    boxPart(
      "bench/back-rail",
      1.2,
      0.1,
      0.1,
      vector(0, 0.43, 0.19),
      "bench-back-rail",
    ),
  ]);

type ModelFactory = () => IAutoMovieModel;

class TempleModelSource implements IAutoMovieLibrarySourceOwner {
  public readonly design: string;
  private readonly factory: ModelFactory;

  public constructor(design: string, factory: ModelFactory) {
    this.design = design;
    this.factory = factory;
  }

  public build(
    context: IAutoMovieLibraryBuildContext,
  ): IAutoMovieLibraryContribution {
    if (context.design !== this.design)
      throw new Error(
        `Model source context ${context.design} does not match ${this.design}.`,
      );
    return contribution(this.factory());
  }
}

/**
 * @evidence models/temple-fit-out.md This export is the source owner for the file-level model design population.
 * @evidence models/temple-fit-out.md#model-scope-scale-and-fidelity The scale board emits `model/scale-board` with a 1.10 × 2.10 door-clear panel and a 3.60m room-height marker, so the source answers the population's shared comparison contract without placement.
 * @evidence principles/core/source-units.md#source-scope-preservation The export realizes only the scale-board model and keeps topology, placement, materials, and observations outside this source owner.
 * @evidence principles/core/source-units.md#source-substantive-completion The constructor binds a concrete reviewed design address to an executable factory that returns both declared comparison parts.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The scale-board source implements the reviewed panel dimensions, floor datum, and no-placement boundary without exposing a missing parent decision.
 * @evidence obligations/design/model-sources.md#design-owned-construction The factory's two named parts are the concrete construction of the scale-board design unit.
 * @evidence obligations/design/model-sources.md#deterministic-build The source has no mutable inputs or randomness and rebuilds the same two primitive parts on every call.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The board remains a fixed blocking comparison proxy and exposes no unsupported fidelity request.
 */
export class ModelScopeSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#model-scope-scale-and-fidelity",
      scaleBoardModel,
    );
  }
}

/**
 * @evidence models/temple-fit-out.md The exported class is the file-level source owner for the reviewed model library.
 * @evidence models/temple-fit-out.md#column-prototype The factory returns `model/column` as base radius 0.20m and height 0.18m, shaft profile 0.16m to 0.152m over Y 0.18..2.92m, and capital radius 0.225m over Y 2.92..3.20m.
 * @evidence principles/core/source-units.md#source-scope-preservation The source owns only the three-part column realization and does not add column placement, room topology, or material response.
 * @evidence principles/core/source-units.md#source-substantive-completion The executable factory supplies named base, shaft, and capital parts with their reviewed ranges and surfaces.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The implementation directly realizes the reviewed three-layer bounds and five-percent shaft taper, so no parent geometry decision was missing.
 * @evidence obligations/design/model-sources.md#design-owned-construction The three factory parts preserve the column's reviewed hierarchy, extents, and stone surface owners.
 * @evidence obligations/design/model-sources.md#deterministic-build The fixed primitive/profile inputs and 20-segment revolution produce the same column for every build.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The column is an explicitly bounded blocking proxy with no unclaimed capital detail or higher-fidelity input.
 */
export class ColumnModelSource extends TempleModelSource {
  public constructor() {
    super("docs/models/temple-fit-out.md#column-prototype", columnModel);
  }
}

/**
 * @evidence models/temple-fit-out.md The exported class is the file-level source owner for the reviewed model library.
 * @evidence models/temple-fit-out.md#door-prototype The factory builds stone left/right jambs and lintel at depth 0.40m plus a centered 1.10 × 2.10 × 0.32m wood leaf, preserving the reviewed Z=0 host and leaf intervals.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes the door silhouette and stable surfaces only; openings and threshold placement remain space-owned.
 * @evidence principles/core/source-units.md#source-substantive-completion The factory returns all four named frame/leaf parts needed by the reviewed door boundary.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The source implements the reviewed 0.40m frame host and centered 0.32m leaf without needing an upstream opening or depth decision.
 * @evidence obligations/design/model-sources.md#design-owned-construction The parts and exact surface IDs are the direct construction of the reviewed stone-frame/wood-leaf model.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed centers, dimensions, and materials yield the same four-part door on every build.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The source stops at the reviewed blocking frame and leaf and provides no unsupported hardware or swing behavior.
 */
export class DoorModelSource extends TempleModelSource {
  public constructor() {
    super("docs/models/temple-fit-out.md#door-prototype", doorModel);
  }
}

/**
 * @evidence models/temple-fit-out.md The exported class is the file-level source owner for the reviewed model library.
 * @evidence models/temple-fit-out.md#fountain-basin-prototype The basin factory returns a 0.72m-radius foot, a 0.62..0.85m open wall/rim profile through Y 0.18..0.42m, and a 1.24m water seat, retaining the central open landmark.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes basin geometry only and does not claim the courtyard socket, instance count, or stream behavior.
 * @evidence principles/core/source-units.md#source-substantive-completion The factory supplies foot, wall, rim, and water-seat parts with named surfaces and an open top boundary.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed low circular basin profile and water-seat dimensions compile directly, exposing no parent defect.
 * @evidence obligations/design/model-sources.md#design-owned-construction The four returned parts preserve the basin's reviewed open boundary, hierarchy, and stone/water surface split.
 * @evidence obligations/design/model-sources.md#deterministic-build The fixed revolution profile and 20 segments regenerate the same basin without state or randomness.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The basin is a static blocking landmark and does not pretend to simulate fluid or hidden plumbing.
 */
export class FountainBasinModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#fountain-basin-prototype",
      basinModel,
    );
  }
}

/**
 * @evidence models/temple-fit-out.md The exported class is the file-level source owner for the reviewed model library.
 * @evidence models/temple-fit-out.md#fountain-stream-prototype The stream factory creates the reviewed one-strand water accent as contiguous Y intervals 0.25..0.30m, 0.30..1.15m, and 1.15..1.20m.
 * @evidence principles/core/source-units.md#source-scope-preservation The source owns the static stream representation only and does not add fountain placement, animation, or a second water path.
 * @evidence principles/core/source-units.md#source-substantive-completion The three named cylinders provide the complete base contact, vertical column, and top break used by the reviewed prototype.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed narrow static stream height and contiguous interval are directly implementable, with no missing parent interface.
 * @evidence obligations/design/model-sources.md#design-owned-construction The returned water parts preserve the single strand, radius, intervals, and stable `stream-water` surface.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed cylinder dimensions and centers produce the same stream on every build.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The source deliberately represents water as a static blocking accent and does not claim particle simulation.
 */
export class FountainStreamModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#fountain-stream-prototype",
      streamModel,
    );
  }
}

/**
 * @evidence models/temple-fit-out.md The exported class is the file-level source owner for the reviewed model library.
 * @evidence models/temple-fit-out.md#altar-and-plinth-prototype The factory returns a 1.30 × 0.32 × 0.80m plinth and a 0.90 × 0.50 × 0.48m body, keeping the plinth wider/deeper and centered for the source sanctuary north observation.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes altar geometry only and consumes the existing `sanctuary` room relation without inventing a socket or placement graph.
 * @evidence principles/core/source-units.md#source-substantive-completion The two named stone parts provide the complete reviewed plinth/body hierarchy.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The source realizes the reviewed altar extents and sanctuary-facing relationship without exposing an upstream design gap.
 * @evidence obligations/design/model-sources.md#design-owned-construction The plinth and body preserve the reviewed size relation and separate stone surface owners.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed boxes and transforms regenerate the same altar without placement state.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The altar stops at the reviewed blocking stone form and does not assert carvings or ritual simulation.
 */
export class AltarAndPlinthModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#altar-and-plinth-prototype",
      altarModel,
    );
  }
}

/**
 * @evidence models/temple-fit-out.md The exported class is the file-level source owner for the reviewed model library.
 * @evidence models/temple-fit-out.md#roof-tile-prototype The tile factory keeps body and overlap lip within Z 0.00..0.44m, with a 0.72 × 0.44m underside and separate top, edge, and underside surfaces.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes one reusable tile and leaves roof mass, row placement, and terracotta response to their owning branches.
 * @evidence principles/core/source-units.md#source-substantive-completion The three named parts provide the reviewed tile silhouette, overlap edge, and underside boundary.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The corrected 0.44m lip depth and occupied bounds implement the reviewed tile without a parent extent defect.
 * @evidence obligations/design/model-sources.md#design-owned-construction The factory parts preserve the reviewed overlap geometry and exact stable surface IDs.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed boxes and transforms produce the same tile; row repetition is not hidden in this prototype.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The tile is a blocking roof module and does not claim baked texture, weather simulation, or roof placement.
 */
export class RoofTileModelSource extends TempleModelSource {
  public constructor() {
    super("docs/models/temple-fit-out.md#roof-tile-prototype", roofTileModel);
  }
}

/**
 * @evidence models/temple-fit-out.md The exported class is the file-level source owner for the reviewed model library.
 * @evidence models/temple-fit-out.md#records-table-prototype The table factory places a 1.20 × 0.60m top at Y 0.71..0.81m and four 0.10m square legs at X ±0.50m, Z ±0.20m, preserving its readable support footprint.
 * @evidence principles/core/source-units.md#source-scope-preservation The source owns the table prototype and does not place it in the records room or reserve its route.
 * @evidence principles/core/source-units.md#source-substantive-completion The top and four generated legs form the complete reviewed table hierarchy with stable surface names.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed top/leg dimensions and support positions are implemented directly, so construction exposed no parent defect.
 * @evidence obligations/design/model-sources.md#design-owned-construction The top and four legs preserve the table's reviewed footprint, contact, and wood surface split.
 * @evidence obligations/design/model-sources.md#deterministic-build The leg coordinate list and fixed dimensions deterministically regenerate the same five-part table.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The table is a bounded blocking work surface without unclaimed drawers, joinery, or use simulation.
 */
export class RecordsTableModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#records-table-prototype",
      recordsTableModel,
    );
  }
}

/**
 * @evidence models/temple-fit-out.md The exported class is the file-level source owner for the reviewed model library.
 * @evidence models/temple-fit-out.md#records-shelf-prototype The shelf factory fixes frames at X ±0.40m and boards at Y 0.36..0.44m, 0.86..0.94m, and 1.36..1.44m within its 1.80m height.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes the records-shelf prototype and leaves records-room quantity, orientation, and placement to instances.
 * @evidence principles/core/source-units.md#source-substantive-completion The two frames and three interval-defined boards provide the complete reviewed shelf structure.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed frame extent and board intervals compile as written without requiring a parent shelf decision.
 * @evidence obligations/design/model-sources.md#design-owned-construction The generated boards preserve the reviewed gaps, support frames, depth, and separate wood surface owners.
 * @evidence obligations/design/model-sources.md#deterministic-build The explicit interval list and fixed frame transforms produce the same five-part shelf.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The shelf is a fixed blocking storage module and does not claim contents or joinery beyond the reviewed boards.
 */
export class RecordsShelfModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#records-shelf-prototype",
      recordsShelfModel,
    );
  }
}

/**
 * @evidence models/temple-fit-out.md The exported class is the file-level source owner for the reviewed model library.
 * @evidence models/temple-fit-out.md#records-chest-prototype The chest factory keeps the body at 0.80 × 0.45 × 0.45m from Y 0.00..0.45m and the 0.10m lid from Y 0.45..0.55m.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes a closed records chest and does not add records-room placement, contents, or opening behavior.
 * @evidence principles/core/source-units.md#source-substantive-completion The body and lid are the complete reviewed chest hierarchy with separately bindable surfaces.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed closed-chest bounds and lid contact are directly represented, exposing no upstream defect.
 * @evidence obligations/design/model-sources.md#design-owned-construction The two boxes preserve the reviewed body/lid contact and stable surface ownership.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed dimensions and centers regenerate one identical closed chest.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The source stops at a closed blocking chest and does not imply hinges, contents, or interaction.
 */
export class RecordsChestModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#records-chest-prototype",
      recordsChestModel,
    );
  }
}

/**
 * @evidence models/temple-fit-out.md The exported class is the file-level source owner for the reviewed model library.
 * @evidence models/temple-fit-out.md#storage-shelf-prototype The storage shelf fixes 1.70m frames and board intervals Y 0.35..0.43m, 0.70..0.78m, 1.05..1.13m, and 1.40..1.48m.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes only the storage shelf prototype and leaves storage-room count, placement, and route reservation to instances.
 * @evidence principles/core/source-units.md#source-substantive-completion Two frames plus four explicit boards provide the complete reviewed storage shelf.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed storage board intervals, frame bounds, and negative gaps are implemented without an upstream omission.
 * @evidence obligations/design/model-sources.md#design-owned-construction The generated boards and frames preserve the storage shelf's support, gaps, depth, and surface IDs.
 * @evidence obligations/design/model-sources.md#deterministic-build The fixed interval list and transforms regenerate the same six-part shelf.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The shelf is a bounded blocking module and does not claim stored object contents or hidden fixings.
 */
export class StorageShelfModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#storage-shelf-prototype",
      storageShelfModel,
    );
  }
}

/**
 * @evidence models/temple-fit-out.md The exported class is the file-level source owner for the reviewed model library.
 * @evidence models/temple-fit-out.md#storage-chest-prototype The storage chest factory keeps a 0.78 × 0.45 × 0.46m body from Y 0.00..0.45m and a matching 0.10m lid from Y 0.45..0.55m.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes the storage chest only and does not invent storage-room placement, contents, or lid motion.
 * @evidence principles/core/source-units.md#source-substantive-completion The body/lid pair is a complete deterministic source artifact with the reviewed stable surfaces.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed closed bounds and lid contact are implemented directly without exposing a parent design gap.
 * @evidence obligations/design/model-sources.md#design-owned-construction The two boxes preserve the storage chest's reviewed dimensions, contact, and surface split.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed dimensions and transforms regenerate the same closed chest.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The source deliberately stops at the reviewed blocking chest and does not imply contents or interaction.
 */
export class StorageChestModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#storage-chest-prototype",
      storageChestModel,
    );
  }
}

/**
 * @evidence models/temple-fit-out.md The exported class is the file-level source owner for the reviewed model library.
 * @evidence models/temple-fit-out.md#storage-basket-prototype The basket factory keeps the fiber body profile at radii 0.18..0.21m over Y 0.08..0.40m, a separate rim over Y 0.40..0.44m, and a top handle at Y 0.40..0.48m.
 * @evidence principles/core/source-units.md#source-scope-preservation The source owns one open basket and does not add storage placement, quantity, or contents.
 * @evidence principles/core/source-units.md#source-substantive-completion Base, tapered body, rim, and handle are all executable named parts of the reviewed open basket.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed cavity, rim interval, handle contact, and fiber bounds compile directly with no parent defect exposed.
 * @evidence obligations/design/model-sources.md#design-owned-construction The revolved body/rim and handle preserve the basket's open boundary, taper, contact, and surface owners.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed profiles and 20-segment revolutions regenerate the same four-part basket.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The basket is an open blocking container and does not claim woven texture or contents.
 */
export class StorageBasketModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#storage-basket-prototype",
      storageBasketModel,
    );
  }
}

/**
 * @evidence models/temple-fit-out.md The exported class is the file-level source owner for the reviewed model library.
 * @evidence models/temple-fit-out.md#votive-display-prototype The display factory uses a plinth, rear board, four borders, and ledge so the field X -0.42..0.42m, Y 0.80..1.22m, Z -0.09..-0.02m remains an actual open recess.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes the display's bounded geometry and negative space without adding room placement or votive population.
 * @evidence principles/core/source-units.md#source-substantive-completion The board and border parts provide a complete source realization while leaving the reviewed field empty rather than filling it with a named solid.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The corrected open recess, border extents, and ledge contact are implemented as reviewed, with no parent negative-space defect.
 * @evidence obligations/design/model-sources.md#design-owned-construction The returned parts preserve the display's plinth, rear boundary, four border edges, ledge, and negative field.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed boxes and transforms regenerate the same display and empty field.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The display is a static blocking recess and does not claim inscriptions or individual votive contents.
 */
export class VotiveDisplayModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#votive-display-prototype",
      votiveDisplayModel,
    );
  }
}

/**
 * @evidence models/temple-fit-out.md The exported class is the file-level source owner for the reviewed model library.
 * @evidence models/temple-fit-out.md#ceramic-vessel-prototype The vessel factory preserves four addressable layers: foot Y 0.00..0.04m, body 0.04..0.26m, neck 0.26..0.31m, and rim 0.31..0.34m.
 * @evidence principles/core/source-units.md#source-scope-preservation The source owns the ceramic vessel hierarchy only and leaves vessel quantity, room placement, and material response to later owners.
 * @evidence principles/core/source-units.md#source-substantive-completion The independent neck part closes the reviewed four-layer hierarchy instead of absorbing it into the rim.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed four intervals and open-rim profile are implemented directly, so no parent hierarchy decision was missing.
 * @evidence obligations/design/model-sources.md#design-owned-construction The four returned parts preserve the vessel's foot/body/neck/rim hierarchy, intervals, and surfaces.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed profiles and 20-segment revolutions regenerate the same vessel without mutable state.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The source provides a bounded open-rim proxy and does not claim glaze microstructure or contents.
 */
export class CeramicVesselModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#ceramic-vessel-prototype",
      ceramicVesselModel,
    );
  }
}

/**
 * @evidence models/temple-fit-out.md The exported class is the file-level source owner for the reviewed model library.
 * @evidence models/temple-fit-out.md#lamp-prototype The lamp factory uses one floor-contact origin with base Y 0.00..0.08m, stem 0.08..0.30m, and shade 0.30..0.42m.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes the rigid lamp prototype only and leaves mounting offsets, count, placement, and lighting behavior elsewhere.
 * @evidence principles/core/source-units.md#source-substantive-completion The base, stem, and shade are complete named parts under one stable floor-contact convention.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed origin and three vertical intervals are implemented directly without exposing a missing parent scale decision.
 * @evidence obligations/design/model-sources.md#design-owned-construction The three parts preserve the lamp's reviewed contact datum, silhouette layers, and surface IDs.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed cylinders/profile and transforms regenerate the same lamp.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The source is a fixed blocking lamp proxy and does not claim flame simulation or emitted illumination.
 */
export class LampModelSource extends TempleModelSource {
  public constructor() {
    super("docs/models/temple-fit-out.md#lamp-prototype", lampModel);
  }
}

/**
 * @evidence models/temple-fit-out.md The exported class is the file-level source owner for the reviewed model library.
 * @evidence models/temple-fit-out.md#bench-prototype The bench factory fixes a 1.40 × 0.48m seat at Y 0.30..0.42m, four 0.10m legs at X ±0.55m/Z ±0.14m, and a back rail at Y 0.38..0.48m.
 * @evidence principles/core/source-units.md#source-scope-preservation The source owns the low bench silhouette and does not place it on the loop or reserve circulation.
 * @evidence principles/core/source-units.md#source-substantive-completion Seat, four supports, and back rail provide the complete review-critical bench geometry.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed support positions, underside negative space, and rail bounds are directly implemented without a parent defect.
 * @evidence obligations/design/model-sources.md#design-owned-construction The seat, leg layout, underside gap, and rail preserve the reviewed support and wood surface ownership.
 * @evidence obligations/design/model-sources.md#deterministic-build The fixed four-point list and transforms regenerate the same bench.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The bench is a bounded civic blocking proxy and does not claim joinery, cushions, or user simulation.
 */
export class BenchModelSource extends TempleModelSource {
  public constructor() {
    super("docs/models/temple-fit-out.md#bench-prototype", benchModel);
  }
}

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the scale-board class and its comparison-only boundary.
 * @evidence principles/core/source-units.md#source-substantive-completion The value is an executable source instance, not an inert registry entry.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class already implements the reviewed door-clear and room-height markers without a parent defect.
 */
export const modelScopeSource = new ModelScopeSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the column source class and its three-part stone boundary.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable column source instance consumed by the library.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed base, tapered shaft, and capital intervals without exposing a parent defect.
 */
export const columnModelSource = new ColumnModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the door source class and its frame/leaf-only boundary.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable four-part door source instance.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed 0.40m host and centered 0.32m leaf without a parent defect.
 */
export const doorModelSource = new DoorModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the basin source class and its open circular landmark boundary.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable basin source instance with its four named parts.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed foot, wall, rim, and water-seat extents without a parent defect.
 */
export const fountainBasinModelSource = new FountainBasinModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the single-strand stream source and its static-accent boundary.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable three-interval stream source instance.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed contiguous stream intervals without a parent defect.
 */
export const fountainStreamModelSource = new FountainStreamModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the altar source class and its sanctuary-room consumption boundary.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable plinth/body source instance.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed plinth/body dimensions without inventing a socket or exposing a parent defect.
 */
export const altarAndPlinthModelSource = new AltarAndPlinthModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves one roof-tile prototype and leaves row repetition to its later population owner.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable body/lip/underside source instance.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed 0.44m occupied depth without exposing a parent defect.
 */
export const roofTileModelSource = new RoofTileModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the records table prototype and does not claim records-room placement.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable top and four-leg source instance.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed table footprint and support positions without a parent defect.
 */
export const recordsTableModelSource = new RecordsTableModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the records shelf prototype and its interval-defined board boundary.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable frame and three-board source instance.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed board intervals and frame extent without a parent defect.
 */
export const recordsShelfModelSource = new RecordsShelfModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the closed records chest prototype and its body/lid boundary.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable body and lid source instance.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed closed bounds and lid contact without a parent defect.
 */
export const recordsChestModelSource = new RecordsChestModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the storage shelf prototype and its four board intervals.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable frame and board source instance.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed storage gaps and frame extent without a parent defect.
 */
export const storageShelfModelSource = new StorageShelfModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the closed storage chest prototype and does not claim lid motion or contents.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable body and lid source instance.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed storage bounds and lid contact without a parent defect.
 */
export const storageChestModelSource = new StorageChestModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the open storage basket prototype and its cavity boundary.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable base, tapered body, rim, and handle source instance.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed cavity, rim, and handle bounds without a parent defect.
 */
export const storageBasketModelSource = new StorageBasketModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the votive display's actual open field and bounded board boundary.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable plinth, rear board, four borders, and ledge source instance.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed negative field without exposing a parent defect.
 */
export const votiveDisplayModelSource = new VotiveDisplayModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the ceramic vessel's four-layer hierarchy and open-rim boundary.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable foot, body, neck, and rim source instance.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed independent neck interval without a parent defect.
 */
export const ceramicVesselModelSource = new CeramicVesselModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the floor-contact lamp source and leaves mounting offset to its consumer.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable base, stem, and shade source instance.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed origin and vertical intervals without a parent defect.
 */
export const lampModelSource = new LampModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the low bench prototype and its support/rail boundary.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable seat, four-leg, and rail source instance.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed supports, underside gap, and rail bounds without a parent defect.
 */
export const benchModelSource = new BenchModelSource();
