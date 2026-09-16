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
      0.36,
      vector(-0.64, 1.05, 0),
      "door-frame-left-stone",
    ),
    boxPart(
      "door/frame-right",
      0.18,
      2.1,
      0.36,
      vector(0.64, 1.05, 0),
      "door-frame-right-stone",
    ),
    boxPart(
      "door/frame-lintel",
      1.46,
      0.22,
      0.36,
      vector(0, 2.21, 0),
      "door-frame-lintel-stone",
    ),
    boxPart(
      "door/leaf",
      1.1,
      2.1,
      0.16,
      vector(0, 1.05, 0.08),
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
      "roof-tile-top-terracotta",
    ),
    boxPart(
      "roof-tile/overlap-lip",
      0.08,
      0.02,
      0.48,
      vector(0.68, 0.09, 0.22),
      "roof-tile-edge-terracotta",
    ),
    planePart(
      "roof-tile/underside",
      0.72,
      0.44,
      vector(0.36, 0.005, 0.22),
      "roof-tile-underside-terracotta",
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
      "records-table-top-wood",
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
        "records-table-legs-wood",
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
      "records-chest-body-wood",
    ),
    boxPart(
      "records-chest/lid",
      0.8,
      0.1,
      0.45,
      vector(0, 0.5, 0),
      "records-chest-lid-wood",
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
      "storage-chest-body-wood",
    ),
    boxPart(
      "storage-chest/lid",
      0.78,
      0.1,
      0.46,
      vector(0, 0.5, 0),
      "storage-chest-lid-wood",
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
      "votive-display/board",
      1.1,
      1.2,
      0.16,
      vector(0, 0.8, 0),
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
    boxPart(
      "votive-display/recess",
      0.84,
      0.42,
      0.07,
      vector(0, 1.01, -0.055),
      "display-board-stone",
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
      "ceramic-vessel/rim",
      [
        { x: 0.1, y: 0.26 },
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
      "lamp-base-metal",
    ),
    cylinderPart(
      "lamp/stem",
      0.03,
      0.22,
      vector(0, 0.19, 0),
      "lamp-stem-metal",
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
      "lamp-shade-metal",
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
      "bench-seat-wood",
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
        "bench-legs-wood",
      ),
    ),
    boxPart(
      "bench/back-rail",
      1.2,
      0.1,
      0.1,
      vector(0, 0.43, 0.19),
      "bench-back-rail-wood",
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

export class ModelScopeSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#model-scope-scale-and-fidelity",
      scaleBoardModel,
    );
  }
}

export class ColumnModelSource extends TempleModelSource {
  public constructor() {
    super("docs/models/temple-fit-out.md#column-prototype", columnModel);
  }
}

export class DoorModelSource extends TempleModelSource {
  public constructor() {
    super("docs/models/temple-fit-out.md#door-prototype", doorModel);
  }
}

export class FountainBasinModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#fountain-basin-prototype",
      basinModel,
    );
  }
}

export class FountainStreamModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#fountain-stream-prototype",
      streamModel,
    );
  }
}

export class AltarAndPlinthModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#altar-and-plinth-prototype",
      altarModel,
    );
  }
}

export class RoofTileModelSource extends TempleModelSource {
  public constructor() {
    super("docs/models/temple-fit-out.md#roof-tile-prototype", roofTileModel);
  }
}

export class RecordsTableModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#records-table-prototype",
      recordsTableModel,
    );
  }
}

export class RecordsShelfModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#records-shelf-prototype",
      recordsShelfModel,
    );
  }
}

export class RecordsChestModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#records-chest-prototype",
      recordsChestModel,
    );
  }
}

export class StorageShelfModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#storage-shelf-prototype",
      storageShelfModel,
    );
  }
}

export class StorageChestModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#storage-chest-prototype",
      storageChestModel,
    );
  }
}

export class StorageBasketModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#storage-basket-prototype",
      storageBasketModel,
    );
  }
}

export class VotiveDisplayModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#votive-display-prototype",
      votiveDisplayModel,
    );
  }
}

export class CeramicVesselModelSource extends TempleModelSource {
  public constructor() {
    super(
      "docs/models/temple-fit-out.md#ceramic-vessel-prototype",
      ceramicVesselModel,
    );
  }
}

export class LampModelSource extends TempleModelSource {
  public constructor() {
    super("docs/models/temple-fit-out.md#lamp-prototype", lampModel);
  }
}

export class BenchModelSource extends TempleModelSource {
  public constructor() {
    super("docs/models/temple-fit-out.md#bench-prototype", benchModel);
  }
}

export const modelScopeSource = new ModelScopeSource();
export const columnModelSource = new ColumnModelSource();
export const doorModelSource = new DoorModelSource();
export const fountainBasinModelSource = new FountainBasinModelSource();
export const fountainStreamModelSource = new FountainStreamModelSource();
export const altarAndPlinthModelSource = new AltarAndPlinthModelSource();
export const roofTileModelSource = new RoofTileModelSource();
export const recordsTableModelSource = new RecordsTableModelSource();
export const recordsShelfModelSource = new RecordsShelfModelSource();
export const recordsChestModelSource = new RecordsChestModelSource();
export const storageShelfModelSource = new StorageShelfModelSource();
export const storageChestModelSource = new StorageChestModelSource();
export const storageBasketModelSource = new StorageBasketModelSource();
export const votiveDisplayModelSource = new VotiveDisplayModelSource();
export const ceramicVesselModelSource = new CeramicVesselModelSource();
export const lampModelSource = new LampModelSource();
export const benchModelSource = new BenchModelSource();
