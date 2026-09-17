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

type ModelSourceDefinition = Readonly<{
  design: string;
  modelId: string;
  factory: ModelFactory;
  partIds: readonly string[];
}>;

const MODEL_SOURCE_DEFINITIONS: readonly ModelSourceDefinition[] = [
  {
    design: "docs/models/temple-fit-out.md#model-scope-scale-and-fidelity",
    modelId: "model/scale-board",
    factory: scaleBoardModel,
    partIds: ["scale-board/door-clear", "scale-board/room-height"],
  },
  {
    design: "docs/models/temple-fit-out.md#column-prototype",
    modelId: "model/column",
    factory: columnModel,
    partIds: ["column/base", "column/shaft", "column/capital"],
  },
  {
    design: "docs/models/temple-fit-out.md#door-prototype",
    modelId: "model/door",
    factory: doorModel,
    partIds: [
      "door/frame-left",
      "door/frame-right",
      "door/frame-lintel",
      "door/leaf",
    ],
  },
  {
    design: "docs/models/temple-fit-out.md#fountain-basin-prototype",
    modelId: "model/fountain-basin",
    factory: basinModel,
    partIds: [
      "basin/foot",
      "basin/wall",
      "basin/rim",
      "basin/water-seat",
    ],
  },
  {
    design: "docs/models/temple-fit-out.md#fountain-stream-prototype",
    modelId: "model/fountain-stream",
    factory: streamModel,
    partIds: [
      "stream/base-contact",
      "stream/vertical-column",
      "stream/top-break",
    ],
  },
  {
    design: "docs/models/temple-fit-out.md#altar-and-plinth-prototype",
    modelId: "model/altar-plinth",
    factory: altarModel,
    partIds: ["altar/plinth", "altar/body"],
  },
  {
    design: "docs/models/temple-fit-out.md#roof-tile-prototype",
    modelId: "model/roof-tile",
    factory: roofTileModel,
    partIds: [
      "roof-tile/body",
      "roof-tile/overlap-lip",
      "roof-tile/underside",
    ],
  },
  {
    design: "docs/models/temple-fit-out.md#records-table-prototype",
    modelId: "model/records-table",
    factory: recordsTableModel,
    partIds: [
      "records-table/top",
      "records-table/leg-1",
      "records-table/leg-2",
      "records-table/leg-3",
      "records-table/leg-4",
    ],
  },
  {
    design: "docs/models/temple-fit-out.md#records-shelf-prototype",
    modelId: "model/records-shelf",
    factory: recordsShelfModel,
    partIds: [
      "records-shelf/frame-left",
      "records-shelf/frame-right",
      "records-shelf/board-1",
      "records-shelf/board-2",
      "records-shelf/board-3",
    ],
  },
  {
    design: "docs/models/temple-fit-out.md#records-chest-prototype",
    modelId: "model/records-chest",
    factory: recordsChestModel,
    partIds: ["records-chest/body", "records-chest/lid"],
  },
  {
    design: "docs/models/temple-fit-out.md#storage-shelf-prototype",
    modelId: "model/storage-shelf",
    factory: storageShelfModel,
    partIds: [
      "storage-shelf/frame-left",
      "storage-shelf/frame-right",
      "storage-shelf/board-1",
      "storage-shelf/board-2",
      "storage-shelf/board-3",
      "storage-shelf/board-4",
    ],
  },
  {
    design: "docs/models/temple-fit-out.md#storage-chest-prototype",
    modelId: "model/storage-chest",
    factory: storageChestModel,
    partIds: ["storage-chest/body", "storage-chest/lid"],
  },
  {
    design: "docs/models/temple-fit-out.md#storage-basket-prototype",
    modelId: "model/storage-basket",
    factory: storageBasketModel,
    partIds: [
      "storage-basket/base",
      "storage-basket/body",
      "storage-basket/rim",
      "storage-basket/handle",
    ],
  },
  {
    design: "docs/models/temple-fit-out.md#votive-display-prototype",
    modelId: "model/votive-display",
    factory: votiveDisplayModel,
    partIds: [
      "votive-display/plinth",
      "votive-display/board-back",
      "votive-display/board-left",
      "votive-display/board-right",
      "votive-display/board-bottom",
      "votive-display/board-top",
      "votive-display/ledge",
    ],
  },
  {
    design: "docs/models/temple-fit-out.md#ceramic-vessel-prototype",
    modelId: "model/ceramic-vessel",
    factory: ceramicVesselModel,
    partIds: [
      "ceramic-vessel/foot",
      "ceramic-vessel/body",
      "ceramic-vessel/neck",
      "ceramic-vessel/rim",
    ],
  },
  {
    design: "docs/models/temple-fit-out.md#lamp-prototype",
    modelId: "model/lamp",
    factory: lampModel,
    partIds: ["lamp/base", "lamp/stem", "lamp/shade"],
  },
  {
    design: "docs/models/temple-fit-out.md#bench-prototype",
    modelId: "model/bench",
    factory: benchModel,
    partIds: [
      "bench/seat",
      "bench/leg-1",
      "bench/leg-2",
      "bench/leg-3",
      "bench/leg-4",
      "bench/back-rail",
    ],
  },
];

const modelSourceDefinitionFor = (
  design: string,
  factory: ModelFactory,
): ModelSourceDefinition => {
  const definition = MODEL_SOURCE_DEFINITIONS.find(
    (item) => item.design === design && item.factory === factory,
  );
  if (definition === undefined)
    throw new Error(`Unregistered model source ${design}.`);
  return definition;
};

const assertModelMatchesDefinition = (
  built: IAutoMovieModel,
  definition: ModelSourceDefinition,
): void => {
  const partIds = built.parts.map((item) => item.id);
  if (
    built.id !== definition.modelId ||
    partIds.length !== definition.partIds.length ||
    partIds.some((id, index) => id !== definition.partIds[index])
  )
    throw new Error(
      `Model source ${definition.design} emitted an unregistered model or part population.`,
    );
};

class TempleModelSource implements IAutoMovieLibrarySourceOwner {
  public readonly design: string;
  private readonly factory: ModelFactory;
  private readonly definition: ModelSourceDefinition;

  public constructor(design: string, factory: ModelFactory) {
    this.definition = modelSourceDefinitionFor(design, factory);
    this.design = this.definition.design;
    this.factory = this.definition.factory;
  }

  public build(
    context: IAutoMovieLibraryBuildContext,
  ): IAutoMovieLibraryContribution {
    if (context.design !== this.design)
      throw new Error(
        `Model source context ${context.design} does not match ${this.design}.`,
      );
    const built = this.factory();
    assertModelMatchesDefinition(built, this.definition);
    return contribution(built);
  }
}

/**
 * @evidence models/temple-fit-out.md ModelScopeSource contributes model/scale-board with scale-board/door-clear and scale-board/room-height, a 1.10 x 2.10m door-clear panel and a 3.60m room-height marker as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.
 * @evidenceReview models/temple-fit-out.md #0f51831 Independent source review for class ModelScopeSource: checked target models/temple-fit-out.md's authored predicate; observed target models/temple-fit-out.md predicate [ModelScopeSource contributes model/scale-board with scale-board/door-clear and scale-board/room-height, a 1.10 x 2.10m door-clear panel and a 3.60m room-height marker as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] is satisfied by emitted source fact [the scale-board factory emits only a 1.10 x 2.10m door-clear panel and a 3.60m room-height marker]. Falsifier: the target fails if [ModelScopeSource contributes model/scale-board with scale-board/door-clear and scale-board/room-height, a 1.10 x 2.10m door-clear panel and a 3.60m room-height marker as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] no longer holds or if the emitted source fact changes.
 * @evidence models/temple-fit-out.md#model-scope-scale-and-fidelity The scale board emits `model/scale-board` with a 1.10 × 2.10 door-clear panel and a 3.60m room-height marker, so the source answers the population's shared comparison contract without placement.
 * @evidenceReview models/temple-fit-out.md#model-scope-scale-and-fidelity #94e190a Independent source review for class ModelScopeSource: checked target models/temple-fit-out.md#model-scope-scale-and-fidelity's authored predicate; observed target models/temple-fit-out.md#model-scope-scale-and-fidelity predicate [The scale board emits model/scale-board with a 1.10 × 2.10 door-clear panel and a 3.60m room-height marker, so the source answers the population's shared comparison contract without placement.] is satisfied by emitted source fact [the scale-board factory emits only a 1.10 x 2.10m door-clear panel and a 3.60m room-height marker]. Falsifier: the target fails if [The scale board emits model/scale-board with a 1.10 × 2.10 door-clear panel and a 3.60m room-height marker, so the source answers the population's shared comparison contract without placement.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-scope-preservation The export realizes only the scale-board model and keeps topology, placement, materials, and observations outside this source owner.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for class ModelScopeSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [The export realizes only the scale-board model and keeps topology, placement, materials, and observations outside this source owner.] is satisfied by emitted source fact [model/scale-board with scale-board/door-clear and scale-board/room-height, a 1.10 x 2.10m door-clear panel and a 3.60m room-height marker]. Falsifier: the target fails if [The export realizes only the scale-board model and keeps topology, placement, materials, and observations outside this source owner.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The constructor binds a concrete reviewed design address to an executable factory that returns both declared comparison parts.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for class ModelScopeSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The constructor binds a concrete reviewed design address to an executable factory that returns both declared comparison parts.] is satisfied by emitted source fact [model/scale-board with scale-board/door-clear and scale-board/room-height, a 1.10 x 2.10m door-clear panel and a 3.60m room-height marker]. Falsifier: the target fails if [The constructor binds a concrete reviewed design address to an executable factory that returns both declared comparison parts.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The scale-board source implements the reviewed panel dimensions, floor datum, and no-placement boundary without exposing a missing parent decision.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The scale-board source implements the reviewed panel dimensions, floor datum, and no-placement boundary without exposing a missing parent decision.] is satisfied by emitted source fact [model/scale-board with scale-board/door-clear and scale-board/room-height, a 1.10 x 2.10m door-clear panel and a 3.60m room-height marker]. Falsifier: this exclusion fails if [The scale-board source implements the reviewed panel dimensions, floor datum, and no-placement boundary without exposing a missing parent decision.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#design-owned-construction The factory's two named parts are the concrete construction of the scale-board design unit.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 Independent source review for class ModelScopeSource: checked target obligations/design/model-sources.md#design-owned-construction's authored predicate; observed target obligations/design/model-sources.md#design-owned-construction predicate [The factory's two named parts are the concrete construction of the scale-board design unit.] is satisfied by emitted source fact [model/scale-board with scale-board/door-clear and scale-board/room-height, a 1.10 x 2.10m door-clear panel and a 3.60m room-height marker]. Falsifier: the target fails if [The factory's two named parts are the concrete construction of the scale-board design unit.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#deterministic-build The source has no mutable inputs or randomness and rebuilds the same two primitive parts on every call.
 * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe Independent source review for class ModelScopeSource: checked target obligations/design/model-sources.md#deterministic-build's authored predicate; observed target obligations/design/model-sources.md#deterministic-build predicate [The source has no mutable inputs or randomness and rebuilds the same two primitive parts on every call.] is satisfied by emitted source fact [model/scale-board with scale-board/door-clear and scale-board/room-height, a 1.10 x 2.10m door-clear panel and a 3.60m room-height marker]. Falsifier: the target fails if [The source has no mutable inputs or randomness and rebuilds the same two primitive parts on every call.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The board remains a fixed blocking comparison proxy and exposes no unsupported fidelity request.
 * @evidenceReview obligations/design/model-sources.md#unsupported-fidelity-is-explicit #15c03fa Independent source review for class ModelScopeSource: checked target obligations/design/model-sources.md#unsupported-fidelity-is-explicit's authored predicate; observed target obligations/design/model-sources.md#unsupported-fidelity-is-explicit predicate [The board remains a fixed blocking comparison proxy and exposes no unsupported fidelity request.] is satisfied by emitted source fact [model/scale-board with scale-board/door-clear and scale-board/room-height, a 1.10 x 2.10m door-clear panel and a 3.60m room-height marker]. Falsifier: the target fails if [The board remains a fixed blocking comparison proxy and exposes no unsupported fidelity request.] no longer holds or if the emitted source fact changes.
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
 * @evidence models/temple-fit-out.md ColumnModelSource contributes model/column with column/base, column/shaft, and column/capital over Y 0.00..0.18m, 0.18..2.92m, and 2.92..3.20m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.
 * @evidenceReview models/temple-fit-out.md #0f51831 Independent source review for class ColumnModelSource: checked target models/temple-fit-out.md's authored predicate; observed target models/temple-fit-out.md predicate [ColumnModelSource contributes model/column with column/base, column/shaft, and column/capital over Y 0.00..0.18m, 0.18..2.92m, and 2.92..3.20m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] is satisfied by emitted source fact [the factory emits base radius 0.20m over Y 0.00..0.18m, shaft radii 0.16m to 0.152m over Y 0.18..2.92m, and capital radius 0.225m over Y 2.92..3.20m]. Falsifier: the target fails if [ColumnModelSource contributes model/column with column/base, column/shaft, and column/capital over Y 0.00..0.18m, 0.18..2.92m, and 2.92..3.20m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] no longer holds or if the emitted source fact changes.
 * @evidence models/temple-fit-out.md#column-prototype The factory returns `model/column` as base radius 0.20m and height 0.18m, shaft profile 0.16m to 0.152m over Y 0.18..2.92m, and capital radius 0.225m over Y 2.92..3.20m.
 * @evidenceReview models/temple-fit-out.md#column-prototype #c853c7f Independent source review for class ColumnModelSource: checked target models/temple-fit-out.md#column-prototype's authored predicate; observed target models/temple-fit-out.md#column-prototype predicate [The factory returns model/column as base radius 0.20m and height 0.18m, shaft profile 0.16m to 0.152m over Y 0.18..2.92m, and capital radius 0.225m over Y 2.92..3.20m.] is satisfied by emitted source fact [the factory emits base radius 0.20m over Y 0.00..0.18m, shaft radii 0.16m to 0.152m over Y 0.18..2.92m, and capital radius 0.225m over Y 2.92..3.20m]. Falsifier: the target fails if [The factory returns model/column as base radius 0.20m and height 0.18m, shaft profile 0.16m to 0.152m over Y 0.18..2.92m, and capital radius 0.225m over Y 2.92..3.20m.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-scope-preservation The source owns only the three-part column realization and does not add column placement, room topology, or material response.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for class ColumnModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [The source owns only the three-part column realization and does not add column placement, room topology, or material response.] is satisfied by emitted source fact [model/column with column/base, column/shaft, and column/capital over Y 0.00..0.18m, 0.18..2.92m, and 2.92..3.20m]. Falsifier: the target fails if [The source owns only the three-part column realization and does not add column placement, room topology, or material response.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The executable factory supplies named base, shaft, and capital parts with their reviewed ranges and surfaces.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for class ColumnModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The executable factory supplies named base, shaft, and capital parts with their reviewed ranges and surfaces.] is satisfied by emitted source fact [model/column with column/base, column/shaft, and column/capital over Y 0.00..0.18m, 0.18..2.92m, and 2.92..3.20m]. Falsifier: the target fails if [The executable factory supplies named base, shaft, and capital parts with their reviewed ranges and surfaces.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The implementation directly realizes the reviewed three-layer bounds and five-percent shaft taper, so no parent geometry decision was missing.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The implementation directly realizes the reviewed three-layer bounds and five-percent shaft taper, so no parent geometry decision was missing.] is satisfied by emitted source fact [model/column with column/base, column/shaft, and column/capital over Y 0.00..0.18m, 0.18..2.92m, and 2.92..3.20m]. Falsifier: this exclusion fails if [The implementation directly realizes the reviewed three-layer bounds and five-percent shaft taper, so no parent geometry decision was missing.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#design-owned-construction The three factory parts preserve the column's reviewed hierarchy, extents, and stone surface owners.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 Independent source review for class ColumnModelSource: checked target obligations/design/model-sources.md#design-owned-construction's authored predicate; observed target obligations/design/model-sources.md#design-owned-construction predicate [The three factory parts preserve the column's reviewed hierarchy, extents, and stone surface owners.] is satisfied by emitted source fact [model/column with column/base, column/shaft, and column/capital over Y 0.00..0.18m, 0.18..2.92m, and 2.92..3.20m]. Falsifier: the target fails if [The three factory parts preserve the column's reviewed hierarchy, extents, and stone surface owners.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#deterministic-build The fixed primitive/profile inputs and 20-segment revolution produce the same column for every build.
 * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe Independent source review for class ColumnModelSource: checked target obligations/design/model-sources.md#deterministic-build's authored predicate; observed target obligations/design/model-sources.md#deterministic-build predicate [The fixed primitive/profile inputs and 20-segment revolution produce the same column for every build.] is satisfied by emitted source fact [model/column with column/base, column/shaft, and column/capital over Y 0.00..0.18m, 0.18..2.92m, and 2.92..3.20m]. Falsifier: the target fails if [The fixed primitive/profile inputs and 20-segment revolution produce the same column for every build.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The column is an explicitly bounded blocking proxy with no unclaimed capital detail or higher-fidelity input.
 * @evidenceReview obligations/design/model-sources.md#unsupported-fidelity-is-explicit #15c03fa Independent source review for class ColumnModelSource: checked target obligations/design/model-sources.md#unsupported-fidelity-is-explicit's authored predicate; observed target obligations/design/model-sources.md#unsupported-fidelity-is-explicit predicate [The column is an explicitly bounded blocking proxy with no unclaimed capital detail or higher-fidelity input.] is satisfied by emitted source fact [model/column with column/base, column/shaft, and column/capital over Y 0.00..0.18m, 0.18..2.92m, and 2.92..3.20m]. Falsifier: the target fails if [The column is an explicitly bounded blocking proxy with no unclaimed capital detail or higher-fidelity input.] no longer holds or if the emitted source fact changes.
 */
export class ColumnModelSource extends TempleModelSource {
  public constructor() {
    super("docs/models/temple-fit-out.md#column-prototype", columnModel);
  }
}

/**
 * @evidence models/temple-fit-out.md DoorModelSource contributes model/door with four frame/leaf parts, 0.40m frame depth, and centered leaf Z -0.16..0.16m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.
 * @evidenceReview models/temple-fit-out.md #0f51831 Independent source review for class DoorModelSource: checked target models/temple-fit-out.md's authored predicate; observed target models/temple-fit-out.md predicate [DoorModelSource contributes model/door with four frame/leaf parts, 0.40m frame depth, and centered leaf Z -0.16..0.16m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] is satisfied by emitted source fact [the factory emits four door parts with 0.40m frame depth, 1.10 x 2.10m clear opening, and centered leaf Z -0.16..0.16m]. Falsifier: the target fails if [DoorModelSource contributes model/door with four frame/leaf parts, 0.40m frame depth, and centered leaf Z -0.16..0.16m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] no longer holds or if the emitted source fact changes.
 * @evidence models/temple-fit-out.md#door-prototype The factory builds stone left/right jambs and lintel at depth 0.40m plus a centered 1.10 × 2.10 × 0.32m wood leaf, preserving the reviewed Z=0 host and leaf intervals.
 * @evidenceReview models/temple-fit-out.md#door-prototype #e53a9c6 Independent source review for class DoorModelSource: checked target models/temple-fit-out.md#door-prototype's authored predicate; observed target models/temple-fit-out.md#door-prototype predicate [The factory builds stone left/right jambs and lintel at depth 0.40m plus a centered 1.10 × 2.10 × 0.32m wood leaf, preserving the reviewed Z=0 host and leaf intervals.] is satisfied by emitted source fact [the factory emits four door parts with 0.40m frame depth, 1.10 x 2.10m clear opening, and centered leaf Z -0.16..0.16m]. Falsifier: the target fails if [The factory builds stone left/right jambs and lintel at depth 0.40m plus a centered 1.10 × 2.10 × 0.32m wood leaf, preserving the reviewed Z=0 host and leaf intervals.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes the door silhouette and stable surfaces only; openings and threshold placement remain space-owned.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for class DoorModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [The source realizes the door silhouette and stable surfaces only; openings and threshold placement remain space-owned.] is satisfied by emitted source fact [model/door with four frame/leaf parts, 0.40m frame depth, and centered leaf Z -0.16..0.16m]. Falsifier: the target fails if [The source realizes the door silhouette and stable surfaces only; openings and threshold placement remain space-owned.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The factory returns all four named frame/leaf parts needed by the reviewed door boundary.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for class DoorModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The factory returns all four named frame/leaf parts needed by the reviewed door boundary.] is satisfied by emitted source fact [model/door with four frame/leaf parts, 0.40m frame depth, and centered leaf Z -0.16..0.16m]. Falsifier: the target fails if [The factory returns all four named frame/leaf parts needed by the reviewed door boundary.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The source implements the reviewed 0.40m frame host and centered 0.32m leaf without needing an upstream opening or depth decision.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The source implements the reviewed 0.40m frame host and centered 0.32m leaf without needing an upstream opening or depth decision.] is satisfied by emitted source fact [model/door with four frame/leaf parts, 0.40m frame depth, and centered leaf Z -0.16..0.16m]. Falsifier: this exclusion fails if [The source implements the reviewed 0.40m frame host and centered 0.32m leaf without needing an upstream opening or depth decision.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#design-owned-construction The parts and exact surface IDs are the direct construction of the reviewed stone-frame/wood-leaf model.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 Independent source review for class DoorModelSource: checked target obligations/design/model-sources.md#design-owned-construction's authored predicate; observed target obligations/design/model-sources.md#design-owned-construction predicate [The parts and exact surface IDs are the direct construction of the reviewed stone-frame/wood-leaf model.] is satisfied by emitted source fact [model/door with four frame/leaf parts, 0.40m frame depth, and centered leaf Z -0.16..0.16m]. Falsifier: the target fails if [The parts and exact surface IDs are the direct construction of the reviewed stone-frame/wood-leaf model.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed centers, dimensions, and materials yield the same four-part door on every build.
 * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe Independent source review for class DoorModelSource: checked target obligations/design/model-sources.md#deterministic-build's authored predicate; observed target obligations/design/model-sources.md#deterministic-build predicate [Fixed centers, dimensions, and materials yield the same four-part door on every build.] is satisfied by emitted source fact [model/door with four frame/leaf parts, 0.40m frame depth, and centered leaf Z -0.16..0.16m]. Falsifier: the target fails if [Fixed centers, dimensions, and materials yield the same four-part door on every build.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The source stops at the reviewed blocking frame and leaf and provides no unsupported hardware or swing behavior.
 * @evidenceReview obligations/design/model-sources.md#unsupported-fidelity-is-explicit #15c03fa Independent source review for class DoorModelSource: checked target obligations/design/model-sources.md#unsupported-fidelity-is-explicit's authored predicate; observed target obligations/design/model-sources.md#unsupported-fidelity-is-explicit predicate [The source stops at the reviewed blocking frame and leaf and provides no unsupported hardware or swing behavior.] is satisfied by emitted source fact [model/door with four frame/leaf parts, 0.40m frame depth, and centered leaf Z -0.16..0.16m]. Falsifier: the target fails if [The source stops at the reviewed blocking frame and leaf and provides no unsupported hardware or swing behavior.] no longer holds or if the emitted source fact changes.
 */
export class DoorModelSource extends TempleModelSource {
  public constructor() {
    super("docs/models/temple-fit-out.md#door-prototype", doorModel);
  }
}

/**
 * @evidence models/temple-fit-out.md FountainBasinModelSource contributes model/fountain-basin with foot, open wall/rim profile Y 0.18..0.42m, and separate 1.24m water seat as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.
 * @evidenceReview models/temple-fit-out.md #0f51831 Independent source review for class FountainBasinModelSource: checked target models/temple-fit-out.md's authored predicate; observed target models/temple-fit-out.md predicate [FountainBasinModelSource contributes model/fountain-basin with foot, open wall/rim profile Y 0.18..0.42m, and separate 1.24m water seat as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] is satisfied by emitted source fact [the factory emits the foot, open wall/rim profile Y 0.18..0.42m, and separate 1.24m water seat]. Falsifier: the target fails if [FountainBasinModelSource contributes model/fountain-basin with foot, open wall/rim profile Y 0.18..0.42m, and separate 1.24m water seat as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] no longer holds or if the emitted source fact changes.
 * @evidence models/temple-fit-out.md#fountain-basin-prototype The basin factory returns a 0.72m-radius foot, a 0.62..0.85m open wall/rim profile through Y 0.18..0.42m, and a 1.24m water seat, retaining the central open landmark.
 * @evidenceReview models/temple-fit-out.md#fountain-basin-prototype #e1710b2 Independent source review for class FountainBasinModelSource: checked target models/temple-fit-out.md#fountain-basin-prototype's authored predicate; observed target models/temple-fit-out.md#fountain-basin-prototype predicate [The basin factory returns a 0.72m-radius foot, a 0.62..0.85m open wall/rim profile through Y 0.18..0.42m, and a 1.24m water seat, retaining the central open landmark.] is satisfied by emitted source fact [the factory emits the foot, open wall/rim profile Y 0.18..0.42m, and separate 1.24m water seat]. Falsifier: the target fails if [The basin factory returns a 0.72m-radius foot, a 0.62..0.85m open wall/rim profile through Y 0.18..0.42m, and a 1.24m water seat, retaining the central open landmark.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes basin geometry only and does not claim the courtyard socket, instance count, or stream behavior.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for class FountainBasinModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [The source realizes basin geometry only and does not claim the courtyard socket, instance count, or stream behavior.] is satisfied by emitted source fact [model/fountain-basin with foot, open wall/rim profile Y 0.18..0.42m, and separate 1.24m water seat]. Falsifier: the target fails if [The source realizes basin geometry only and does not claim the courtyard socket, instance count, or stream behavior.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The factory supplies foot, wall, rim, and water-seat parts with named surfaces and an open top boundary.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for class FountainBasinModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The factory supplies foot, wall, rim, and water-seat parts with named surfaces and an open top boundary.] is satisfied by emitted source fact [model/fountain-basin with foot, open wall/rim profile Y 0.18..0.42m, and separate 1.24m water seat]. Falsifier: the target fails if [The factory supplies foot, wall, rim, and water-seat parts with named surfaces and an open top boundary.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed low circular basin profile and water-seat dimensions compile directly, exposing no parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The reviewed low circular basin profile and water-seat dimensions compile directly, exposing no parent defect.] is satisfied by emitted source fact [model/fountain-basin with foot, open wall/rim profile Y 0.18..0.42m, and separate 1.24m water seat]. Falsifier: this exclusion fails if [The reviewed low circular basin profile and water-seat dimensions compile directly, exposing no parent defect.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#design-owned-construction The four returned parts preserve the basin's reviewed open boundary, hierarchy, and stone/water surface split.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 Independent source review for class FountainBasinModelSource: checked target obligations/design/model-sources.md#design-owned-construction's authored predicate; observed target obligations/design/model-sources.md#design-owned-construction predicate [The four returned parts preserve the basin's reviewed open boundary, hierarchy, and stone/water surface split.] is satisfied by emitted source fact [model/fountain-basin with foot, open wall/rim profile Y 0.18..0.42m, and separate 1.24m water seat]. Falsifier: the target fails if [The four returned parts preserve the basin's reviewed open boundary, hierarchy, and stone/water surface split.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#deterministic-build The fixed revolution profile and 20 segments regenerate the same basin without state or randomness.
 * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe Independent source review for class FountainBasinModelSource: checked target obligations/design/model-sources.md#deterministic-build's authored predicate; observed target obligations/design/model-sources.md#deterministic-build predicate [The fixed revolution profile and 20 segments regenerate the same basin without state or randomness.] is satisfied by emitted source fact [model/fountain-basin with foot, open wall/rim profile Y 0.18..0.42m, and separate 1.24m water seat]. Falsifier: the target fails if [The fixed revolution profile and 20 segments regenerate the same basin without state or randomness.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The basin is a static blocking landmark and does not pretend to simulate fluid or hidden plumbing.
 * @evidenceReview obligations/design/model-sources.md#unsupported-fidelity-is-explicit #15c03fa Independent source review for class FountainBasinModelSource: checked target obligations/design/model-sources.md#unsupported-fidelity-is-explicit's authored predicate; observed target obligations/design/model-sources.md#unsupported-fidelity-is-explicit predicate [The basin is a static blocking landmark and does not pretend to simulate fluid or hidden plumbing.] is satisfied by emitted source fact [model/fountain-basin with foot, open wall/rim profile Y 0.18..0.42m, and separate 1.24m water seat]. Falsifier: the target fails if [The basin is a static blocking landmark and does not pretend to simulate fluid or hidden plumbing.] no longer holds or if the emitted source fact changes.
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
 * @evidence models/temple-fit-out.md FountainStreamModelSource contributes model/fountain-stream with stream/base-contact, stream/vertical-column, and stream/top-break at contiguous Y intervals 0.25..0.30m, 0.30..1.15m, and 1.15..1.20m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.
 * @evidenceReview models/temple-fit-out.md #0f51831 Independent source review for class FountainStreamModelSource: checked target models/temple-fit-out.md's authored predicate; observed target models/temple-fit-out.md predicate [FountainStreamModelSource contributes model/fountain-stream with stream/base-contact, stream/vertical-column, and stream/top-break at contiguous Y intervals 0.25..0.30m, 0.30..1.15m, and 1.15..1.20m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] is satisfied by emitted source fact [the factory emits one strand across Y 0.25..0.30m, 0.30..1.15m, and 1.15..1.20m]. Falsifier: the target fails if [FountainStreamModelSource contributes model/fountain-stream with stream/base-contact, stream/vertical-column, and stream/top-break at contiguous Y intervals 0.25..0.30m, 0.30..1.15m, and 1.15..1.20m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] no longer holds or if the emitted source fact changes.
 * @evidence models/temple-fit-out.md#fountain-stream-prototype The stream factory creates the reviewed one-strand water accent as contiguous Y intervals 0.25..0.30m, 0.30..1.15m, and 1.15..1.20m.
 * @evidenceReview models/temple-fit-out.md#fountain-stream-prototype #dde58b9 Independent source review for class FountainStreamModelSource: checked target models/temple-fit-out.md#fountain-stream-prototype's authored predicate; observed target models/temple-fit-out.md#fountain-stream-prototype predicate [The stream factory creates the reviewed one-strand water accent as contiguous Y intervals 0.25..0.30m, 0.30..1.15m, and 1.15..1.20m.] is satisfied by emitted source fact [the factory emits one strand across Y 0.25..0.30m, 0.30..1.15m, and 1.15..1.20m]. Falsifier: the target fails if [The stream factory creates the reviewed one-strand water accent as contiguous Y intervals 0.25..0.30m, 0.30..1.15m, and 1.15..1.20m.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-scope-preservation The source owns the static stream representation only and does not add fountain placement, animation, or a second water path.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for class FountainStreamModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [The source owns the static stream representation only and does not add fountain placement, animation, or a second water path.] is satisfied by emitted source fact [model/fountain-stream with stream/base-contact, stream/vertical-column, and stream/top-break at contiguous Y intervals 0.25..0.30m, 0.30..1.15m, and 1.15..1.20m]. Falsifier: the target fails if [The source owns the static stream representation only and does not add fountain placement, animation, or a second water path.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The three named cylinders provide the complete base contact, vertical column, and top break used by the reviewed prototype.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for class FountainStreamModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The three named cylinders provide the complete base contact, vertical column, and top break used by the reviewed prototype.] is satisfied by emitted source fact [model/fountain-stream with stream/base-contact, stream/vertical-column, and stream/top-break at contiguous Y intervals 0.25..0.30m, 0.30..1.15m, and 1.15..1.20m]. Falsifier: the target fails if [The three named cylinders provide the complete base contact, vertical column, and top break used by the reviewed prototype.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed narrow static stream height and contiguous interval are directly implementable, with no missing parent interface.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The reviewed narrow static stream height and contiguous interval are directly implementable, with no missing parent interface.] is satisfied by emitted source fact [model/fountain-stream with stream/base-contact, stream/vertical-column, and stream/top-break at contiguous Y intervals 0.25..0.30m, 0.30..1.15m, and 1.15..1.20m]. Falsifier: this exclusion fails if [The reviewed narrow static stream height and contiguous interval are directly implementable, with no missing parent interface.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#design-owned-construction The returned water parts preserve the single strand, radius, intervals, and stable `stream-water` surface.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 Independent source review for class FountainStreamModelSource: checked target obligations/design/model-sources.md#design-owned-construction's authored predicate; observed target obligations/design/model-sources.md#design-owned-construction predicate [The returned water parts preserve the single strand, radius, intervals, and stable stream-water surface.] is satisfied by emitted source fact [model/fountain-stream with stream/base-contact, stream/vertical-column, and stream/top-break at contiguous Y intervals 0.25..0.30m, 0.30..1.15m, and 1.15..1.20m]. Falsifier: the target fails if [The returned water parts preserve the single strand, radius, intervals, and stable stream-water surface.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed cylinder dimensions and centers produce the same stream on every build.
 * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe Independent source review for class FountainStreamModelSource: checked target obligations/design/model-sources.md#deterministic-build's authored predicate; observed target obligations/design/model-sources.md#deterministic-build predicate [Fixed cylinder dimensions and centers produce the same stream on every build.] is satisfied by emitted source fact [model/fountain-stream with stream/base-contact, stream/vertical-column, and stream/top-break at contiguous Y intervals 0.25..0.30m, 0.30..1.15m, and 1.15..1.20m]. Falsifier: the target fails if [Fixed cylinder dimensions and centers produce the same stream on every build.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The source deliberately represents water as a static blocking accent and does not claim particle simulation.
 * @evidenceReview obligations/design/model-sources.md#unsupported-fidelity-is-explicit #15c03fa Independent source review for class FountainStreamModelSource: checked target obligations/design/model-sources.md#unsupported-fidelity-is-explicit's authored predicate; observed target obligations/design/model-sources.md#unsupported-fidelity-is-explicit predicate [The source deliberately represents water as a static blocking accent and does not claim particle simulation.] is satisfied by emitted source fact [model/fountain-stream with stream/base-contact, stream/vertical-column, and stream/top-break at contiguous Y intervals 0.25..0.30m, 0.30..1.15m, and 1.15..1.20m]. Falsifier: the target fails if [The source deliberately represents water as a static blocking accent and does not claim particle simulation.] no longer holds or if the emitted source fact changes.
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
 * @evidence models/temple-fit-out.md AltarAndPlinthModelSource contributes model/altar-plinth with a 1.30 x 0.32 x 0.80m plinth and 0.90 x 0.50 x 0.48m body at the sanctuary north observation point as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.
 * @evidenceReview models/temple-fit-out.md #0f51831 Independent source review for class AltarAndPlinthModelSource: checked target models/temple-fit-out.md's authored predicate; observed target models/temple-fit-out.md predicate [AltarAndPlinthModelSource contributes model/altar-plinth with a 1.30 x 0.32 x 0.80m plinth and 0.90 x 0.50 x 0.48m body at the sanctuary north observation point as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] is satisfied by emitted source fact [the factory emits a 1.30 x 0.32 x 0.80m plinth and centered 0.90 x 0.50 x 0.48m body at the sanctuary north observation point]. Falsifier: the target fails if [AltarAndPlinthModelSource contributes model/altar-plinth with a 1.30 x 0.32 x 0.80m plinth and 0.90 x 0.50 x 0.48m body at the sanctuary north observation point as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] no longer holds or if the emitted source fact changes.
 * @evidence models/temple-fit-out.md#altar-and-plinth-prototype The factory returns a 1.30 × 0.32 × 0.80m plinth and a 0.90 × 0.50 × 0.48m body, keeping the plinth wider/deeper and centered for the source sanctuary north observation.
 * @evidenceReview models/temple-fit-out.md#altar-and-plinth-prototype #4d627b9 Independent source review for class AltarAndPlinthModelSource: checked target models/temple-fit-out.md#altar-and-plinth-prototype's authored predicate; observed target models/temple-fit-out.md#altar-and-plinth-prototype predicate [The factory returns a 1.30 × 0.32 × 0.80m plinth and a 0.90 × 0.50 × 0.48m body, keeping the plinth wider/deeper and centered for the source sanctuary north observation.] is satisfied by emitted source fact [the factory emits a 1.30 x 0.32 x 0.80m plinth and centered 0.90 x 0.50 x 0.48m body at the sanctuary north observation point]. Falsifier: the target fails if [The factory returns a 1.30 × 0.32 × 0.80m plinth and a 0.90 × 0.50 × 0.48m body, keeping the plinth wider/deeper and centered for the source sanctuary north observation.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes altar geometry only and consumes the existing `sanctuary` room relation without inventing a socket or placement graph.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for class AltarAndPlinthModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [The source realizes altar geometry only and consumes the existing sanctuary room relation without inventing a socket or placement graph.] is satisfied by emitted source fact [model/altar-plinth with a 1.30 x 0.32 x 0.80m plinth and 0.90 x 0.50 x 0.48m body at the sanctuary north observation point]. Falsifier: the target fails if [The source realizes altar geometry only and consumes the existing sanctuary room relation without inventing a socket or placement graph.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The two named stone parts provide the complete reviewed plinth/body hierarchy.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for class AltarAndPlinthModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The two named stone parts provide the complete reviewed plinth/body hierarchy.] is satisfied by emitted source fact [model/altar-plinth with a 1.30 x 0.32 x 0.80m plinth and 0.90 x 0.50 x 0.48m body at the sanctuary north observation point]. Falsifier: the target fails if [The two named stone parts provide the complete reviewed plinth/body hierarchy.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The source realizes the reviewed altar extents and sanctuary-facing relationship without exposing an upstream design gap.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The source realizes the reviewed altar extents and sanctuary-facing relationship without exposing an upstream design gap.] is satisfied by emitted source fact [model/altar-plinth with a 1.30 x 0.32 x 0.80m plinth and 0.90 x 0.50 x 0.48m body at the sanctuary north observation point]. Falsifier: this exclusion fails if [The source realizes the reviewed altar extents and sanctuary-facing relationship without exposing an upstream design gap.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#design-owned-construction The plinth and body preserve the reviewed size relation and separate stone surface owners.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 Independent source review for class AltarAndPlinthModelSource: checked target obligations/design/model-sources.md#design-owned-construction's authored predicate; observed target obligations/design/model-sources.md#design-owned-construction predicate [The plinth and body preserve the reviewed size relation and separate stone surface owners.] is satisfied by emitted source fact [model/altar-plinth with a 1.30 x 0.32 x 0.80m plinth and 0.90 x 0.50 x 0.48m body at the sanctuary north observation point]. Falsifier: the target fails if [The plinth and body preserve the reviewed size relation and separate stone surface owners.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed boxes and transforms regenerate the same altar without placement state.
 * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe Independent source review for class AltarAndPlinthModelSource: checked target obligations/design/model-sources.md#deterministic-build's authored predicate; observed target obligations/design/model-sources.md#deterministic-build predicate [Fixed boxes and transforms regenerate the same altar without placement state.] is satisfied by emitted source fact [model/altar-plinth with a 1.30 x 0.32 x 0.80m plinth and 0.90 x 0.50 x 0.48m body at the sanctuary north observation point]. Falsifier: the target fails if [Fixed boxes and transforms regenerate the same altar without placement state.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The altar stops at the reviewed blocking stone form and does not assert carvings or ritual simulation.
 * @evidenceReview obligations/design/model-sources.md#unsupported-fidelity-is-explicit #15c03fa Independent source review for class AltarAndPlinthModelSource: checked target obligations/design/model-sources.md#unsupported-fidelity-is-explicit's authored predicate; observed target obligations/design/model-sources.md#unsupported-fidelity-is-explicit predicate [The altar stops at the reviewed blocking stone form and does not assert carvings or ritual simulation.] is satisfied by emitted source fact [model/altar-plinth with a 1.30 x 0.32 x 0.80m plinth and 0.90 x 0.50 x 0.48m body at the sanctuary north observation point]. Falsifier: the target fails if [The altar stops at the reviewed blocking stone form and does not assert carvings or ritual simulation.] no longer holds or if the emitted source fact changes.
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
 * @evidence models/temple-fit-out.md RoofTileModelSource contributes model/roof-tile with a 0.44m overlap lip and roof-tile-top, roof-tile-edge, and roof-tile-underside as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.
 * @evidenceReview models/temple-fit-out.md #0f51831 Independent source review for class RoofTileModelSource: checked target models/temple-fit-out.md's authored predicate; observed target models/temple-fit-out.md predicate [RoofTileModelSource contributes model/roof-tile with a 0.44m overlap lip and roof-tile-top, roof-tile-edge, and roof-tile-underside as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] is satisfied by emitted source fact [the factory emits a 0.44m overlap lip and separate roof-tile-top, roof-tile-edge, and roof-tile-underside surfaces]. Falsifier: the target fails if [RoofTileModelSource contributes model/roof-tile with a 0.44m overlap lip and roof-tile-top, roof-tile-edge, and roof-tile-underside as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] no longer holds or if the emitted source fact changes.
 * @evidence models/temple-fit-out.md#roof-tile-prototype The tile factory keeps body and overlap lip within Z 0.00..0.44m, with a 0.72 × 0.44m underside and separate top, edge, and underside surfaces.
 * @evidenceReview models/temple-fit-out.md#roof-tile-prototype #16362fd Independent source review for class RoofTileModelSource: checked target models/temple-fit-out.md#roof-tile-prototype's authored predicate; observed target models/temple-fit-out.md#roof-tile-prototype predicate [The tile factory keeps body and overlap lip within Z 0.00..0.44m, with a 0.72 × 0.44m underside and separate top, edge, and underside surfaces.] is satisfied by emitted source fact [the factory emits a 0.44m overlap lip and separate roof-tile-top, roof-tile-edge, and roof-tile-underside surfaces]. Falsifier: the target fails if [The tile factory keeps body and overlap lip within Z 0.00..0.44m, with a 0.72 × 0.44m underside and separate top, edge, and underside surfaces.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes one reusable tile and leaves roof mass, row placement, and terracotta response to their owning branches.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for class RoofTileModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [The source realizes one reusable tile and leaves roof mass, row placement, and terracotta response to their owning branches.] is satisfied by emitted source fact [model/roof-tile with a 0.44m overlap lip and roof-tile-top, roof-tile-edge, and roof-tile-underside]. Falsifier: the target fails if [The source realizes one reusable tile and leaves roof mass, row placement, and terracotta response to their owning branches.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The three named parts provide the reviewed tile silhouette, overlap edge, and underside boundary.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for class RoofTileModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The three named parts provide the reviewed tile silhouette, overlap edge, and underside boundary.] is satisfied by emitted source fact [model/roof-tile with a 0.44m overlap lip and roof-tile-top, roof-tile-edge, and roof-tile-underside]. Falsifier: the target fails if [The three named parts provide the reviewed tile silhouette, overlap edge, and underside boundary.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The corrected 0.44m lip depth and occupied bounds implement the reviewed tile without a parent extent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The corrected 0.44m lip depth and occupied bounds implement the reviewed tile without a parent extent defect.] is satisfied by emitted source fact [model/roof-tile with a 0.44m overlap lip and roof-tile-top, roof-tile-edge, and roof-tile-underside]. Falsifier: this exclusion fails if [The corrected 0.44m lip depth and occupied bounds implement the reviewed tile without a parent extent defect.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#design-owned-construction The factory parts preserve the reviewed overlap geometry and exact stable surface IDs.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 Independent source review for class RoofTileModelSource: checked target obligations/design/model-sources.md#design-owned-construction's authored predicate; observed target obligations/design/model-sources.md#design-owned-construction predicate [The factory parts preserve the reviewed overlap geometry and exact stable surface IDs.] is satisfied by emitted source fact [model/roof-tile with a 0.44m overlap lip and roof-tile-top, roof-tile-edge, and roof-tile-underside]. Falsifier: the target fails if [The factory parts preserve the reviewed overlap geometry and exact stable surface IDs.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed boxes and transforms produce the same tile; row repetition is not hidden in this prototype.
 * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe Independent source review for class RoofTileModelSource: checked target obligations/design/model-sources.md#deterministic-build's authored predicate; observed target obligations/design/model-sources.md#deterministic-build predicate [Fixed boxes and transforms produce the same tile; row repetition is not hidden in this prototype.] is satisfied by emitted source fact [model/roof-tile with a 0.44m overlap lip and roof-tile-top, roof-tile-edge, and roof-tile-underside]. Falsifier: the target fails if [Fixed boxes and transforms produce the same tile; row repetition is not hidden in this prototype.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The tile is a blocking roof module and does not claim baked texture, weather simulation, or roof placement.
 * @evidenceReview obligations/design/model-sources.md#unsupported-fidelity-is-explicit #15c03fa Independent source review for class RoofTileModelSource: checked target obligations/design/model-sources.md#unsupported-fidelity-is-explicit's authored predicate; observed target obligations/design/model-sources.md#unsupported-fidelity-is-explicit predicate [The tile is a blocking roof module and does not claim baked texture, weather simulation, or roof placement.] is satisfied by emitted source fact [model/roof-tile with a 0.44m overlap lip and roof-tile-top, roof-tile-edge, and roof-tile-underside]. Falsifier: the target fails if [The tile is a blocking roof module and does not claim baked texture, weather simulation, or roof placement.] no longer holds or if the emitted source fact changes.
 */
export class RoofTileModelSource extends TempleModelSource {
  public constructor() {
    super("docs/models/temple-fit-out.md#roof-tile-prototype", roofTileModel);
  }
}

/**
 * @evidence models/temple-fit-out.md RecordsTableModelSource contributes model/records-table with a 1.20 x 0.60m top at Y 0.71..0.81m and four fixed legs at X +/-0.50m and Z +/-0.20m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.
 * @evidenceReview models/temple-fit-out.md #0f51831 Independent source review for class RecordsTableModelSource: checked target models/temple-fit-out.md's authored predicate; observed target models/temple-fit-out.md predicate [RecordsTableModelSource contributes model/records-table with a 1.20 x 0.60m top at Y 0.71..0.81m and four fixed legs at X +/-0.50m and Z +/-0.20m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] is satisfied by emitted source fact [the factory emits a 1.20 x 0.60m top at Y 0.71..0.81m and four 0.10m legs at X +/-0.50m and Z +/-0.20m]. Falsifier: the target fails if [RecordsTableModelSource contributes model/records-table with a 1.20 x 0.60m top at Y 0.71..0.81m and four fixed legs at X +/-0.50m and Z +/-0.20m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] no longer holds or if the emitted source fact changes.
 * @evidence models/temple-fit-out.md#records-table-prototype The table factory places a 1.20 × 0.60m top at Y 0.71..0.81m and four 0.10m square legs at X ±0.50m, Z ±0.20m, preserving its readable support footprint.
 * @evidenceReview models/temple-fit-out.md#records-table-prototype #ffc73de Independent source review for class RecordsTableModelSource: checked target models/temple-fit-out.md#records-table-prototype's authored predicate; observed target models/temple-fit-out.md#records-table-prototype predicate [The table factory places a 1.20 × 0.60m top at Y 0.71..0.81m and four 0.10m square legs at X ±0.50m, Z ±0.20m, preserving its readable support footprint.] is satisfied by emitted source fact [the factory emits a 1.20 x 0.60m top at Y 0.71..0.81m and four 0.10m legs at X +/-0.50m and Z +/-0.20m]. Falsifier: the target fails if [The table factory places a 1.20 × 0.60m top at Y 0.71..0.81m and four 0.10m square legs at X ±0.50m, Z ±0.20m, preserving its readable support footprint.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-scope-preservation The source owns the table prototype and does not place it in the records room or reserve its route.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for class RecordsTableModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [The source owns the table prototype and does not place it in the records room or reserve its route.] is satisfied by emitted source fact [model/records-table with a 1.20 x 0.60m top at Y 0.71..0.81m and four fixed legs at X +/-0.50m and Z +/-0.20m]. Falsifier: the target fails if [The source owns the table prototype and does not place it in the records room or reserve its route.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The top and four generated legs form the complete reviewed table hierarchy with stable surface names.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for class RecordsTableModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The top and four generated legs form the complete reviewed table hierarchy with stable surface names.] is satisfied by emitted source fact [model/records-table with a 1.20 x 0.60m top at Y 0.71..0.81m and four fixed legs at X +/-0.50m and Z +/-0.20m]. Falsifier: the target fails if [The top and four generated legs form the complete reviewed table hierarchy with stable surface names.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed top/leg dimensions and support positions are implemented directly, so construction exposed no parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The reviewed top/leg dimensions and support positions are implemented directly, so construction exposed no parent defect.] is satisfied by emitted source fact [model/records-table with a 1.20 x 0.60m top at Y 0.71..0.81m and four fixed legs at X +/-0.50m and Z +/-0.20m]. Falsifier: this exclusion fails if [The reviewed top/leg dimensions and support positions are implemented directly, so construction exposed no parent defect.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#design-owned-construction The top and four legs preserve the table's reviewed footprint, contact, and wood surface split.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 Independent source review for class RecordsTableModelSource: checked target obligations/design/model-sources.md#design-owned-construction's authored predicate; observed target obligations/design/model-sources.md#design-owned-construction predicate [The top and four legs preserve the table's reviewed footprint, contact, and wood surface split.] is satisfied by emitted source fact [model/records-table with a 1.20 x 0.60m top at Y 0.71..0.81m and four fixed legs at X +/-0.50m and Z +/-0.20m]. Falsifier: the target fails if [The top and four legs preserve the table's reviewed footprint, contact, and wood surface split.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#deterministic-build The leg coordinate list and fixed dimensions deterministically regenerate the same five-part table.
 * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe Independent source review for class RecordsTableModelSource: checked target obligations/design/model-sources.md#deterministic-build's authored predicate; observed target obligations/design/model-sources.md#deterministic-build predicate [The leg coordinate list and fixed dimensions deterministically regenerate the same five-part table.] is satisfied by emitted source fact [model/records-table with a 1.20 x 0.60m top at Y 0.71..0.81m and four fixed legs at X +/-0.50m and Z +/-0.20m]. Falsifier: the target fails if [The leg coordinate list and fixed dimensions deterministically regenerate the same five-part table.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The table is a bounded blocking work surface without unclaimed drawers, joinery, or use simulation.
 * @evidenceReview obligations/design/model-sources.md#unsupported-fidelity-is-explicit #15c03fa Independent source review for class RecordsTableModelSource: checked target obligations/design/model-sources.md#unsupported-fidelity-is-explicit's authored predicate; observed target obligations/design/model-sources.md#unsupported-fidelity-is-explicit predicate [The table is a bounded blocking work surface without unclaimed drawers, joinery, or use simulation.] is satisfied by emitted source fact [model/records-table with a 1.20 x 0.60m top at Y 0.71..0.81m and four fixed legs at X +/-0.50m and Z +/-0.20m]. Falsifier: the target fails if [The table is a bounded blocking work surface without unclaimed drawers, joinery, or use simulation.] no longer holds or if the emitted source fact changes.
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
 * @evidence models/temple-fit-out.md RecordsShelfModelSource contributes model/records-shelf with frame X +/-0.40m and boards at Y 0.36..0.44m, 0.86..0.94m, and 1.36..1.44m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.
 * @evidenceReview models/temple-fit-out.md #0f51831 Independent source review for class RecordsShelfModelSource: checked target models/temple-fit-out.md's authored predicate; observed target models/temple-fit-out.md predicate [RecordsShelfModelSource contributes model/records-shelf with frame X +/-0.40m and boards at Y 0.36..0.44m, 0.86..0.94m, and 1.36..1.44m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] is satisfied by emitted source fact [the factory emits a 1.80m frame at X +/-0.40m and three boards at Y 0.36..0.44m, 0.86..0.94m, and 1.36..1.44m]. Falsifier: the target fails if [RecordsShelfModelSource contributes model/records-shelf with frame X +/-0.40m and boards at Y 0.36..0.44m, 0.86..0.94m, and 1.36..1.44m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] no longer holds or if the emitted source fact changes.
 * @evidence models/temple-fit-out.md#records-shelf-prototype The shelf factory fixes frames at X ±0.40m and boards at Y 0.36..0.44m, 0.86..0.94m, and 1.36..1.44m within its 1.80m height.
 * @evidenceReview models/temple-fit-out.md#records-shelf-prototype #950597f Independent source review for class RecordsShelfModelSource: checked target models/temple-fit-out.md#records-shelf-prototype's authored predicate; observed target models/temple-fit-out.md#records-shelf-prototype predicate [The shelf factory fixes frames at X ±0.40m and boards at Y 0.36..0.44m, 0.86..0.94m, and 1.36..1.44m within its 1.80m height.] is satisfied by emitted source fact [the factory emits a 1.80m frame at X +/-0.40m and three boards at Y 0.36..0.44m, 0.86..0.94m, and 1.36..1.44m]. Falsifier: the target fails if [The shelf factory fixes frames at X ±0.40m and boards at Y 0.36..0.44m, 0.86..0.94m, and 1.36..1.44m within its 1.80m height.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes the records-shelf prototype and leaves records-room quantity, orientation, and placement to instances.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for class RecordsShelfModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [The source realizes the records-shelf prototype and leaves records-room quantity, orientation, and placement to instances.] is satisfied by emitted source fact [model/records-shelf with frame X +/-0.40m and boards at Y 0.36..0.44m, 0.86..0.94m, and 1.36..1.44m]. Falsifier: the target fails if [The source realizes the records-shelf prototype and leaves records-room quantity, orientation, and placement to instances.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The two frames and three interval-defined boards provide the complete reviewed shelf structure.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for class RecordsShelfModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The two frames and three interval-defined boards provide the complete reviewed shelf structure.] is satisfied by emitted source fact [model/records-shelf with frame X +/-0.40m and boards at Y 0.36..0.44m, 0.86..0.94m, and 1.36..1.44m]. Falsifier: the target fails if [The two frames and three interval-defined boards provide the complete reviewed shelf structure.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed frame extent and board intervals compile as written without requiring a parent shelf decision.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The reviewed frame extent and board intervals compile as written without requiring a parent shelf decision.] is satisfied by emitted source fact [model/records-shelf with frame X +/-0.40m and boards at Y 0.36..0.44m, 0.86..0.94m, and 1.36..1.44m]. Falsifier: this exclusion fails if [The reviewed frame extent and board intervals compile as written without requiring a parent shelf decision.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#design-owned-construction The generated boards preserve the reviewed gaps, support frames, depth, and separate wood surface owners.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 Independent source review for class RecordsShelfModelSource: checked target obligations/design/model-sources.md#design-owned-construction's authored predicate; observed target obligations/design/model-sources.md#design-owned-construction predicate [The generated boards preserve the reviewed gaps, support frames, depth, and separate wood surface owners.] is satisfied by emitted source fact [model/records-shelf with frame X +/-0.40m and boards at Y 0.36..0.44m, 0.86..0.94m, and 1.36..1.44m]. Falsifier: the target fails if [The generated boards preserve the reviewed gaps, support frames, depth, and separate wood surface owners.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#deterministic-build The explicit interval list and fixed frame transforms produce the same five-part shelf.
 * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe Independent source review for class RecordsShelfModelSource: checked target obligations/design/model-sources.md#deterministic-build's authored predicate; observed target obligations/design/model-sources.md#deterministic-build predicate [The explicit interval list and fixed frame transforms produce the same five-part shelf.] is satisfied by emitted source fact [model/records-shelf with frame X +/-0.40m and boards at Y 0.36..0.44m, 0.86..0.94m, and 1.36..1.44m]. Falsifier: the target fails if [The explicit interval list and fixed frame transforms produce the same five-part shelf.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The shelf is a fixed blocking storage module and does not claim contents or joinery beyond the reviewed boards.
 * @evidenceReview obligations/design/model-sources.md#unsupported-fidelity-is-explicit #15c03fa Independent source review for class RecordsShelfModelSource: checked target obligations/design/model-sources.md#unsupported-fidelity-is-explicit's authored predicate; observed target obligations/design/model-sources.md#unsupported-fidelity-is-explicit predicate [The shelf is a fixed blocking storage module and does not claim contents or joinery beyond the reviewed boards.] is satisfied by emitted source fact [model/records-shelf with frame X +/-0.40m and boards at Y 0.36..0.44m, 0.86..0.94m, and 1.36..1.44m]. Falsifier: the target fails if [The shelf is a fixed blocking storage module and does not claim contents or joinery beyond the reviewed boards.] no longer holds or if the emitted source fact changes.
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
 * @evidence models/temple-fit-out.md RecordsChestModelSource contributes model/records-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.
 * @evidenceReview models/temple-fit-out.md #0f51831 Independent source review for class RecordsChestModelSource: checked target models/temple-fit-out.md's authored predicate; observed target models/temple-fit-out.md predicate [RecordsChestModelSource contributes model/records-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] is satisfied by emitted source fact [the factory emits a 0.80 x 0.45 x 0.45m body Y 0.00..0.45m and 0.10m lid Y 0.45..0.55m]. Falsifier: the target fails if [RecordsChestModelSource contributes model/records-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] no longer holds or if the emitted source fact changes.
 * @evidence models/temple-fit-out.md#records-chest-prototype The chest factory keeps the body at 0.80 × 0.45 × 0.45m from Y 0.00..0.45m and the 0.10m lid from Y 0.45..0.55m.
 * @evidenceReview models/temple-fit-out.md#records-chest-prototype #9e1a630 Independent source review for class RecordsChestModelSource: checked target models/temple-fit-out.md#records-chest-prototype's authored predicate; observed target models/temple-fit-out.md#records-chest-prototype predicate [The chest factory keeps the body at 0.80 × 0.45 × 0.45m from Y 0.00..0.45m and the 0.10m lid from Y 0.45..0.55m.] is satisfied by emitted source fact [the factory emits a 0.80 x 0.45 x 0.45m body Y 0.00..0.45m and 0.10m lid Y 0.45..0.55m]. Falsifier: the target fails if [The chest factory keeps the body at 0.80 × 0.45 × 0.45m from Y 0.00..0.45m and the 0.10m lid from Y 0.45..0.55m.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes a closed records chest and does not add records-room placement, contents, or opening behavior.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for class RecordsChestModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [The source realizes a closed records chest and does not add records-room placement, contents, or opening behavior.] is satisfied by emitted source fact [model/records-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m]. Falsifier: the target fails if [The source realizes a closed records chest and does not add records-room placement, contents, or opening behavior.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The body and lid are the complete reviewed chest hierarchy with separately bindable surfaces.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for class RecordsChestModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The body and lid are the complete reviewed chest hierarchy with separately bindable surfaces.] is satisfied by emitted source fact [model/records-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m]. Falsifier: the target fails if [The body and lid are the complete reviewed chest hierarchy with separately bindable surfaces.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed closed-chest bounds and lid contact are directly represented, exposing no upstream defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The reviewed closed-chest bounds and lid contact are directly represented, exposing no upstream defect.] is satisfied by emitted source fact [model/records-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m]. Falsifier: this exclusion fails if [The reviewed closed-chest bounds and lid contact are directly represented, exposing no upstream defect.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#design-owned-construction The two boxes preserve the reviewed body/lid contact and stable surface ownership.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 Independent source review for class RecordsChestModelSource: checked target obligations/design/model-sources.md#design-owned-construction's authored predicate; observed target obligations/design/model-sources.md#design-owned-construction predicate [The two boxes preserve the reviewed body/lid contact and stable surface ownership.] is satisfied by emitted source fact [model/records-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m]. Falsifier: the target fails if [The two boxes preserve the reviewed body/lid contact and stable surface ownership.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed dimensions and centers regenerate one identical closed chest.
 * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe Independent source review for class RecordsChestModelSource: checked target obligations/design/model-sources.md#deterministic-build's authored predicate; observed target obligations/design/model-sources.md#deterministic-build predicate [Fixed dimensions and centers regenerate one identical closed chest.] is satisfied by emitted source fact [model/records-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m]. Falsifier: the target fails if [Fixed dimensions and centers regenerate one identical closed chest.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The source stops at a closed blocking chest and does not imply hinges, contents, or interaction.
 * @evidenceReview obligations/design/model-sources.md#unsupported-fidelity-is-explicit #15c03fa Independent source review for class RecordsChestModelSource: checked target obligations/design/model-sources.md#unsupported-fidelity-is-explicit's authored predicate; observed target obligations/design/model-sources.md#unsupported-fidelity-is-explicit predicate [The source stops at a closed blocking chest and does not imply hinges, contents, or interaction.] is satisfied by emitted source fact [model/records-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m]. Falsifier: the target fails if [The source stops at a closed blocking chest and does not imply hinges, contents, or interaction.] no longer holds or if the emitted source fact changes.
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
 * @evidence models/temple-fit-out.md StorageShelfModelSource contributes model/storage-shelf with frame X +/-0.40m and four boards at Y 0.35..0.43m, 0.70..0.78m, 1.05..1.13m, and 1.40..1.48m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.
 * @evidenceReview models/temple-fit-out.md #0f51831 Independent source review for class StorageShelfModelSource: checked target models/temple-fit-out.md's authored predicate; observed target models/temple-fit-out.md predicate [StorageShelfModelSource contributes model/storage-shelf with frame X +/-0.40m and four boards at Y 0.35..0.43m, 0.70..0.78m, 1.05..1.13m, and 1.40..1.48m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] is satisfied by emitted source fact [the factory emits a 1.70m frame and four boards at Y 0.35..0.43m, 0.70..0.78m, 1.05..1.13m, and 1.40..1.48m]. Falsifier: the target fails if [StorageShelfModelSource contributes model/storage-shelf with frame X +/-0.40m and four boards at Y 0.35..0.43m, 0.70..0.78m, 1.05..1.13m, and 1.40..1.48m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] no longer holds or if the emitted source fact changes.
 * @evidence models/temple-fit-out.md#storage-shelf-prototype The storage shelf fixes 1.70m frames and board intervals Y 0.35..0.43m, 0.70..0.78m, 1.05..1.13m, and 1.40..1.48m.
 * @evidenceReview models/temple-fit-out.md#storage-shelf-prototype #02a5183 Independent source review for class StorageShelfModelSource: checked target models/temple-fit-out.md#storage-shelf-prototype's authored predicate; observed target models/temple-fit-out.md#storage-shelf-prototype predicate [The storage shelf fixes 1.70m frames and board intervals Y 0.35..0.43m, 0.70..0.78m, 1.05..1.13m, and 1.40..1.48m.] is satisfied by emitted source fact [the factory emits a 1.70m frame and four boards at Y 0.35..0.43m, 0.70..0.78m, 1.05..1.13m, and 1.40..1.48m]. Falsifier: the target fails if [The storage shelf fixes 1.70m frames and board intervals Y 0.35..0.43m, 0.70..0.78m, 1.05..1.13m, and 1.40..1.48m.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes only the storage shelf prototype and leaves storage-room count, placement, and route reservation to instances.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for class StorageShelfModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [The source realizes only the storage shelf prototype and leaves storage-room count, placement, and route reservation to instances.] is satisfied by emitted source fact [model/storage-shelf with frame X +/-0.40m and four boards at Y 0.35..0.43m, 0.70..0.78m, 1.05..1.13m, and 1.40..1.48m]. Falsifier: the target fails if [The source realizes only the storage shelf prototype and leaves storage-room count, placement, and route reservation to instances.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion Two frames plus four explicit boards provide the complete reviewed storage shelf.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for class StorageShelfModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [Two frames plus four explicit boards provide the complete reviewed storage shelf.] is satisfied by emitted source fact [model/storage-shelf with frame X +/-0.40m and four boards at Y 0.35..0.43m, 0.70..0.78m, 1.05..1.13m, and 1.40..1.48m]. Falsifier: the target fails if [Two frames plus four explicit boards provide the complete reviewed storage shelf.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed storage board intervals, frame bounds, and negative gaps are implemented without an upstream omission.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The reviewed storage board intervals, frame bounds, and negative gaps are implemented without an upstream omission.] is satisfied by emitted source fact [model/storage-shelf with frame X +/-0.40m and four boards at Y 0.35..0.43m, 0.70..0.78m, 1.05..1.13m, and 1.40..1.48m]. Falsifier: this exclusion fails if [The reviewed storage board intervals, frame bounds, and negative gaps are implemented without an upstream omission.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#design-owned-construction The generated boards and frames preserve the storage shelf's support, gaps, depth, and surface IDs.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 Independent source review for class StorageShelfModelSource: checked target obligations/design/model-sources.md#design-owned-construction's authored predicate; observed target obligations/design/model-sources.md#design-owned-construction predicate [The generated boards and frames preserve the storage shelf's support, gaps, depth, and surface IDs.] is satisfied by emitted source fact [model/storage-shelf with frame X +/-0.40m and four boards at Y 0.35..0.43m, 0.70..0.78m, 1.05..1.13m, and 1.40..1.48m]. Falsifier: the target fails if [The generated boards and frames preserve the storage shelf's support, gaps, depth, and surface IDs.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#deterministic-build The fixed interval list and transforms regenerate the same six-part shelf.
 * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe Independent source review for class StorageShelfModelSource: checked target obligations/design/model-sources.md#deterministic-build's authored predicate; observed target obligations/design/model-sources.md#deterministic-build predicate [The fixed interval list and transforms regenerate the same six-part shelf.] is satisfied by emitted source fact [model/storage-shelf with frame X +/-0.40m and four boards at Y 0.35..0.43m, 0.70..0.78m, 1.05..1.13m, and 1.40..1.48m]. Falsifier: the target fails if [The fixed interval list and transforms regenerate the same six-part shelf.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The shelf is a bounded blocking module and does not claim stored object contents or hidden fixings.
 * @evidenceReview obligations/design/model-sources.md#unsupported-fidelity-is-explicit #15c03fa Independent source review for class StorageShelfModelSource: checked target obligations/design/model-sources.md#unsupported-fidelity-is-explicit's authored predicate; observed target obligations/design/model-sources.md#unsupported-fidelity-is-explicit predicate [The shelf is a bounded blocking module and does not claim stored object contents or hidden fixings.] is satisfied by emitted source fact [model/storage-shelf with frame X +/-0.40m and four boards at Y 0.35..0.43m, 0.70..0.78m, 1.05..1.13m, and 1.40..1.48m]. Falsifier: the target fails if [The shelf is a bounded blocking module and does not claim stored object contents or hidden fixings.] no longer holds or if the emitted source fact changes.
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
 * @evidence models/temple-fit-out.md StorageChestModelSource contributes model/storage-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.
 * @evidenceReview models/temple-fit-out.md #0f51831 Independent source review for class StorageChestModelSource: checked target models/temple-fit-out.md's authored predicate; observed target models/temple-fit-out.md predicate [StorageChestModelSource contributes model/storage-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] is satisfied by emitted source fact [the factory emits a 0.78 x 0.45 x 0.46m body Y 0.00..0.45m and 0.10m lid Y 0.45..0.55m]. Falsifier: the target fails if [StorageChestModelSource contributes model/storage-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] no longer holds or if the emitted source fact changes.
 * @evidence models/temple-fit-out.md#storage-chest-prototype The storage chest factory keeps a 0.78 × 0.45 × 0.46m body from Y 0.00..0.45m and a matching 0.10m lid from Y 0.45..0.55m.
 * @evidenceReview models/temple-fit-out.md#storage-chest-prototype #f0e0f4e Independent source review for class StorageChestModelSource: checked target models/temple-fit-out.md#storage-chest-prototype's authored predicate; observed target models/temple-fit-out.md#storage-chest-prototype predicate [The storage chest factory keeps a 0.78 × 0.45 × 0.46m body from Y 0.00..0.45m and a matching 0.10m lid from Y 0.45..0.55m.] is satisfied by emitted source fact [the factory emits a 0.78 x 0.45 x 0.46m body Y 0.00..0.45m and 0.10m lid Y 0.45..0.55m]. Falsifier: the target fails if [The storage chest factory keeps a 0.78 × 0.45 × 0.46m body from Y 0.00..0.45m and a matching 0.10m lid from Y 0.45..0.55m.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes the storage chest only and does not invent storage-room placement, contents, or lid motion.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for class StorageChestModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [The source realizes the storage chest only and does not invent storage-room placement, contents, or lid motion.] is satisfied by emitted source fact [model/storage-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m]. Falsifier: the target fails if [The source realizes the storage chest only and does not invent storage-room placement, contents, or lid motion.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The body/lid pair is a complete deterministic source artifact with the reviewed stable surfaces.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for class StorageChestModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The body/lid pair is a complete deterministic source artifact with the reviewed stable surfaces.] is satisfied by emitted source fact [model/storage-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m]. Falsifier: the target fails if [The body/lid pair is a complete deterministic source artifact with the reviewed stable surfaces.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed closed bounds and lid contact are implemented directly without exposing a parent design gap.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The reviewed closed bounds and lid contact are implemented directly without exposing a parent design gap.] is satisfied by emitted source fact [model/storage-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m]. Falsifier: this exclusion fails if [The reviewed closed bounds and lid contact are implemented directly without exposing a parent design gap.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#design-owned-construction The two boxes preserve the storage chest's reviewed dimensions, contact, and surface split.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 Independent source review for class StorageChestModelSource: checked target obligations/design/model-sources.md#design-owned-construction's authored predicate; observed target obligations/design/model-sources.md#design-owned-construction predicate [The two boxes preserve the storage chest's reviewed dimensions, contact, and surface split.] is satisfied by emitted source fact [model/storage-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m]. Falsifier: the target fails if [The two boxes preserve the storage chest's reviewed dimensions, contact, and surface split.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed dimensions and transforms regenerate the same closed chest.
 * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe Independent source review for class StorageChestModelSource: checked target obligations/design/model-sources.md#deterministic-build's authored predicate; observed target obligations/design/model-sources.md#deterministic-build predicate [Fixed dimensions and transforms regenerate the same closed chest.] is satisfied by emitted source fact [model/storage-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m]. Falsifier: the target fails if [Fixed dimensions and transforms regenerate the same closed chest.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The source deliberately stops at the reviewed blocking chest and does not imply contents or interaction.
 * @evidenceReview obligations/design/model-sources.md#unsupported-fidelity-is-explicit #15c03fa Independent source review for class StorageChestModelSource: checked target obligations/design/model-sources.md#unsupported-fidelity-is-explicit's authored predicate; observed target obligations/design/model-sources.md#unsupported-fidelity-is-explicit predicate [The source deliberately stops at the reviewed blocking chest and does not imply contents or interaction.] is satisfied by emitted source fact [model/storage-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m]. Falsifier: the target fails if [The source deliberately stops at the reviewed blocking chest and does not imply contents or interaction.] no longer holds or if the emitted source fact changes.
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
 * @evidence models/temple-fit-out.md StorageBasketModelSource contributes model/storage-basket with open tapered body radii 0.18..0.21m over Y 0.08..0.40m, rim Y 0.40..0.44m, and handle Y 0.40..0.48m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.
 * @evidenceReview models/temple-fit-out.md #0f51831 Independent source review for class StorageBasketModelSource: checked target models/temple-fit-out.md's authored predicate; observed target models/temple-fit-out.md predicate [StorageBasketModelSource contributes model/storage-basket with open tapered body radii 0.18..0.21m over Y 0.08..0.40m, rim Y 0.40..0.44m, and handle Y 0.40..0.48m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] is satisfied by emitted source fact [the factory emits an open tapered body radii 0.18..0.21m over Y 0.08..0.40m, rim Y 0.40..0.44m, and handle Y 0.40..0.48m]. Falsifier: the target fails if [StorageBasketModelSource contributes model/storage-basket with open tapered body radii 0.18..0.21m over Y 0.08..0.40m, rim Y 0.40..0.44m, and handle Y 0.40..0.48m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] no longer holds or if the emitted source fact changes.
 * @evidence models/temple-fit-out.md#storage-basket-prototype The basket factory keeps the fiber body profile at radii 0.18..0.21m over Y 0.08..0.40m, a separate rim over Y 0.40..0.44m, and a top handle at Y 0.40..0.48m.
 * @evidenceReview models/temple-fit-out.md#storage-basket-prototype #b34f82c Independent source review for class StorageBasketModelSource: checked target models/temple-fit-out.md#storage-basket-prototype's authored predicate; observed target models/temple-fit-out.md#storage-basket-prototype predicate [The basket factory keeps the fiber body profile at radii 0.18..0.21m over Y 0.08..0.40m, a separate rim over Y 0.40..0.44m, and a top handle at Y 0.40..0.48m.] is satisfied by emitted source fact [the factory emits an open tapered body radii 0.18..0.21m over Y 0.08..0.40m, rim Y 0.40..0.44m, and handle Y 0.40..0.48m]. Falsifier: the target fails if [The basket factory keeps the fiber body profile at radii 0.18..0.21m over Y 0.08..0.40m, a separate rim over Y 0.40..0.44m, and a top handle at Y 0.40..0.48m.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-scope-preservation The source owns one open basket and does not add storage placement, quantity, or contents.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for class StorageBasketModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [The source owns one open basket and does not add storage placement, quantity, or contents.] is satisfied by emitted source fact [model/storage-basket with open tapered body radii 0.18..0.21m over Y 0.08..0.40m, rim Y 0.40..0.44m, and handle Y 0.40..0.48m]. Falsifier: the target fails if [The source owns one open basket and does not add storage placement, quantity, or contents.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion Base, tapered body, rim, and handle are all executable named parts of the reviewed open basket.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for class StorageBasketModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [Base, tapered body, rim, and handle are all executable named parts of the reviewed open basket.] is satisfied by emitted source fact [model/storage-basket with open tapered body radii 0.18..0.21m over Y 0.08..0.40m, rim Y 0.40..0.44m, and handle Y 0.40..0.48m]. Falsifier: the target fails if [Base, tapered body, rim, and handle are all executable named parts of the reviewed open basket.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed cavity, rim interval, handle contact, and fiber bounds compile directly with no parent defect exposed.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The reviewed cavity, rim interval, handle contact, and fiber bounds compile directly with no parent defect exposed.] is satisfied by emitted source fact [model/storage-basket with open tapered body radii 0.18..0.21m over Y 0.08..0.40m, rim Y 0.40..0.44m, and handle Y 0.40..0.48m]. Falsifier: this exclusion fails if [The reviewed cavity, rim interval, handle contact, and fiber bounds compile directly with no parent defect exposed.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#design-owned-construction The revolved body/rim and handle preserve the basket's open boundary, taper, contact, and surface owners.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 Independent source review for class StorageBasketModelSource: checked target obligations/design/model-sources.md#design-owned-construction's authored predicate; observed target obligations/design/model-sources.md#design-owned-construction predicate [The revolved body/rim and handle preserve the basket's open boundary, taper, contact, and surface owners.] is satisfied by emitted source fact [model/storage-basket with open tapered body radii 0.18..0.21m over Y 0.08..0.40m, rim Y 0.40..0.44m, and handle Y 0.40..0.48m]. Falsifier: the target fails if [The revolved body/rim and handle preserve the basket's open boundary, taper, contact, and surface owners.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed profiles and 20-segment revolutions regenerate the same four-part basket.
 * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe Independent source review for class StorageBasketModelSource: checked target obligations/design/model-sources.md#deterministic-build's authored predicate; observed target obligations/design/model-sources.md#deterministic-build predicate [Fixed profiles and 20-segment revolutions regenerate the same four-part basket.] is satisfied by emitted source fact [model/storage-basket with open tapered body radii 0.18..0.21m over Y 0.08..0.40m, rim Y 0.40..0.44m, and handle Y 0.40..0.48m]. Falsifier: the target fails if [Fixed profiles and 20-segment revolutions regenerate the same four-part basket.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The basket is an open blocking container and does not claim woven texture or contents.
 * @evidenceReview obligations/design/model-sources.md#unsupported-fidelity-is-explicit #15c03fa Independent source review for class StorageBasketModelSource: checked target obligations/design/model-sources.md#unsupported-fidelity-is-explicit's authored predicate; observed target obligations/design/model-sources.md#unsupported-fidelity-is-explicit predicate [The basket is an open blocking container and does not claim woven texture or contents.] is satisfied by emitted source fact [model/storage-basket with open tapered body radii 0.18..0.21m over Y 0.08..0.40m, rim Y 0.40..0.44m, and handle Y 0.40..0.48m]. Falsifier: the target fails if [The basket is an open blocking container and does not claim woven texture or contents.] no longer holds or if the emitted source fact changes.
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
 * @evidence models/temple-fit-out.md VotiveDisplayModelSource contributes model/votive-display with plinth, rear board, four borders, and ledge around empty recess X -0.42..0.42m, Y 0.80..1.22m, Z -0.09..-0.02m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.
 * @evidenceReview models/temple-fit-out.md #0f51831 Independent source review for class VotiveDisplayModelSource: checked target models/temple-fit-out.md's authored predicate; observed target models/temple-fit-out.md predicate [VotiveDisplayModelSource contributes model/votive-display with plinth, rear board, four borders, and ledge around empty recess X -0.42..0.42m, Y 0.80..1.22m, Z -0.09..-0.02m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] is satisfied by emitted source fact [the factory emits the plinth, rear board, four borders, and ledge around empty recess X -0.42..0.42m, Y 0.80..1.22m, Z -0.09..-0.02m]. Falsifier: the target fails if [VotiveDisplayModelSource contributes model/votive-display with plinth, rear board, four borders, and ledge around empty recess X -0.42..0.42m, Y 0.80..1.22m, Z -0.09..-0.02m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] no longer holds or if the emitted source fact changes.
 * @evidence models/temple-fit-out.md#votive-display-prototype The display factory uses a plinth, rear board, four borders, and ledge so the field X -0.42..0.42m, Y 0.80..1.22m, Z -0.09..-0.02m remains an actual open recess.
 * @evidenceReview models/temple-fit-out.md#votive-display-prototype #c47f8a5 Independent source review for class VotiveDisplayModelSource: checked target models/temple-fit-out.md#votive-display-prototype's authored predicate; observed target models/temple-fit-out.md#votive-display-prototype predicate [The display factory uses a plinth, rear board, four borders, and ledge so the field X -0.42..0.42m, Y 0.80..1.22m, Z -0.09..-0.02m remains an actual open recess.] is satisfied by emitted source fact [the factory emits the plinth, rear board, four borders, and ledge around empty recess X -0.42..0.42m, Y 0.80..1.22m, Z -0.09..-0.02m]. Falsifier: the target fails if [The display factory uses a plinth, rear board, four borders, and ledge so the field X -0.42..0.42m, Y 0.80..1.22m, Z -0.09..-0.02m remains an actual open recess.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes the display's bounded geometry and negative space without adding room placement or votive population.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for class VotiveDisplayModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [The source realizes the display's bounded geometry and negative space without adding room placement or votive population.] is satisfied by emitted source fact [model/votive-display with plinth, rear board, four borders, and ledge around empty recess X -0.42..0.42m, Y 0.80..1.22m, Z -0.09..-0.02m]. Falsifier: the target fails if [The source realizes the display's bounded geometry and negative space without adding room placement or votive population.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The board and border parts provide a complete source realization while leaving the reviewed field empty rather than filling it with a named solid.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for class VotiveDisplayModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The board and border parts provide a complete source realization while leaving the reviewed field empty rather than filling it with a named solid.] is satisfied by emitted source fact [model/votive-display with plinth, rear board, four borders, and ledge around empty recess X -0.42..0.42m, Y 0.80..1.22m, Z -0.09..-0.02m]. Falsifier: the target fails if [The board and border parts provide a complete source realization while leaving the reviewed field empty rather than filling it with a named solid.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The corrected open recess, border extents, and ledge contact are implemented as reviewed, with no parent negative-space defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The corrected open recess, border extents, and ledge contact are implemented as reviewed, with no parent negative-space defect.] is satisfied by emitted source fact [model/votive-display with plinth, rear board, four borders, and ledge around empty recess X -0.42..0.42m, Y 0.80..1.22m, Z -0.09..-0.02m]. Falsifier: this exclusion fails if [The corrected open recess, border extents, and ledge contact are implemented as reviewed, with no parent negative-space defect.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#design-owned-construction The returned parts preserve the display's plinth, rear boundary, four border edges, ledge, and negative field.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 Independent source review for class VotiveDisplayModelSource: checked target obligations/design/model-sources.md#design-owned-construction's authored predicate; observed target obligations/design/model-sources.md#design-owned-construction predicate [The returned parts preserve the display's plinth, rear boundary, four border edges, ledge, and negative field.] is satisfied by emitted source fact [model/votive-display with plinth, rear board, four borders, and ledge around empty recess X -0.42..0.42m, Y 0.80..1.22m, Z -0.09..-0.02m]. Falsifier: the target fails if [The returned parts preserve the display's plinth, rear boundary, four border edges, ledge, and negative field.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed boxes and transforms regenerate the same display and empty field.
 * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe Independent source review for class VotiveDisplayModelSource: checked target obligations/design/model-sources.md#deterministic-build's authored predicate; observed target obligations/design/model-sources.md#deterministic-build predicate [Fixed boxes and transforms regenerate the same display and empty field.] is satisfied by emitted source fact [model/votive-display with plinth, rear board, four borders, and ledge around empty recess X -0.42..0.42m, Y 0.80..1.22m, Z -0.09..-0.02m]. Falsifier: the target fails if [Fixed boxes and transforms regenerate the same display and empty field.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The display is a static blocking recess and does not claim inscriptions or individual votive contents.
 * @evidenceReview obligations/design/model-sources.md#unsupported-fidelity-is-explicit #15c03fa Independent source review for class VotiveDisplayModelSource: checked target obligations/design/model-sources.md#unsupported-fidelity-is-explicit's authored predicate; observed target obligations/design/model-sources.md#unsupported-fidelity-is-explicit predicate [The display is a static blocking recess and does not claim inscriptions or individual votive contents.] is satisfied by emitted source fact [model/votive-display with plinth, rear board, four borders, and ledge around empty recess X -0.42..0.42m, Y 0.80..1.22m, Z -0.09..-0.02m]. Falsifier: the target fails if [The display is a static blocking recess and does not claim inscriptions or individual votive contents.] no longer holds or if the emitted source fact changes.
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
 * @evidence models/temple-fit-out.md CeramicVesselModelSource contributes model/ceramic-vessel with foot Y 0.00..0.04m, body Y 0.04..0.26m, neck Y 0.26..0.31m, and rim Y 0.31..0.34m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.
 * @evidenceReview models/temple-fit-out.md #0f51831 Independent source review for class CeramicVesselModelSource: checked target models/temple-fit-out.md's authored predicate; observed target models/temple-fit-out.md predicate [CeramicVesselModelSource contributes model/ceramic-vessel with foot Y 0.00..0.04m, body Y 0.04..0.26m, neck Y 0.26..0.31m, and rim Y 0.31..0.34m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] is satisfied by emitted source fact [the factory emits foot Y 0.00..0.04m, body Y 0.04..0.26m, neck Y 0.26..0.31m, and rim Y 0.31..0.34m]. Falsifier: the target fails if [CeramicVesselModelSource contributes model/ceramic-vessel with foot Y 0.00..0.04m, body Y 0.04..0.26m, neck Y 0.26..0.31m, and rim Y 0.31..0.34m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] no longer holds or if the emitted source fact changes.
 * @evidence models/temple-fit-out.md#ceramic-vessel-prototype The vessel factory preserves four addressable layers: foot Y 0.00..0.04m, body 0.04..0.26m, neck 0.26..0.31m, and rim 0.31..0.34m.
 * @evidenceReview models/temple-fit-out.md#ceramic-vessel-prototype #742b61c Independent source review for class CeramicVesselModelSource: checked target models/temple-fit-out.md#ceramic-vessel-prototype's authored predicate; observed target models/temple-fit-out.md#ceramic-vessel-prototype predicate [The vessel factory preserves four addressable layers: foot Y 0.00..0.04m, body 0.04..0.26m, neck 0.26..0.31m, and rim 0.31..0.34m.] is satisfied by emitted source fact [the factory emits foot Y 0.00..0.04m, body Y 0.04..0.26m, neck Y 0.26..0.31m, and rim Y 0.31..0.34m]. Falsifier: the target fails if [The vessel factory preserves four addressable layers: foot Y 0.00..0.04m, body 0.04..0.26m, neck 0.26..0.31m, and rim 0.31..0.34m.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-scope-preservation The source owns the ceramic vessel hierarchy only and leaves vessel quantity, room placement, and material response to later owners.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for class CeramicVesselModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [The source owns the ceramic vessel hierarchy only and leaves vessel quantity, room placement, and material response to later owners.] is satisfied by emitted source fact [model/ceramic-vessel with foot Y 0.00..0.04m, body Y 0.04..0.26m, neck Y 0.26..0.31m, and rim Y 0.31..0.34m]. Falsifier: the target fails if [The source owns the ceramic vessel hierarchy only and leaves vessel quantity, room placement, and material response to later owners.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The independent neck part closes the reviewed four-layer hierarchy instead of absorbing it into the rim.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for class CeramicVesselModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The independent neck part closes the reviewed four-layer hierarchy instead of absorbing it into the rim.] is satisfied by emitted source fact [model/ceramic-vessel with foot Y 0.00..0.04m, body Y 0.04..0.26m, neck Y 0.26..0.31m, and rim Y 0.31..0.34m]. Falsifier: the target fails if [The independent neck part closes the reviewed four-layer hierarchy instead of absorbing it into the rim.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed four intervals and open-rim profile are implemented directly, so no parent hierarchy decision was missing.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The reviewed four intervals and open-rim profile are implemented directly, so no parent hierarchy decision was missing.] is satisfied by emitted source fact [model/ceramic-vessel with foot Y 0.00..0.04m, body Y 0.04..0.26m, neck Y 0.26..0.31m, and rim Y 0.31..0.34m]. Falsifier: this exclusion fails if [The reviewed four intervals and open-rim profile are implemented directly, so no parent hierarchy decision was missing.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#design-owned-construction The four returned parts preserve the vessel's foot/body/neck/rim hierarchy, intervals, and surfaces.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 Independent source review for class CeramicVesselModelSource: checked target obligations/design/model-sources.md#design-owned-construction's authored predicate; observed target obligations/design/model-sources.md#design-owned-construction predicate [The four returned parts preserve the vessel's foot/body/neck/rim hierarchy, intervals, and surfaces.] is satisfied by emitted source fact [model/ceramic-vessel with foot Y 0.00..0.04m, body Y 0.04..0.26m, neck Y 0.26..0.31m, and rim Y 0.31..0.34m]. Falsifier: the target fails if [The four returned parts preserve the vessel's foot/body/neck/rim hierarchy, intervals, and surfaces.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed profiles and 20-segment revolutions regenerate the same vessel without mutable state.
 * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe Independent source review for class CeramicVesselModelSource: checked target obligations/design/model-sources.md#deterministic-build's authored predicate; observed target obligations/design/model-sources.md#deterministic-build predicate [Fixed profiles and 20-segment revolutions regenerate the same vessel without mutable state.] is satisfied by emitted source fact [model/ceramic-vessel with foot Y 0.00..0.04m, body Y 0.04..0.26m, neck Y 0.26..0.31m, and rim Y 0.31..0.34m]. Falsifier: the target fails if [Fixed profiles and 20-segment revolutions regenerate the same vessel without mutable state.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The source provides a bounded open-rim proxy and does not claim glaze microstructure or contents.
 * @evidenceReview obligations/design/model-sources.md#unsupported-fidelity-is-explicit #15c03fa Independent source review for class CeramicVesselModelSource: checked target obligations/design/model-sources.md#unsupported-fidelity-is-explicit's authored predicate; observed target obligations/design/model-sources.md#unsupported-fidelity-is-explicit predicate [The source provides a bounded open-rim proxy and does not claim glaze microstructure or contents.] is satisfied by emitted source fact [model/ceramic-vessel with foot Y 0.00..0.04m, body Y 0.04..0.26m, neck Y 0.26..0.31m, and rim Y 0.31..0.34m]. Falsifier: the target fails if [The source provides a bounded open-rim proxy and does not claim glaze microstructure or contents.] no longer holds or if the emitted source fact changes.
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
 * @evidence models/temple-fit-out.md LampModelSource contributes model/lamp with floor-contact base Y 0.00..0.08m, stem Y 0.08..0.30m, and shade Y 0.30..0.42m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.
 * @evidenceReview models/temple-fit-out.md #0f51831 Independent source review for class LampModelSource: checked target models/temple-fit-out.md's authored predicate; observed target models/temple-fit-out.md predicate [LampModelSource contributes model/lamp with floor-contact base Y 0.00..0.08m, stem Y 0.08..0.30m, and shade Y 0.30..0.42m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] is satisfied by emitted source fact [the factory emits floor-contact base Y 0.00..0.08m, stem Y 0.08..0.30m, and shade Y 0.30..0.42m]. Falsifier: the target fails if [LampModelSource contributes model/lamp with floor-contact base Y 0.00..0.08m, stem Y 0.08..0.30m, and shade Y 0.30..0.42m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] no longer holds or if the emitted source fact changes.
 * @evidence models/temple-fit-out.md#lamp-prototype The lamp factory uses one floor-contact origin with base Y 0.00..0.08m, stem 0.08..0.30m, and shade 0.30..0.42m.
 * @evidenceReview models/temple-fit-out.md#lamp-prototype #c243b52 Independent source review for class LampModelSource: checked target models/temple-fit-out.md#lamp-prototype's authored predicate; observed target models/temple-fit-out.md#lamp-prototype predicate [The lamp factory uses one floor-contact origin with base Y 0.00..0.08m, stem 0.08..0.30m, and shade 0.30..0.42m.] is satisfied by emitted source fact [the factory emits floor-contact base Y 0.00..0.08m, stem Y 0.08..0.30m, and shade Y 0.30..0.42m]. Falsifier: the target fails if [The lamp factory uses one floor-contact origin with base Y 0.00..0.08m, stem 0.08..0.30m, and shade 0.30..0.42m.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-scope-preservation The source realizes the rigid lamp prototype only and leaves mounting offsets, count, placement, and lighting behavior elsewhere.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for class LampModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [The source realizes the rigid lamp prototype only and leaves mounting offsets, count, placement, and lighting behavior elsewhere.] is satisfied by emitted source fact [model/lamp with floor-contact base Y 0.00..0.08m, stem Y 0.08..0.30m, and shade Y 0.30..0.42m]. Falsifier: the target fails if [The source realizes the rigid lamp prototype only and leaves mounting offsets, count, placement, and lighting behavior elsewhere.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The base, stem, and shade are complete named parts under one stable floor-contact convention.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for class LampModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The base, stem, and shade are complete named parts under one stable floor-contact convention.] is satisfied by emitted source fact [model/lamp with floor-contact base Y 0.00..0.08m, stem Y 0.08..0.30m, and shade Y 0.30..0.42m]. Falsifier: the target fails if [The base, stem, and shade are complete named parts under one stable floor-contact convention.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed origin and three vertical intervals are implemented directly without exposing a missing parent scale decision.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The reviewed origin and three vertical intervals are implemented directly without exposing a missing parent scale decision.] is satisfied by emitted source fact [model/lamp with floor-contact base Y 0.00..0.08m, stem Y 0.08..0.30m, and shade Y 0.30..0.42m]. Falsifier: this exclusion fails if [The reviewed origin and three vertical intervals are implemented directly without exposing a missing parent scale decision.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#design-owned-construction The three parts preserve the lamp's reviewed contact datum, silhouette layers, and surface IDs.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 Independent source review for class LampModelSource: checked target obligations/design/model-sources.md#design-owned-construction's authored predicate; observed target obligations/design/model-sources.md#design-owned-construction predicate [The three parts preserve the lamp's reviewed contact datum, silhouette layers, and surface IDs.] is satisfied by emitted source fact [model/lamp with floor-contact base Y 0.00..0.08m, stem Y 0.08..0.30m, and shade Y 0.30..0.42m]. Falsifier: the target fails if [The three parts preserve the lamp's reviewed contact datum, silhouette layers, and surface IDs.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#deterministic-build Fixed cylinders/profile and transforms regenerate the same lamp.
 * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe Independent source review for class LampModelSource: checked target obligations/design/model-sources.md#deterministic-build's authored predicate; observed target obligations/design/model-sources.md#deterministic-build predicate [Fixed cylinders/profile and transforms regenerate the same lamp.] is satisfied by emitted source fact [model/lamp with floor-contact base Y 0.00..0.08m, stem Y 0.08..0.30m, and shade Y 0.30..0.42m]. Falsifier: the target fails if [Fixed cylinders/profile and transforms regenerate the same lamp.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The source is a fixed blocking lamp proxy and does not claim flame simulation or emitted illumination.
 * @evidenceReview obligations/design/model-sources.md#unsupported-fidelity-is-explicit #15c03fa Independent source review for class LampModelSource: checked target obligations/design/model-sources.md#unsupported-fidelity-is-explicit's authored predicate; observed target obligations/design/model-sources.md#unsupported-fidelity-is-explicit predicate [The source is a fixed blocking lamp proxy and does not claim flame simulation or emitted illumination.] is satisfied by emitted source fact [model/lamp with floor-contact base Y 0.00..0.08m, stem Y 0.08..0.30m, and shade Y 0.30..0.42m]. Falsifier: the target fails if [The source is a fixed blocking lamp proxy and does not claim flame simulation or emitted illumination.] no longer holds or if the emitted source fact changes.
 */
export class LampModelSource extends TempleModelSource {
  public constructor() {
    super("docs/models/temple-fit-out.md#lamp-prototype", lampModel);
  }
}

/**
 * @evidence models/temple-fit-out.md BenchModelSource contributes model/bench with seat Y 0.30..0.42m, four legs at X +/-0.55m and Z +/-0.14m, and back rail Y 0.38..0.48m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.
 * @evidenceReview models/temple-fit-out.md #0f51831 Independent source review for class BenchModelSource: checked target models/temple-fit-out.md's authored predicate; observed target models/temple-fit-out.md predicate [BenchModelSource contributes model/bench with seat Y 0.30..0.42m, four legs at X +/-0.55m and Z +/-0.14m, and back rail Y 0.38..0.48m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] is satisfied by emitted source fact [the factory emits seat Y 0.30..0.42m, four legs at X +/-0.55m and Z +/-0.14m, and back rail Y 0.38..0.48m]. Falsifier: the target fails if [BenchModelSource contributes model/bench with seat Y 0.30..0.42m, four legs at X +/-0.55m and Z +/-0.14m, and back rail Y 0.38..0.48m as one member of the 17-entry source population; the aggregate registry, not this class alone, closes the complete file population.] no longer holds or if the emitted source fact changes.
 * @evidence models/temple-fit-out.md#bench-prototype The bench factory fixes a 1.40 × 0.48m seat at Y 0.30..0.42m, four 0.10m legs at X ±0.55m/Z ±0.14m, and a back rail at Y 0.38..0.48m.
 * @evidenceReview models/temple-fit-out.md#bench-prototype #2fb71c9 Independent source review for class BenchModelSource: checked target models/temple-fit-out.md#bench-prototype's authored predicate; observed target models/temple-fit-out.md#bench-prototype predicate [The bench factory fixes a 1.40 × 0.48m seat at Y 0.30..0.42m, four 0.10m legs at X ±0.55m/Z ±0.14m, and a back rail at Y 0.38..0.48m.] is satisfied by emitted source fact [the factory emits seat Y 0.30..0.42m, four legs at X +/-0.55m and Z +/-0.14m, and back rail Y 0.38..0.48m]. Falsifier: the target fails if [The bench factory fixes a 1.40 × 0.48m seat at Y 0.30..0.42m, four 0.10m legs at X ±0.55m/Z ±0.14m, and a back rail at Y 0.38..0.48m.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-scope-preservation The source owns the low bench silhouette and does not place it on the loop or reserve circulation.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for class BenchModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [The source owns the low bench silhouette and does not place it on the loop or reserve circulation.] is satisfied by emitted source fact [model/bench with seat Y 0.30..0.42m, four legs at X +/-0.55m and Z +/-0.14m, and back rail Y 0.38..0.48m]. Falsifier: the target fails if [The source owns the low bench silhouette and does not place it on the loop or reserve circulation.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion Seat, four supports, and back rail provide the complete review-critical bench geometry.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for class BenchModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [Seat, four supports, and back rail provide the complete review-critical bench geometry.] is satisfied by emitted source fact [model/bench with seat Y 0.30..0.42m, four legs at X +/-0.55m and Z +/-0.14m, and back rail Y 0.38..0.48m]. Falsifier: the target fails if [Seat, four supports, and back rail provide the complete review-critical bench geometry.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The reviewed support positions, underside negative space, and rail bounds are directly implemented without a parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The reviewed support positions, underside negative space, and rail bounds are directly implemented without a parent defect.] is satisfied by emitted source fact [model/bench with seat Y 0.30..0.42m, four legs at X +/-0.55m and Z +/-0.14m, and back rail Y 0.38..0.48m]. Falsifier: this exclusion fails if [The reviewed support positions, underside negative space, and rail bounds are directly implemented without a parent defect.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#design-owned-construction The seat, leg layout, underside gap, and rail preserve the reviewed support and wood surface ownership.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 Independent source review for class BenchModelSource: checked target obligations/design/model-sources.md#design-owned-construction's authored predicate; observed target obligations/design/model-sources.md#design-owned-construction predicate [The seat, leg layout, underside gap, and rail preserve the reviewed support and wood surface ownership.] is satisfied by emitted source fact [model/bench with seat Y 0.30..0.42m, four legs at X +/-0.55m and Z +/-0.14m, and back rail Y 0.38..0.48m]. Falsifier: the target fails if [The seat, leg layout, underside gap, and rail preserve the reviewed support and wood surface ownership.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#deterministic-build The fixed four-point list and transforms regenerate the same bench.
 * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe Independent source review for class BenchModelSource: checked target obligations/design/model-sources.md#deterministic-build's authored predicate; observed target obligations/design/model-sources.md#deterministic-build predicate [The fixed four-point list and transforms regenerate the same bench.] is satisfied by emitted source fact [model/bench with seat Y 0.30..0.42m, four legs at X +/-0.55m and Z +/-0.14m, and back rail Y 0.38..0.48m]. Falsifier: the target fails if [The fixed four-point list and transforms regenerate the same bench.] no longer holds or if the emitted source fact changes.
 * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The bench is a bounded civic blocking proxy and does not claim joinery, cushions, or user simulation.
 * @evidenceReview obligations/design/model-sources.md#unsupported-fidelity-is-explicit #15c03fa Independent source review for class BenchModelSource: checked target obligations/design/model-sources.md#unsupported-fidelity-is-explicit's authored predicate; observed target obligations/design/model-sources.md#unsupported-fidelity-is-explicit predicate [The bench is a bounded civic blocking proxy and does not claim joinery, cushions, or user simulation.] is satisfied by emitted source fact [model/bench with seat Y 0.30..0.42m, four legs at X +/-0.55m and Z +/-0.14m, and back rail Y 0.38..0.48m]. Falsifier: the target fails if [The bench is a bounded civic blocking proxy and does not claim joinery, cushions, or user simulation.] no longer holds or if the emitted source fact changes.
 */
export class BenchModelSource extends TempleModelSource {
  public constructor() {
    super("docs/models/temple-fit-out.md#bench-prototype", benchModel);
  }
}

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the scale-board class and its comparison-only boundary.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for exported instance modelScopeSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [This exported owner preserves the scale-board class and its comparison-only boundary.] is satisfied by emitted source fact [the scale-board factory emits only a 1.10 x 2.10m door-clear panel and a 3.60m room-height marker and adds no placement, count, or material ownership]. Falsifier: the target fails if [This exported owner preserves the scale-board class and its comparison-only boundary.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The value is an executable source instance, not an inert registry entry.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for exported instance modelScopeSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The value is an executable source instance, not an inert registry entry.] is satisfied by emitted source fact [the scale-board factory emits only a 1.10 x 2.10m door-clear panel and a 3.60m room-height marker and adds no placement, count, or material ownership]. Falsifier: the target fails if [The value is an executable source instance, not an inert registry entry.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class already implements the reviewed door-clear and room-height markers without a parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The bound class already implements the reviewed door-clear and room-height markers without a parent defect.] is satisfied by emitted source fact [model/scale-board with scale-board/door-clear and scale-board/room-height, a 1.10 x 2.10m door-clear panel and a 3.60m room-height marker]. Falsifier: this exclusion fails if [The bound class already implements the reviewed door-clear and room-height markers without a parent defect.] no longer holds or if the emitted source fact changes.
 */
export const modelScopeSource = new ModelScopeSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the column source class and its three-part stone boundary.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for exported instance columnModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [This exported owner preserves the column source class and its three-part stone boundary.] is satisfied by emitted source fact [the factory emits base radius 0.20m over Y 0.00..0.18m, shaft radii 0.16m to 0.152m over Y 0.18..2.92m, and capital radius 0.225m over Y 2.92..3.20m and adds no placement, count, or material ownership]. Falsifier: the target fails if [This exported owner preserves the column source class and its three-part stone boundary.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable column source instance consumed by the library.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for exported instance columnModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The value exposes the executable column source instance consumed by the library.] is satisfied by emitted source fact [the factory emits base radius 0.20m over Y 0.00..0.18m, shaft radii 0.16m to 0.152m over Y 0.18..2.92m, and capital radius 0.225m over Y 2.92..3.20m and adds no placement, count, or material ownership]. Falsifier: the target fails if [The value exposes the executable column source instance consumed by the library.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed base, tapered shaft, and capital intervals without exposing a parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The bound class implements the reviewed base, tapered shaft, and capital intervals without exposing a parent defect.] is satisfied by emitted source fact [model/column with column/base, column/shaft, and column/capital over Y 0.00..0.18m, 0.18..2.92m, and 2.92..3.20m]. Falsifier: this exclusion fails if [The bound class implements the reviewed base, tapered shaft, and capital intervals without exposing a parent defect.] no longer holds or if the emitted source fact changes.
 */
export const columnModelSource = new ColumnModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the door source class and its frame/leaf-only boundary.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for exported instance doorModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [This exported owner preserves the door source class and its frame/leaf-only boundary.] is satisfied by emitted source fact [the factory emits four door parts with 0.40m frame depth, 1.10 x 2.10m clear opening, and centered leaf Z -0.16..0.16m and adds no placement, count, or material ownership]. Falsifier: the target fails if [This exported owner preserves the door source class and its frame/leaf-only boundary.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable four-part door source instance.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for exported instance doorModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The value exposes the executable four-part door source instance.] is satisfied by emitted source fact [the factory emits four door parts with 0.40m frame depth, 1.10 x 2.10m clear opening, and centered leaf Z -0.16..0.16m and adds no placement, count, or material ownership]. Falsifier: the target fails if [The value exposes the executable four-part door source instance.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed 0.40m host and centered 0.32m leaf without a parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The bound class implements the reviewed 0.40m host and centered 0.32m leaf without a parent defect.] is satisfied by emitted source fact [model/door with four frame/leaf parts, 0.40m frame depth, and centered leaf Z -0.16..0.16m]. Falsifier: this exclusion fails if [The bound class implements the reviewed 0.40m host and centered 0.32m leaf without a parent defect.] no longer holds or if the emitted source fact changes.
 */
export const doorModelSource = new DoorModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the basin source class and its open circular landmark boundary.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for exported instance fountainBasinModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [This exported owner preserves the basin source class and its open circular landmark boundary.] is satisfied by emitted source fact [the factory emits the foot, open wall/rim profile Y 0.18..0.42m, and separate 1.24m water seat and adds no placement, count, or material ownership]. Falsifier: the target fails if [This exported owner preserves the basin source class and its open circular landmark boundary.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable basin source instance with its four named parts.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for exported instance fountainBasinModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The value exposes the executable basin source instance with its four named parts.] is satisfied by emitted source fact [the factory emits the foot, open wall/rim profile Y 0.18..0.42m, and separate 1.24m water seat and adds no placement, count, or material ownership]. Falsifier: the target fails if [The value exposes the executable basin source instance with its four named parts.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed foot, wall, rim, and water-seat extents without a parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The bound class implements the reviewed foot, wall, rim, and water-seat extents without a parent defect.] is satisfied by emitted source fact [model/fountain-basin with foot, open wall/rim profile Y 0.18..0.42m, and separate 1.24m water seat]. Falsifier: this exclusion fails if [The bound class implements the reviewed foot, wall, rim, and water-seat extents without a parent defect.] no longer holds or if the emitted source fact changes.
 */
export const fountainBasinModelSource = new FountainBasinModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the single-strand stream source and its static-accent boundary.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for exported instance fountainStreamModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [This exported owner preserves the single-strand stream source and its static-accent boundary.] is satisfied by emitted source fact [the factory emits one strand across Y 0.25..0.30m, 0.30..1.15m, and 1.15..1.20m and adds no placement, count, or material ownership]. Falsifier: the target fails if [This exported owner preserves the single-strand stream source and its static-accent boundary.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable three-interval stream source instance.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for exported instance fountainStreamModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The value exposes the executable three-interval stream source instance.] is satisfied by emitted source fact [the factory emits one strand across Y 0.25..0.30m, 0.30..1.15m, and 1.15..1.20m and adds no placement, count, or material ownership]. Falsifier: the target fails if [The value exposes the executable three-interval stream source instance.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed contiguous stream intervals without a parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The bound class implements the reviewed contiguous stream intervals without a parent defect.] is satisfied by emitted source fact [model/fountain-stream with stream/base-contact, stream/vertical-column, and stream/top-break at contiguous Y intervals 0.25..0.30m, 0.30..1.15m, and 1.15..1.20m]. Falsifier: this exclusion fails if [The bound class implements the reviewed contiguous stream intervals without a parent defect.] no longer holds or if the emitted source fact changes.
 */
export const fountainStreamModelSource = new FountainStreamModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the altar source class and its sanctuary-room consumption boundary.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for exported instance altarAndPlinthModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [This exported owner preserves the altar source class and its sanctuary-room consumption boundary.] is satisfied by emitted source fact [the factory emits a 1.30 x 0.32 x 0.80m plinth and centered 0.90 x 0.50 x 0.48m body at the sanctuary north observation point and adds no placement, count, or material ownership]. Falsifier: the target fails if [This exported owner preserves the altar source class and its sanctuary-room consumption boundary.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable plinth/body source instance.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for exported instance altarAndPlinthModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The value exposes the executable plinth/body source instance.] is satisfied by emitted source fact [the factory emits a 1.30 x 0.32 x 0.80m plinth and centered 0.90 x 0.50 x 0.48m body at the sanctuary north observation point and adds no placement, count, or material ownership]. Falsifier: the target fails if [The value exposes the executable plinth/body source instance.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed plinth/body dimensions without inventing a socket or exposing a parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The bound class implements the reviewed plinth/body dimensions without inventing a socket or exposing a parent defect.] is satisfied by emitted source fact [model/altar-plinth with a 1.30 x 0.32 x 0.80m plinth and 0.90 x 0.50 x 0.48m body at the sanctuary north observation point]. Falsifier: this exclusion fails if [The bound class implements the reviewed plinth/body dimensions without inventing a socket or exposing a parent defect.] no longer holds or if the emitted source fact changes.
 */
export const altarAndPlinthModelSource = new AltarAndPlinthModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves one roof-tile prototype and leaves row repetition to its later population owner.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for exported instance roofTileModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [This exported owner preserves one roof-tile prototype and leaves row repetition to its later population owner.] is satisfied by emitted source fact [the factory emits a 0.44m overlap lip and separate roof-tile-top, roof-tile-edge, and roof-tile-underside surfaces and adds no placement, count, or material ownership]. Falsifier: the target fails if [This exported owner preserves one roof-tile prototype and leaves row repetition to its later population owner.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable body/lip/underside source instance.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for exported instance roofTileModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The value exposes the executable body/lip/underside source instance.] is satisfied by emitted source fact [the factory emits a 0.44m overlap lip and separate roof-tile-top, roof-tile-edge, and roof-tile-underside surfaces and adds no placement, count, or material ownership]. Falsifier: the target fails if [The value exposes the executable body/lip/underside source instance.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed 0.44m occupied depth without exposing a parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The bound class implements the reviewed 0.44m occupied depth without exposing a parent defect.] is satisfied by emitted source fact [model/roof-tile with a 0.44m overlap lip and roof-tile-top, roof-tile-edge, and roof-tile-underside]. Falsifier: this exclusion fails if [The bound class implements the reviewed 0.44m occupied depth without exposing a parent defect.] no longer holds or if the emitted source fact changes.
 */
export const roofTileModelSource = new RoofTileModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the records table prototype and does not claim records-room placement.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for exported instance recordsTableModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [This exported owner preserves the records table prototype and does not claim records-room placement.] is satisfied by emitted source fact [the factory emits a 1.20 x 0.60m top at Y 0.71..0.81m and four 0.10m legs at X +/-0.50m and Z +/-0.20m and adds no placement, count, or material ownership]. Falsifier: the target fails if [This exported owner preserves the records table prototype and does not claim records-room placement.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable top and four-leg source instance.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for exported instance recordsTableModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The value exposes the executable top and four-leg source instance.] is satisfied by emitted source fact [the factory emits a 1.20 x 0.60m top at Y 0.71..0.81m and four 0.10m legs at X +/-0.50m and Z +/-0.20m and adds no placement, count, or material ownership]. Falsifier: the target fails if [The value exposes the executable top and four-leg source instance.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed table footprint and support positions without a parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The bound class implements the reviewed table footprint and support positions without a parent defect.] is satisfied by emitted source fact [model/records-table with a 1.20 x 0.60m top at Y 0.71..0.81m and four fixed legs at X +/-0.50m and Z +/-0.20m]. Falsifier: this exclusion fails if [The bound class implements the reviewed table footprint and support positions without a parent defect.] no longer holds or if the emitted source fact changes.
 */
export const recordsTableModelSource = new RecordsTableModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the records shelf prototype and its interval-defined board boundary.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for exported instance recordsShelfModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [This exported owner preserves the records shelf prototype and its interval-defined board boundary.] is satisfied by emitted source fact [the factory emits a 1.80m frame at X +/-0.40m and three boards at Y 0.36..0.44m, 0.86..0.94m, and 1.36..1.44m and adds no placement, count, or material ownership]. Falsifier: the target fails if [This exported owner preserves the records shelf prototype and its interval-defined board boundary.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable frame and three-board source instance.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for exported instance recordsShelfModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The value exposes the executable frame and three-board source instance.] is satisfied by emitted source fact [the factory emits a 1.80m frame at X +/-0.40m and three boards at Y 0.36..0.44m, 0.86..0.94m, and 1.36..1.44m and adds no placement, count, or material ownership]. Falsifier: the target fails if [The value exposes the executable frame and three-board source instance.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed board intervals and frame extent without a parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The bound class implements the reviewed board intervals and frame extent without a parent defect.] is satisfied by emitted source fact [model/records-shelf with frame X +/-0.40m and boards at Y 0.36..0.44m, 0.86..0.94m, and 1.36..1.44m]. Falsifier: this exclusion fails if [The bound class implements the reviewed board intervals and frame extent without a parent defect.] no longer holds or if the emitted source fact changes.
 */
export const recordsShelfModelSource = new RecordsShelfModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the closed records chest prototype and its body/lid boundary.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for exported instance recordsChestModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [This exported owner preserves the closed records chest prototype and its body/lid boundary.] is satisfied by emitted source fact [the factory emits a 0.80 x 0.45 x 0.45m body Y 0.00..0.45m and 0.10m lid Y 0.45..0.55m and adds no placement, count, or material ownership]. Falsifier: the target fails if [This exported owner preserves the closed records chest prototype and its body/lid boundary.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable body and lid source instance.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for exported instance recordsChestModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The value exposes the executable body and lid source instance.] is satisfied by emitted source fact [the factory emits a 0.80 x 0.45 x 0.45m body Y 0.00..0.45m and 0.10m lid Y 0.45..0.55m and adds no placement, count, or material ownership]. Falsifier: the target fails if [The value exposes the executable body and lid source instance.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed closed bounds and lid contact without a parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The bound class implements the reviewed closed bounds and lid contact without a parent defect.] is satisfied by emitted source fact [model/records-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m]. Falsifier: this exclusion fails if [The bound class implements the reviewed closed bounds and lid contact without a parent defect.] no longer holds or if the emitted source fact changes.
 */
export const recordsChestModelSource = new RecordsChestModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the storage shelf prototype and its four board intervals.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for exported instance storageShelfModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [This exported owner preserves the storage shelf prototype and its four board intervals.] is satisfied by emitted source fact [the factory emits a 1.70m frame and four boards at Y 0.35..0.43m, 0.70..0.78m, 1.05..1.13m, and 1.40..1.48m and adds no placement, count, or material ownership]. Falsifier: the target fails if [This exported owner preserves the storage shelf prototype and its four board intervals.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable frame and board source instance.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for exported instance storageShelfModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The value exposes the executable frame and board source instance.] is satisfied by emitted source fact [the factory emits a 1.70m frame and four boards at Y 0.35..0.43m, 0.70..0.78m, 1.05..1.13m, and 1.40..1.48m and adds no placement, count, or material ownership]. Falsifier: the target fails if [The value exposes the executable frame and board source instance.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed storage gaps and frame extent without a parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The bound class implements the reviewed storage gaps and frame extent without a parent defect.] is satisfied by emitted source fact [model/storage-shelf with frame X +/-0.40m and four boards at Y 0.35..0.43m, 0.70..0.78m, 1.05..1.13m, and 1.40..1.48m]. Falsifier: this exclusion fails if [The bound class implements the reviewed storage gaps and frame extent without a parent defect.] no longer holds or if the emitted source fact changes.
 */
export const storageShelfModelSource = new StorageShelfModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the closed storage chest prototype and does not claim lid motion or contents.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for exported instance storageChestModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [This exported owner preserves the closed storage chest prototype and does not claim lid motion or contents.] is satisfied by emitted source fact [the factory emits a 0.78 x 0.45 x 0.46m body Y 0.00..0.45m and 0.10m lid Y 0.45..0.55m and adds no placement, count, or material ownership]. Falsifier: the target fails if [This exported owner preserves the closed storage chest prototype and does not claim lid motion or contents.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable body and lid source instance.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for exported instance storageChestModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The value exposes the executable body and lid source instance.] is satisfied by emitted source fact [the factory emits a 0.78 x 0.45 x 0.46m body Y 0.00..0.45m and 0.10m lid Y 0.45..0.55m and adds no placement, count, or material ownership]. Falsifier: the target fails if [The value exposes the executable body and lid source instance.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed storage bounds and lid contact without a parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The bound class implements the reviewed storage bounds and lid contact without a parent defect.] is satisfied by emitted source fact [model/storage-chest with body Y 0.00..0.45m and lid Y 0.45..0.55m]. Falsifier: this exclusion fails if [The bound class implements the reviewed storage bounds and lid contact without a parent defect.] no longer holds or if the emitted source fact changes.
 */
export const storageChestModelSource = new StorageChestModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the open storage basket prototype and its cavity boundary.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for exported instance storageBasketModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [This exported owner preserves the open storage basket prototype and its cavity boundary.] is satisfied by emitted source fact [the factory emits an open tapered body radii 0.18..0.21m over Y 0.08..0.40m, rim Y 0.40..0.44m, and handle Y 0.40..0.48m and adds no placement, count, or material ownership]. Falsifier: the target fails if [This exported owner preserves the open storage basket prototype and its cavity boundary.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable base, tapered body, rim, and handle source instance.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for exported instance storageBasketModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The value exposes the executable base, tapered body, rim, and handle source instance.] is satisfied by emitted source fact [the factory emits an open tapered body radii 0.18..0.21m over Y 0.08..0.40m, rim Y 0.40..0.44m, and handle Y 0.40..0.48m and adds no placement, count, or material ownership]. Falsifier: the target fails if [The value exposes the executable base, tapered body, rim, and handle source instance.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed cavity, rim, and handle bounds without a parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The bound class implements the reviewed cavity, rim, and handle bounds without a parent defect.] is satisfied by emitted source fact [model/storage-basket with open tapered body radii 0.18..0.21m over Y 0.08..0.40m, rim Y 0.40..0.44m, and handle Y 0.40..0.48m]. Falsifier: this exclusion fails if [The bound class implements the reviewed cavity, rim, and handle bounds without a parent defect.] no longer holds or if the emitted source fact changes.
 */
export const storageBasketModelSource = new StorageBasketModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the votive display's actual open field and bounded board boundary.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for exported instance votiveDisplayModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [This exported owner preserves the votive display's actual open field and bounded board boundary.] is satisfied by emitted source fact [the factory emits the plinth, rear board, four borders, and ledge around empty recess X -0.42..0.42m, Y 0.80..1.22m, Z -0.09..-0.02m and adds no placement, count, or material ownership]. Falsifier: the target fails if [This exported owner preserves the votive display's actual open field and bounded board boundary.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable plinth, rear board, four borders, and ledge source instance.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for exported instance votiveDisplayModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The value exposes the executable plinth, rear board, four borders, and ledge source instance.] is satisfied by emitted source fact [the factory emits the plinth, rear board, four borders, and ledge around empty recess X -0.42..0.42m, Y 0.80..1.22m, Z -0.09..-0.02m and adds no placement, count, or material ownership]. Falsifier: the target fails if [The value exposes the executable plinth, rear board, four borders, and ledge source instance.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed negative field without exposing a parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The bound class implements the reviewed negative field without exposing a parent defect.] is satisfied by emitted source fact [model/votive-display with plinth, rear board, four borders, and ledge around empty recess X -0.42..0.42m, Y 0.80..1.22m, Z -0.09..-0.02m]. Falsifier: this exclusion fails if [The bound class implements the reviewed negative field without exposing a parent defect.] no longer holds or if the emitted source fact changes.
 */
export const votiveDisplayModelSource = new VotiveDisplayModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the ceramic vessel's four-layer hierarchy and open-rim boundary.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for exported instance ceramicVesselModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [This exported owner preserves the ceramic vessel's four-layer hierarchy and open-rim boundary.] is satisfied by emitted source fact [the factory emits foot Y 0.00..0.04m, body Y 0.04..0.26m, neck Y 0.26..0.31m, and rim Y 0.31..0.34m and adds no placement, count, or material ownership]. Falsifier: the target fails if [This exported owner preserves the ceramic vessel's four-layer hierarchy and open-rim boundary.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable foot, body, neck, and rim source instance.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for exported instance ceramicVesselModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The value exposes the executable foot, body, neck, and rim source instance.] is satisfied by emitted source fact [the factory emits foot Y 0.00..0.04m, body Y 0.04..0.26m, neck Y 0.26..0.31m, and rim Y 0.31..0.34m and adds no placement, count, or material ownership]. Falsifier: the target fails if [The value exposes the executable foot, body, neck, and rim source instance.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed independent neck interval without a parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The bound class implements the reviewed independent neck interval without a parent defect.] is satisfied by emitted source fact [model/ceramic-vessel with foot Y 0.00..0.04m, body Y 0.04..0.26m, neck Y 0.26..0.31m, and rim Y 0.31..0.34m]. Falsifier: this exclusion fails if [The bound class implements the reviewed independent neck interval without a parent defect.] no longer holds or if the emitted source fact changes.
 */
export const ceramicVesselModelSource = new CeramicVesselModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the floor-contact lamp source and leaves mounting offset to its consumer.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for exported instance lampModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [This exported owner preserves the floor-contact lamp source and leaves mounting offset to its consumer.] is satisfied by emitted source fact [the factory emits floor-contact base Y 0.00..0.08m, stem Y 0.08..0.30m, and shade Y 0.30..0.42m and adds no placement, count, or material ownership]. Falsifier: the target fails if [This exported owner preserves the floor-contact lamp source and leaves mounting offset to its consumer.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable base, stem, and shade source instance.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for exported instance lampModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The value exposes the executable base, stem, and shade source instance.] is satisfied by emitted source fact [the factory emits floor-contact base Y 0.00..0.08m, stem Y 0.08..0.30m, and shade Y 0.30..0.42m and adds no placement, count, or material ownership]. Falsifier: the target fails if [The value exposes the executable base, stem, and shade source instance.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed origin and vertical intervals without a parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The bound class implements the reviewed origin and vertical intervals without a parent defect.] is satisfied by emitted source fact [model/lamp with floor-contact base Y 0.00..0.08m, stem Y 0.08..0.30m, and shade Y 0.30..0.42m]. Falsifier: this exclusion fails if [The bound class implements the reviewed origin and vertical intervals without a parent defect.] no longer holds or if the emitted source fact changes.
 */
export const lampModelSource = new LampModelSource();

/**
 * @evidence principles/core/source-units.md#source-scope-preservation This exported owner preserves the low bench prototype and its support/rail boundary.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent source review for exported instance benchModelSource: checked target principles/core/source-units.md#source-scope-preservation's authored predicate; observed target principles/core/source-units.md#source-scope-preservation predicate [This exported owner preserves the low bench prototype and its support/rail boundary.] is satisfied by emitted source fact [the factory emits seat Y 0.30..0.42m, four legs at X +/-0.55m and Z +/-0.14m, and back rail Y 0.38..0.48m and adds no placement, count, or material ownership]. Falsifier: the target fails if [This exported owner preserves the low bench prototype and its support/rail boundary.] no longer holds or if the emitted source fact changes.
 * @evidence principles/core/source-units.md#source-substantive-completion The value exposes the executable seat, four-leg, and rail source instance.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent source review for exported instance benchModelSource: checked target principles/core/source-units.md#source-substantive-completion's authored predicate; observed target principles/core/source-units.md#source-substantive-completion predicate [The value exposes the executable seat, four-leg, and rail source instance.] is satisfied by emitted source fact [the factory emits seat Y 0.30..0.42m, four legs at X +/-0.55m and Z +/-0.14m, and back rail Y 0.38..0.48m and adds no placement, count, or material ownership]. Falsifier: the target fails if [The value exposes the executable seat, four-leg, and rail source instance.] no longer holds or if the emitted source fact changes.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bound class implements the reviewed supports, underside gap, and rail bounds without a parent defect.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Independent source exclusion review for source owner: checked target upstream/design/model-sources.md#design-revision-from-model-source-work's parent-revision predicate; observed target upstream/design/model-sources.md#design-revision-from-model-source-work exclusion predicate [The bound class implements the reviewed supports, underside gap, and rail bounds without a parent defect.] is satisfied by emitted source fact [model/bench with seat Y 0.30..0.42m, four legs at X +/-0.55m and Z +/-0.14m, and back rail Y 0.38..0.48m]. Falsifier: this exclusion fails if [The bound class implements the reviewed supports, underside gap, and rail bounds without a parent defect.] no longer holds or if the emitted source fact changes.
 */
export const benchModelSource = new BenchModelSource();

const MODEL_SOURCE_OWNERS: readonly TempleModelSource[] = [
  modelScopeSource,
  columnModelSource,
  doorModelSource,
  fountainBasinModelSource,
  fountainStreamModelSource,
  altarAndPlinthModelSource,
  roofTileModelSource,
  recordsTableModelSource,
  recordsShelfModelSource,
  recordsChestModelSource,
  storageShelfModelSource,
  storageChestModelSource,
  storageBasketModelSource,
  votiveDisplayModelSource,
  ceramicVesselModelSource,
  lampModelSource,
  benchModelSource,
];

const registeredSourceDesigns = new Set(
  MODEL_SOURCE_OWNERS.map((source) => source.design),
);
if (
  MODEL_SOURCE_OWNERS.length !== MODEL_SOURCE_DEFINITIONS.length ||
  registeredSourceDesigns.size !== MODEL_SOURCE_DEFINITIONS.length ||
  MODEL_SOURCE_DEFINITIONS.some(
    (definition) => !registeredSourceDesigns.has(definition.design),
  )
)
  throw new Error(
    "The exported model-source owners do not close the declared prototype population.",
  );
