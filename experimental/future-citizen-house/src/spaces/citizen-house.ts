import type {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieBuiltPopulation,
  IAutoMovieBuiltSpace,
  IAutoMovieBuiltSurface,
  IAutoMovieColor,
  IAutoMovieInstanceSetDesign,
  IAutoMovieLibrarySourceOwner,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

const vector = (x: number, y: number, z: number): IAutoMovieVector3 => ({
  x,
  y,
  z,
});

type RoomBounds = Readonly<{
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}>;

const HOUSE_PLAN = { minX: -5.5, maxX: 5.5, minZ: -6, maxZ: 6 } as const;
const SITE_PLAN = { minX: -7.8, maxX: 7.8, minZ: -8.5, maxZ: 8.5 } as const;

const ROOM_BOUNDS = {
  entry: { minX: -1.55, minY: 0, minZ: -5.76, maxX: 1.55, maxY: 2.8, maxZ: -2.9 },
  flexWorkroom: { minX: -5.26, minY: 0, minZ: -5.76, maxX: -1.8, maxY: 2.8, maxZ: -2.9 },
  commonRoom: { minX: -5.26, minY: 0, minZ: -2.66, maxX: 3.26, maxY: 2.8, maxZ: 5.76 },
  powderUtility: { minX: 3.26, minY: 0, minZ: -5.76, maxX: 5.26, maxY: 2.8, maxZ: -2.66 },
  storage1f: { minX: 3.26, minY: 0, minZ: -2.66, maxX: 5.26, maxY: 2.8, maxZ: 0.1 },
  upperCorridor: { minX: 0.2, minY: 3, minZ: -4.3, maxX: 1.9, maxY: 5.8, maxZ: 2.6 },
  primaryBedroom: { minX: -5.26, minY: 3, minZ: 2.66, maxX: 0, maxY: 5.8, maxZ: 5.76 },
  childBedroom2: { minX: -5.26, minY: 3, minZ: -0.02, maxX: 0, maxY: 5.8, maxZ: 2.6 },
  childBedroom1: { minX: -5.26, minY: 3, minZ: -5.76, maxX: 0, maxY: 5.8, maxZ: -0.04 },
  upperBathroom: { minX: 1.9, minY: 3, minZ: 1.6, maxX: 5.26, maxY: 5.8, maxZ: 4.4 },
  upperStorage: { minX: 1.9, minY: 3, minZ: 0, maxX: 5.26, maxY: 5.8, maxZ: 1.5 },
  upperService: { minX: 1.9, minY: 3, minZ: -5.76, maxX: 5.26, maxY: 5.8, maxZ: -0.04 },
} satisfies Record<string, RoomBounds>;

const transform = (
  translation: IAutoMovieVector3,
  scale: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion = IDENTITY,
): IAutoMovieTransform => ({
  translation,
  rotation,
  scale,
});

const color = (r: number, g: number, b: number): IAutoMovieColor => ({
  r,
  g,
  b,
  a: 1,
  hex: null,
});

const material = (props: {
  id: string;
  name: string;
  baseColor: IAutoMovieColor;
  metallic?: number;
  roughness?: number;
  opacity?: number;
  transmission?: number;
  ior?: number;
  thickness?: number;
}): IAutoMovieMaterial => ({
  id: props.id,
  name: props.name,
  baseColor: props.baseColor,
  metallic: props.metallic ?? 0,
  roughness: props.roughness ?? 0.65,
  emissive: null,
  opacity: props.opacity ?? 1,
  alphaMode: "opaque",
  doubleSided: true,
  baseColorTexture: null,
  transmission: props.transmission,
  ior: props.ior,
  thickness: props.thickness,
});

const MATERIALS = [
  material({
    id: "house-concrete",
    name: "pale structural concrete",
    baseColor: color(0.58, 0.6, 0.58),
    roughness: 0.85,
  }),
  material({
    id: "house-opaque",
    name: "warm opaque service wall",
    baseColor: color(0.72, 0.69, 0.62),
    roughness: 0.82,
  }),
  material({
    id: "house-dark-metal",
    name: "charcoal curtainwall frame",
    baseColor: color(0.035, 0.045, 0.055),
    metallic: 0.8,
    roughness: 0.3,
  }),
  material({
    id: "house-glass",
    name: "electrochromic curtainwall glass",
    baseColor: color(0.2, 0.36, 0.42),
    roughness: 0.18,
    transmission: 0.72,
    ior: 1.5,
    thickness: 0.012,
  }),
  material({
    id: "house-translucent",
    name: "translucent privacy glass",
    baseColor: color(0.66, 0.74, 0.72),
    roughness: 0.34,
    transmission: 0.42,
    ior: 1.5,
    thickness: 0.012,
  }),
  material({
    id: "house-wood",
    name: "warm interior wood",
    baseColor: color(0.42, 0.21, 0.1),
    roughness: 0.62,
  }),
  material({
    id: "house-wood-light",
    name: "light oak fit-out",
    baseColor: color(0.66, 0.43, 0.22),
    roughness: 0.58,
  }),
  material({
    id: "house-soft",
    name: "quiet fabric upholstery",
    baseColor: color(0.38, 0.41, 0.39),
    roughness: 0.92,
  }),
  material({
    id: "house-metal",
    name: "brushed interior metal",
    baseColor: color(0.24, 0.27, 0.28),
    metallic: 0.72,
    roughness: 0.34,
  }),
  material({
    id: "house-pv",
    name: "blue-black photovoltaic panel",
    baseColor: color(0.025, 0.07, 0.14),
    metallic: 0.35,
    roughness: 0.22,
  }),
  material({
    id: "house-green",
    name: "low planting block",
    baseColor: color(0.15, 0.28, 0.12),
    roughness: 1,
  }),
] as const;

const modelFor = (id: string, surface: IAutoMovieMaterial): IAutoMovieModel => ({
  id,
  name: surface.name,
  origin: "generated",
  skeleton: null,
  materials: [surface],
  parts: [
    {
      id: `${id}-box`,
      name: "unit box",
      geometry: {
        type: "primitive",
        shape: { type: "box", width: 1, height: 1, depth: 1 },
      },
      material: surface.id,
      attachedBone: null,
      transform: null,
    },
  ],
  asset: null,
  body: null,
});

const MODELS = [
  modelFor("model-concrete", MATERIALS[0]),
  modelFor("model-opaque", MATERIALS[1]),
  modelFor("model-dark-metal", MATERIALS[2]),
  modelFor("model-glass", MATERIALS[3]),
  modelFor("model-translucent", MATERIALS[4]),
  modelFor("model-wood", MATERIALS[5]),
  modelFor("model-wood-light", MATERIALS[6]),
  modelFor("model-soft", MATERIALS[7]),
  modelFor("model-metal", MATERIALS[8]),
  modelFor("model-pv", MATERIALS[9]),
  modelFor("model-green", MATERIALS[10]),
  modelFor("model-curtainwall-module", MATERIALS[3]),
  modelFor("model-shade-module", MATERIALS[2]),
  modelFor("model-pv-module", MATERIALS[9]),
];

const box = (props: {
  id: string;
  kind: string;
  space: string | null;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  model: string;
}): IAutoMovieBuiltElement => ({
  id: props.id,
  kind: props.kind,
  parent: "house-root",
  transform: transform(
    vector(props.x, props.y, props.z),
    vector(props.width, props.height, props.depth),
  ),
  model: props.model,
  space: props.space,
});

const boxCell = (
  id: string,
  min: IAutoMovieVector3,
  max: IAutoMovieVector3,
) => ({
  id,
  planes: [
    { normal: vector(1, 0, 0), offset: max.x },
    { normal: vector(-1, 0, 0), offset: -min.x },
    { normal: vector(0, 1, 0), offset: max.y },
    { normal: vector(0, -1, 0), offset: -min.y },
    { normal: vector(0, 0, 1), offset: max.z },
    { normal: vector(0, 0, -1), offset: -min.z },
  ],
});

const room = (
  id: string,
  parent: string,
  bounds: RoomBounds,
): IAutoMovieBuiltSpace => ({
  id,
  kind: "room",
  parent,
  cells: [boxCell(
    `${id}-cell`,
    vector(bounds.minX, bounds.minY, bounds.minZ),
    vector(bounds.maxX, bounds.maxY, bounds.maxZ),
  )],
});

const surface = (
  space: string,
  id: string,
  min: { x: number; z: number },
  max: { x: number; z: number },
  y: number,
): IAutoMovieBuiltSurface => ({
  space,
  surface: {
    id,
    kind: "floor",
    polygon: [
      vector(min.x, 0, min.z),
      vector(max.x, 0, min.z),
      vector(max.x, 0, max.z),
      vector(min.x, 0, max.z),
    ],
    height: { kind: "constant", value: y },
  },
});

const roomSurface = (
  space: string,
  id: string,
  bounds: RoomBounds,
): IAutoMovieBuiltSurface =>
  surface(
    space,
    id,
    { x: bounds.minX, z: bounds.minZ },
    { x: bounds.maxX, z: bounds.maxZ },
    bounds.minY,
  );

const passage = (
  id: string,
  from: string,
  to: string,
  route: IAutoMovieVector3[],
  width = 0.9,
): IAutoMovieBuiltConnector => ({
  id,
  kind: "passage",
  from,
  to,
  bidirectional: true,
  route,
  width,
  clearHeight: 2.2,
  elements: [],
});

const opening = (
  id: string,
  boundary: string,
  fill: string | null,
  kind = "door",
): IAutoMovieBuiltOpening => ({ id, kind, boundary, fill });

const population = (props: {
  id: string;
  space: string;
  modelRecipe: string;
  palette: string;
  transforms: Array<IAutoMovieTransform & { id: string }>;
}): IAutoMovieBuiltPopulation => {
  const set: IAutoMovieInstanceSetDesign = {
    id: props.id,
    modelRecipe: props.modelRecipe,
    count: props.transforms.length,
    layout: { kind: "explicit", transforms: props.transforms },
    anchor: vector(0, 0, 0),
    facingDeg: 0,
    seed: 2080,
    variation: {
      scale: { min: 1, max: 1 },
      palette: [props.palette],
      traits: [],
    },
  };
  return {
    space: props.space,
    prototypeBounds: {
      min: vector(-0.5, -0.5, -0.5),
      max: vector(0.5, 0.5, 0.5),
    },
    set,
  };
};

const linearTransforms = (props: {
  prefix?: string;
  count: number;
  start: number;
  step: number;
  axis: "x" | "z";
  y: number;
  fixed: number;
  scale: IAutoMovieVector3;
}): Array<IAutoMovieTransform & { id: string }> =>
  Array.from({ length: props.count }, (_, index) => {
    const value = props.start + props.step * index;
    return {
      id: `${props.prefix ?? "module"}-${String(index + 1).padStart(2, "0")}`,
      ...transform(
        props.axis === "x"
          ? vector(value, props.y, props.fixed)
          : vector(props.fixed, props.y, value),
        props.scale,
      ),
    };
  });

const roomCurtainwallTransforms = (
  bounds: RoomBounds,
  count: number,
  fixedZ: number,
): Array<IAutoMovieTransform & { id: string }> => {
  const width = (bounds.maxX - bounds.minX) / count;
  return Array.from({ length: count }, (_, index) => ({
    id: `bay-${String(index + 1).padStart(2, "0")}`,
    ...transform(
      vector(
        bounds.minX + width * (index + 0.5),
        (bounds.minY + bounds.maxY) / 2,
        fixedZ,
      ),
      vector(width, bounds.maxY - bounds.minY, 0.08),
    ),
  }));
};

const groundElements = (): IAutoMovieBuiltElement[] => [
  box({ id: "foundation-slab", kind: "foundation", space: "house", x: 0, y: -0.12, z: 0, width: 10.9, height: 0.24, depth: 11.9, model: "model-concrete" }),
  box({ id: "ground-floor-slab", kind: "floor-slab", space: "ground-storey", x: 0, y: -0.02, z: 0, width: 10.7, height: 0.16, depth: 11.7, model: "model-wood-light" }),
  box({ id: "upper-floor-slab", kind: "floor-slab", space: "upper-storey", x: 0, y: 2.9, z: 0, width: 10.7, height: 0.2, depth: 11.7, model: "model-concrete" }),
  box({ id: "roof-slab", kind: "roof", space: "roof-deck", x: 0, y: 6.1, z: 0, width: 10.9, height: 0.2, depth: 11.9, model: "model-concrete" }),
  box({ id: "left-wall-ground", kind: "opaque-wall", space: "ground-storey", x: -5.38, y: 1.45, z: 0, width: 0.24, height: 2.9, depth: 11.76, model: "model-opaque" }),
  box({ id: "right-wall-ground", kind: "service-wall", space: "ground-storey", x: 5.38, y: 1.45, z: 0, width: 0.24, height: 2.9, depth: 11.76, model: "model-opaque" }),
  box({ id: "left-wall-upper", kind: "opaque-wall", space: "upper-storey", x: -5.38, y: 4.45, z: 0, width: 0.24, height: 2.9, depth: 11.76, model: "model-opaque" }),
  box({ id: "right-wall-upper", kind: "service-wall", space: "upper-storey", x: 5.38, y: 4.45, z: 0, width: 0.24, height: 2.9, depth: 11.76, model: "model-opaque" }),
  box({ id: "ground-service-partition-front", kind: "service-partition", space: "powder-utility", x: 3.16, y: 1.45, z: -4.35, width: 0.16, height: 2.9, depth: 2.7, model: "model-opaque" }),
  box({ id: "ground-service-partition-back", kind: "service-partition", space: "storage-1f", x: 3.16, y: 1.45, z: -1.3, width: 0.16, height: 2.9, depth: 1.9, model: "model-opaque" }),
  box({ id: "upper-corridor-left-wall-front", kind: "partition", space: "upper-corridor", x: 0.08, y: 4.45, z: -3.5, width: 0.16, height: 2.9, depth: 1.55, model: "model-opaque" }),
  box({ id: "upper-corridor-left-wall-mid", kind: "partition", space: "upper-corridor", x: 0.08, y: 4.45, z: -1.0, width: 0.16, height: 2.9, depth: 1.15, model: "model-opaque" }),
  box({ id: "upper-corridor-left-wall-back", kind: "partition", space: "upper-corridor", x: 0.08, y: 4.45, z: 1.75, width: 0.16, height: 2.9, depth: 1.45, model: "model-opaque" }),
  box({ id: "upper-core-wall-front", kind: "service-partition", space: "upper-service", x: 2.0, y: 4.45, z: -4.35, width: 0.16, height: 2.9, depth: 2.7, model: "model-opaque" }),
  box({ id: "upper-core-wall-back", kind: "service-partition", space: "upper-bathroom", x: 2.0, y: 4.45, z: 3.85, width: 0.16, height: 2.9, depth: 1.3, model: "model-opaque" }),
  box({ id: "entry-door", kind: "exterior-door", space: "entry", x: 0, y: 1.1, z: -5.93, width: 1.05, height: 2.2, depth: 0.08, model: "model-glass" }),
  box({ id: "flex-door", kind: "interior-door", space: "flex-workroom", x: -1.68, y: 1.1, z: -4.3, width: 0.08, height: 2.2, depth: 0.9, model: "model-wood" }),
  box({ id: "bedroom-one-door", kind: "interior-door", space: "child-bedroom-1", x: 0.14, y: 4.1, z: -3.45, width: 0.08, height: 2.1, depth: 0.9, model: "model-wood" }),
  box({ id: "bedroom-two-door", kind: "interior-door", space: "child-bedroom-2", x: 0.14, y: 4.1, z: 1.25, width: 0.08, height: 2.1, depth: 0.9, model: "model-wood" }),
  box({ id: "primary-door", kind: "interior-door", space: "primary-bedroom", x: 0.14, y: 4.1, z: 3.0, width: 0.08, height: 2.1, depth: 0.9, model: "model-wood" }),
  box({ id: "bathroom-door", kind: "interior-door", space: "upper-bathroom", x: 2.1, y: 4.1, z: 2.05, width: 0.9, height: 2.1, depth: 0.08, model: "model-wood" }),
  box({ id: "storage-door", kind: "interior-door", space: "upper-storage", x: 2.1, y: 4.1, z: 0.72, width: 0.9, height: 2.1, depth: 0.08, model: "model-wood" }),
  box({ id: "stair-landing", kind: "stair-landing", space: "entry", x: 0.6, y: 1.5, z: -1.65, width: 1.3, height: 0.18, depth: 1.05, model: "model-wood" }),
  ...Array.from({ length: 9 }, (_, index) =>
    box({ id: `stair-lower-${String(index + 1).padStart(2, "0")}`, kind: "stair-tread", space: "entry", x: -0.55, y: ((index + 1) * (1.5 / 9)) / 2, z: -4 + index * 0.25, width: 1.3, height: (index + 1) * (1.5 / 9), depth: 0.28, model: "model-wood" }),
  ),
  ...Array.from({ length: 9 }, (_, index) =>
    box({ id: `stair-upper-${String(index + 1).padStart(2, "0")}`, kind: "stair-tread", space: "upper-corridor", x: 1.55, y: 1.5 + ((index + 1) * (1.5 / 9)) / 2, z: -1.9 - index * 0.25, width: 1.3, height: (index + 1) * (1.5 / 9), depth: 0.28, model: "model-wood" }),
  ),
];

const fitOutElements = (): IAutoMovieBuiltElement[] => [
  box({ id: "entry-bench", kind: "bench", space: "entry", x: -0.55, y: 0.38, z: -4.95, width: 1.3, height: 0.48, depth: 0.45, model: "model-wood-light" }),
  box({ id: "entry-shoe-storage", kind: "storage", space: "entry", x: 1.15, y: 1.05, z: -4.55, width: 0.45, height: 2.1, depth: 1.2, model: "model-wood" }),
  box({ id: "entry-charge-niche", kind: "utility", space: "entry", x: -1.15, y: 1.35, z: -3.15, width: 0.5, height: 1.3, depth: 0.28, model: "model-metal" }),
  box({ id: "flex-desk", kind: "adjustable-desk", space: "flex-workroom", x: -3.85, y: 0.78, z: -4.45, width: 2.1, height: 0.12, depth: 0.72, model: "model-wood-light" }),
  box({ id: "flex-chair", kind: "chair", space: "flex-workroom", x: -3.85, y: 0.52, z: -3.72, width: 0.62, height: 0.9, depth: 0.62, model: "model-soft" }),
  box({ id: "flex-shelving", kind: "shelving", space: "flex-workroom", x: -4.85, y: 1.35, z: -5.35, width: 0.28, height: 2.2, depth: 1.55, model: "model-wood" }),
  box({ id: "flex-folding-surface", kind: "variable-work-surface", space: "flex-workroom", x: -2.35, y: 1.15, z: -5.35, width: 1.25, height: 0.08, depth: 0.42, model: "model-wood-light" }),
  box({ id: "flex-privacy-screen", kind: "translucent-screen", space: "flex-workroom", x: -1.95, y: 1.35, z: -3.2, width: 0.08, height: 2.2, depth: 1.55, model: "model-translucent" }),
  box({ id: "living-sofa", kind: "sofa", space: "common-room", x: -3.25, y: 0.48, z: 2.9, width: 2.8, height: 0.75, depth: 0.88, model: "model-soft" }),
  box({ id: "living-coffee-table", kind: "table", space: "common-room", x: -3.0, y: 0.38, z: 1.8, width: 1.35, height: 0.32, depth: 0.72, model: "model-wood-light" }),
  box({ id: "living-media-wall", kind: "media-storage", space: "common-room", x: -4.9, y: 1.25, z: 4.85, width: 0.3, height: 2.25, depth: 2.2, model: "model-wood" }),
  box({ id: "dining-table", kind: "dining-table", space: "common-room", x: -0.55, y: 0.78, z: 0.25, width: 2.0, height: 0.12, depth: 1.0, model: "model-wood-light" }),
  ...[
    [-1.6, 0.25],
    [0.5, 0.25],
    [-1.6, -0.75],
    [0.5, -0.75],
    [-0.55, 1.0],
    [-0.55, -0.5],
  ].map(([x, z], index) => box({ id: `dining-chair-${index + 1}`, kind: "dining-chair", space: "common-room", x, y: 0.48, z, width: 0.46, height: 0.9, depth: 0.46, model: "model-wood-light" })),
  box({ id: "kitchen-island", kind: "kitchen-island", space: "common-room", x: 1.5, y: 0.52, z: 2.4, width: 2.35, height: 0.9, depth: 0.82, model: "model-wood-light" }),
  box({ id: "kitchen-sink", kind: "sink", space: "common-room", x: 1.5, y: 1.0, z: 2.4, width: 0.62, height: 0.04, depth: 0.45, model: "model-metal" }),
  box({ id: "kitchen-cooktop", kind: "induction-cooktop", space: "common-room", x: 1.95, y: 1.0, z: 2.4, width: 0.72, height: 0.04, depth: 0.42, model: "model-metal" }),
  box({ id: "kitchen-tall-pantry", kind: "pantry", space: "common-room", x: 2.88, y: 1.35, z: 4.65, width: 0.48, height: 2.45, depth: 1.2, model: "model-wood" }),
  box({ id: "kitchen-refrigerator", kind: "refrigerator", space: "common-room", x: 2.95, y: 1.15, z: 3.25, width: 0.7, height: 2.25, depth: 0.76, model: "model-metal" }),
  box({ id: "kitchen-recycling-cabinet", kind: "recycling-cabinet", space: "common-room", x: 2.7, y: 0.75, z: 1.05, width: 0.7, height: 1.5, depth: 0.68, model: "model-wood" }),
  box({ id: "powder-vanity", kind: "vanity", space: "powder-utility", x: 4.18, y: 0.82, z: -4.85, width: 0.92, height: 0.72, depth: 0.48, model: "model-wood-light" }),
  box({ id: "powder-toilet", kind: "toilet", space: "powder-utility", x: 4.25, y: 0.45, z: -3.55, width: 0.58, height: 0.8, depth: 0.72, model: "model-opaque" }),
  box({ id: "utility-washer", kind: "washer-dryer", space: "powder-utility", x: 4.72, y: 0.62, z: -5.35, width: 0.52, height: 1.2, depth: 0.62, model: "model-metal" }),
  box({ id: "ground-storage-cabinet", kind: "storage", space: "storage-1f", x: 4.25, y: 1.2, z: -1.2, width: 1.35, height: 2.2, depth: 0.5, model: "model-wood" }),
  box({ id: "primary-bed", kind: "double-bed", space: "primary-bedroom", x: -2.8, y: 3.38, z: 4.35, width: 2.2, height: 0.42, depth: 1.95, model: "model-soft" }),
  box({ id: "primary-bedhead", kind: "bedhead", space: "primary-bedroom", x: -2.8, y: 4.0, z: 5.25, width: 2.25, height: 1.1, depth: 0.12, model: "model-wood" }),
  box({ id: "primary-bedside-left", kind: "bedside", space: "primary-bedroom", x: -4.25, y: 3.48, z: 4.35, width: 0.42, height: 0.55, depth: 0.42, model: "model-wood-light" }),
  box({ id: "primary-bedside-right", kind: "bedside", space: "primary-bedroom", x: -1.35, y: 3.48, z: 4.35, width: 0.42, height: 0.55, depth: 0.42, model: "model-wood-light" }),
  box({ id: "primary-wardrobe", kind: "wardrobe", space: "primary-bedroom", x: -4.8, y: 4.18, z: 3.0, width: 0.48, height: 2.1, depth: 1.8, model: "model-wood" }),
  box({ id: "primary-desk", kind: "desk", space: "primary-bedroom", x: -1.4, y: 3.8, z: 5.25, width: 1.2, height: 0.12, depth: 0.48, model: "model-wood-light" }),
  box({ id: "child-one-bed", kind: "single-bed", space: "child-bedroom-1", x: -3.65, y: 3.35, z: -4.75, width: 1.0, height: 0.38, depth: 2.05, model: "model-soft" }),
  box({ id: "child-one-wardrobe", kind: "wardrobe", space: "child-bedroom-1", x: -4.8, y: 4.15, z: -2.0, width: 0.45, height: 2.0, depth: 1.4, model: "model-wood" }),
  box({ id: "child-one-desk", kind: "desk", space: "child-bedroom-1", x: -1.4, y: 3.72, z: -5.1, width: 1.25, height: 0.12, depth: 0.5, model: "model-wood-light" }),
  box({ id: "child-two-bed", kind: "single-bed", space: "child-bedroom-2", x: -3.65, y: 3.35, z: 0.95, width: 1.0, height: 0.38, depth: 1.9, model: "model-soft" }),
  box({ id: "child-two-wardrobe", kind: "wardrobe", space: "child-bedroom-2", x: -4.8, y: 4.15, z: 2.1, width: 0.45, height: 2.0, depth: 0.82, model: "model-wood" }),
  box({ id: "child-two-desk", kind: "desk", space: "child-bedroom-2", x: -1.35, y: 3.72, z: 0.35, width: 1.25, height: 0.12, depth: 0.5, model: "model-wood-light" }),
  box({ id: "upper-bath-vanity", kind: "vanity", space: "upper-bathroom", x: 4.1, y: 3.78, z: 3.75, width: 1.25, height: 0.72, depth: 0.48, model: "model-wood-light" }),
  box({ id: "upper-bath-toilet", kind: "toilet", space: "upper-bathroom", x: 4.55, y: 3.4, z: 2.65, width: 0.6, height: 0.82, depth: 0.72, model: "model-opaque" }),
  box({ id: "upper-bath-shower", kind: "shower-tub", space: "upper-bathroom", x: 4.15, y: 3.45, z: 1.98, width: 1.65, height: 0.72, depth: 0.7, model: "model-translucent" }),
  box({ id: "upper-bath-towel-storage", kind: "towel-storage", space: "upper-bathroom", x: 2.45, y: 4.05, z: 3.82, width: 0.38, height: 1.65, depth: 0.62, model: "model-wood" }),
  box({ id: "upper-corridor-lighting", kind: "ceiling-light", space: "upper-corridor", x: 1.05, y: 5.82, z: -0.8, width: 0.32, height: 0.08, depth: 0.32, model: "model-metal" }),
  box({ id: "upper-storage-cabinet", kind: "linen-storage", space: "upper-storage", x: 4.25, y: 4.18, z: 0.72, width: 1.25, height: 2.2, depth: 0.48, model: "model-wood" }),
  box({ id: "upper-service-cabinet", kind: "service-cabinet", space: "upper-service", x: 4.35, y: 4.2, z: -2.35, width: 1.3, height: 2.25, depth: 0.5, model: "model-metal" }),
];

const siteElements = (): IAutoMovieBuiltElement[] => [
  box({ id: "site-pad", kind: "site-pad", space: "site-pad", x: 0, y: -0.32, z: 0.8, width: 15.5, height: 0.18, depth: 16.0, model: "model-concrete" }),
  box({ id: "front-walk", kind: "front-walk", space: "site-pad", x: 0, y: -0.18, z: -8.2, width: 2.0, height: 0.08, depth: 3.7, model: "model-concrete" }),
  box({ id: "planting-bed-east", kind: "planting-bed", space: "site-pad", x: 6.4, y: -0.05, z: -3.0, width: 1.6, height: 0.35, depth: 7.8, model: "model-green" }),
  box({ id: "planting-bed-west", kind: "planting-bed", space: "site-pad", x: -6.4, y: -0.05, z: 3.8, width: 1.6, height: 0.35, depth: 5.6, model: "model-green" }),
  box({ id: "canopy-post-front-left", kind: "canopy-post", space: "roof-deck", x: -4.95, y: 6.5, z: -5.55, width: 0.16, height: 0.6, depth: 0.16, model: "model-dark-metal" }),
  box({ id: "canopy-post-front-right", kind: "canopy-post", space: "roof-deck", x: 4.95, y: 6.5, z: -5.55, width: 0.16, height: 0.6, depth: 0.16, model: "model-dark-metal" }),
  box({ id: "canopy-post-back-left", kind: "canopy-post", space: "roof-deck", x: -4.95, y: 6.5, z: 5.55, width: 0.16, height: 0.6, depth: 0.16, model: "model-dark-metal" }),
  box({ id: "canopy-post-back-right", kind: "canopy-post", space: "roof-deck", x: 4.95, y: 6.5, z: 5.55, width: 0.16, height: 0.6, depth: 0.16, model: "model-dark-metal" }),
  box({ id: "canopy-beam-front", kind: "canopy-beam", space: "roof-deck", x: 0, y: 6.62, z: -5.55, width: 10.1, height: 0.16, depth: 0.16, model: "model-dark-metal" }),
  box({ id: "canopy-beam-back", kind: "canopy-beam", space: "roof-deck", x: 0, y: 6.62, z: 5.55, width: 10.1, height: 0.16, depth: 0.16, model: "model-dark-metal" }),
  box({ id: "canopy-beam-left", kind: "canopy-beam", space: "roof-deck", x: -4.95, y: 6.62, z: 0, width: 0.16, height: 0.16, depth: 11.1, model: "model-dark-metal" }),
  box({ id: "canopy-beam-right", kind: "canopy-beam", space: "roof-deck", x: 4.95, y: 6.62, z: 0, width: 0.16, height: 0.16, depth: 11.1, model: "model-dark-metal" }),
];

const spaces = (): IAutoMovieBuiltSpace[] => [
  { id: "house", kind: "building", parent: null, cells: [boxCell("house-cell", vector(HOUSE_PLAN.minX, -0.4, HOUSE_PLAN.minZ), vector(HOUSE_PLAN.maxX, 6.8, HOUSE_PLAN.maxZ))] },
  { id: "site-pad", kind: "site", parent: "house", cells: [boxCell("site-cell", vector(SITE_PLAN.minX, -0.35, SITE_PLAN.minZ), vector(SITE_PLAN.maxX, 0.1, SITE_PLAN.maxZ))] },
  { id: "ground-storey", kind: "storey", parent: "house", cells: [boxCell("ground-cell", vector(HOUSE_PLAN.minX, -0.01, HOUSE_PLAN.minZ), vector(HOUSE_PLAN.maxX, 3, HOUSE_PLAN.maxZ))] },
  { id: "upper-storey", kind: "storey", parent: "house", cells: [boxCell("upper-cell", vector(HOUSE_PLAN.minX, 3, HOUSE_PLAN.minZ), vector(HOUSE_PLAN.maxX, 6, HOUSE_PLAN.maxZ))] },
  { id: "roof-deck", kind: "roof-deck", parent: "house", cells: [boxCell("roof-cell", vector(HOUSE_PLAN.minX, 6, HOUSE_PLAN.minZ), vector(HOUSE_PLAN.maxX, 7, HOUSE_PLAN.maxZ))] },
  room("entry", "ground-storey", ROOM_BOUNDS.entry),
  room("flex-workroom", "ground-storey", ROOM_BOUNDS.flexWorkroom),
  room("common-room", "ground-storey", ROOM_BOUNDS.commonRoom),
  room("powder-utility", "ground-storey", ROOM_BOUNDS.powderUtility),
  room("storage-1f", "ground-storey", ROOM_BOUNDS.storage1f),
  room("upper-corridor", "upper-storey", ROOM_BOUNDS.upperCorridor),
  room("primary-bedroom", "upper-storey", ROOM_BOUNDS.primaryBedroom),
  room("child-bedroom-2", "upper-storey", ROOM_BOUNDS.childBedroom2),
  room("child-bedroom-1", "upper-storey", ROOM_BOUNDS.childBedroom1),
  room("upper-bathroom", "upper-storey", ROOM_BOUNDS.upperBathroom),
  room("upper-storage", "upper-storey", ROOM_BOUNDS.upperStorage),
  room("upper-service", "upper-storey", ROOM_BOUNDS.upperService),
];

const boundaries = (): IAutoMovieBuiltBoundary[] => [
  { id: "front-entry-boundary", kind: "exterior-threshold", spaces: ["house", "entry"], elements: [] },
  { id: "front-flex-boundary", kind: "exterior-curtainwall", spaces: ["house", "flex-workroom"], elements: [] },
  { id: "rear-common-boundary", kind: "exterior-curtainwall", spaces: ["house", "common-room"], elements: [] },
  { id: "front-upper-boundary", kind: "exterior-curtainwall", spaces: ["house", "child-bedroom-1"], elements: [] },
  { id: "primary-rear-boundary", kind: "exterior-curtainwall", spaces: ["house", "primary-bedroom"], elements: [] },
  { id: "entry-common-boundary", kind: "passage", spaces: ["entry", "common-room"], elements: [] },
  { id: "entry-flex-boundary", kind: "passage", spaces: ["entry", "flex-workroom"], elements: [] },
  { id: "entry-powder-boundary", kind: "passage", spaces: ["entry", "powder-utility"], elements: [] },
  { id: "common-storage-boundary", kind: "passage", spaces: ["common-room", "storage-1f"], elements: [] },
  { id: "corridor-child-one-boundary", kind: "passage", spaces: ["upper-corridor", "child-bedroom-1"], elements: [] },
  { id: "corridor-child-two-boundary", kind: "passage", spaces: ["upper-corridor", "child-bedroom-2"], elements: [] },
  { id: "corridor-primary-boundary", kind: "passage", spaces: ["upper-corridor", "primary-bedroom"], elements: [] },
  { id: "corridor-bath-boundary", kind: "passage", spaces: ["upper-corridor", "upper-bathroom"], elements: [] },
  { id: "corridor-storage-boundary", kind: "passage", spaces: ["upper-corridor", "upper-storage"], elements: [] },
  { id: "corridor-service-boundary", kind: "passage", spaces: ["upper-corridor", "upper-service"], elements: [] },
];

const openings = (): IAutoMovieBuiltOpening[] => [
  opening("front-entry-door-opening", "front-entry-boundary", "entry-door"),
  opening("front-flex-glass-opening", "front-flex-boundary", null, "window"),
  opening("rear-common-glass-opening", "rear-common-boundary", null, "window"),
  opening("front-upper-glass-opening", "front-upper-boundary", null, "window"),
  opening("primary-rear-glass-opening", "primary-rear-boundary", null, "window"),
  opening("entry-common-opening", "entry-common-boundary", null, "passage"),
  opening("entry-flex-door-opening", "entry-flex-boundary", "flex-door"),
  opening("entry-powder-opening", "entry-powder-boundary", null, "passage"),
  opening("common-storage-opening", "common-storage-boundary", null, "passage"),
  opening("child-one-door-opening", "corridor-child-one-boundary", "bedroom-one-door"),
  opening("child-two-door-opening", "corridor-child-two-boundary", "bedroom-two-door"),
  opening("primary-door-opening", "corridor-primary-boundary", "primary-door"),
  opening("bathroom-door-opening", "corridor-bath-boundary", "bathroom-door"),
  opening("storage-door-opening", "corridor-storage-boundary", "storage-door"),
  opening("service-access-opening", "corridor-service-boundary", null, "passage"),
];

const STAIR_ROUTE = [
  vector(-0.55, 0, -4.0),
  vector(-0.55, 1.5, -1.75),
  vector(0.6, 1.5, -1.65),
  vector(1.55, 3.0, -4.0),
];

const STAIR_HORIZONTAL_RUN = STAIR_ROUTE.slice(1).reduce(
  (total, point, index) =>
    total +
    Math.hypot(
      point.x - STAIR_ROUTE[index].x,
      point.z - STAIR_ROUTE[index].z,
    ),
  0,
);

const connectors = (): IAutoMovieBuiltConnector[] => [
  passage("entry-to-common", "entry", "common-room", [vector(1.25, 0.1, -2.82), vector(1.25, 0.1, -2.55)], 1.2),
  passage("entry-to-flex", "entry", "flex-workroom", [vector(-1.65, 0.1, -4.3), vector(-1.78, 0.1, -4.3)], 0.9),
  passage("entry-to-powder", "entry", "powder-utility", [vector(1.55, 0.1, -4.2), vector(3.3, 0.1, -4.2)], 0.9),
  passage("common-to-storage", "common-room", "storage-1f", [vector(3.2, 0.1, -1.2), vector(3.35, 0.1, -1.2)], 0.9),
  passage("corridor-to-child-one", "upper-corridor", "child-bedroom-1", [vector(0.15, 3.1, -3.45), vector(-0.05, 3.1, -3.45)], 0.9),
  passage("corridor-to-child-two", "upper-corridor", "child-bedroom-2", [vector(0.15, 3.1, 1.25), vector(-0.05, 3.1, 1.25)], 0.9),
  passage("corridor-to-primary", "upper-corridor", "primary-bedroom", [vector(0.15, 3.1, 3.0), vector(-0.05, 3.1, 3.0)], 0.9),
  passage("corridor-to-bathroom", "upper-corridor", "upper-bathroom", [vector(1.95, 3.1, 2.05), vector(2.05, 3.1, 2.05)], 0.9),
  passage("corridor-to-storage", "upper-corridor", "upper-storage", [vector(1.95, 3.1, 0.72), vector(2.05, 3.1, 0.72)], 0.9),
  passage("corridor-to-service", "upper-corridor", "upper-service", [vector(1.95, 3.1, -2.35), vector(2.05, 3.1, -2.35)], 0.8),
  {
    id: "single-dogleg-stair",
    kind: "stair",
    from: "entry",
    to: "upper-corridor",
    bidirectional: true,
    route: STAIR_ROUTE,
    orientations: [IDENTITY, IDENTITY, IDENTITY, IDENTITY],
    width: 1.1,
    clearHeight: 2.2,
    steps: { count: 18, rise: 1.5 / 9, run: STAIR_HORIZONTAL_RUN / 18 },
    elements: [
      "stair-landing",
      ...Array.from({ length: 9 }, (_, index) => `stair-lower-${String(index + 1).padStart(2, "0")}`),
      ...Array.from({ length: 9 }, (_, index) => `stair-upper-${String(index + 1).padStart(2, "0")}`),
    ],
  },
];

const surfaces = (): IAutoMovieBuiltSurface[] => [
  surface("site-pad", "site-ground", { x: -7.8, z: -8.5 }, { x: 7.8, z: 8.5 }, -0.2),
  roomSurface("entry", "entry-floor", ROOM_BOUNDS.entry),
  roomSurface("flex-workroom", "flex-floor", ROOM_BOUNDS.flexWorkroom),
  roomSurface("common-room", "common-floor", ROOM_BOUNDS.commonRoom),
  roomSurface("powder-utility", "powder-floor", ROOM_BOUNDS.powderUtility),
  roomSurface("storage-1f", "storage-floor", ROOM_BOUNDS.storage1f),
  roomSurface("upper-corridor", "upper-corridor-floor", ROOM_BOUNDS.upperCorridor),
  roomSurface("primary-bedroom", "primary-floor", ROOM_BOUNDS.primaryBedroom),
  roomSurface("child-bedroom-2", "child-two-floor", ROOM_BOUNDS.childBedroom2),
  roomSurface("child-bedroom-1", "child-one-floor", ROOM_BOUNDS.childBedroom1),
  roomSurface("upper-bathroom", "upper-bath-floor", ROOM_BOUNDS.upperBathroom),
  roomSurface("upper-storage", "upper-storage-floor", ROOM_BOUNDS.upperStorage),
  roomSurface("upper-service", "upper-service-floor", ROOM_BOUNDS.upperService),
];

const populations = (): IAutoMovieBuiltPopulation[] => [
  population({ id: "rear-common-curtainwall-bays", space: "common-room", modelRecipe: "model-curtainwall-module", palette: "#335d69", transforms: roomCurtainwallTransforms(ROOM_BOUNDS.commonRoom, 7, 5.92) }),
  population({ id: "front-flex-curtainwall-bays", space: "flex-workroom", modelRecipe: "model-curtainwall-module", palette: "#335d69", transforms: roomCurtainwallTransforms(ROOM_BOUNDS.flexWorkroom, 3, -5.92) }),
  population({ id: "front-stair-curtainwall-bays", space: "entry", modelRecipe: "model-curtainwall-module", palette: "#335d69", transforms: roomCurtainwallTransforms(ROOM_BOUNDS.entry, 3, -5.92) }),
  population({ id: "front-upper-curtainwall-bays", space: "child-bedroom-1", modelRecipe: "model-curtainwall-module", palette: "#6b8282", transforms: roomCurtainwallTransforms(ROOM_BOUNDS.childBedroom1, 5, -5.92) }),
  population({ id: "primary-rear-curtainwall-bays", space: "primary-bedroom", modelRecipe: "model-curtainwall-module", palette: "#335d69", transforms: roomCurtainwallTransforms(ROOM_BOUNDS.primaryBedroom, 4, 5.92) }),
  population({ id: "front-exterior-shading", space: "house", modelRecipe: "model-shade-module", palette: "#0b1015", transforms: [
    ...linearTransforms({ prefix: "lower", count: 7, start: -4.2, step: 1.2, axis: "x", y: 2.82, fixed: -6.15, scale: vector(1.05, 0.08, 0.26) }),
    ...linearTransforms({ prefix: "upper", count: 7, start: -4.2, step: 1.2, axis: "x", y: 5.82, fixed: -6.15, scale: vector(1.05, 0.08, 0.26) }),
  ] }),
  population({ id: "rear-exterior-shading", space: "house", modelRecipe: "model-shade-module", palette: "#0b1015", transforms: [
    ...linearTransforms({ prefix: "lower", count: 7, start: -4.2, step: 1.2, axis: "x", y: 2.82, fixed: 6.15, scale: vector(1.05, 0.08, 0.26) }),
    ...linearTransforms({ prefix: "upper", count: 7, start: -4.2, step: 1.2, axis: "x", y: 5.82, fixed: 6.15, scale: vector(1.05, 0.08, 0.26) }),
  ] }),
  population({ id: "roof-pv-canopy-grid", space: "roof-deck", modelRecipe: "model-pv-module", palette: "#071b36", transforms: Array.from({ length: 40 }, (_, index) => {
    const row = Math.floor(index / 8);
    const column = index % 8;
    return {
      id: `pv-${String(row + 1).padStart(2, "0")}-${String(column + 1).padStart(2, "0")}`,
      ...transform(vector(-4.2 + column * 1.2, 6.72, -4.5 + row * 2.25), vector(1.08, 0.06, 2.05)),
    };
  }) }),
];

const citizenHouseEnvironment = (): IAutoMovieBuiltEnvironment => ({
  version: 1,
  id: "citizen-house-2080",
  units: "meter",
  buildings: [{ id: "citizen-house", element: "house-root", space: "house" }],
  models: MODELS,
  modelReferences: [],
  elements: [
    { id: "house-root", kind: "building", parent: null, transform: transform(vector(0, 0, 0), vector(1, 1, 1)), model: null, space: "house" },
    ...groundElements(),
    ...fitOutElements(),
    ...siteElements(),
  ],
  populations: populations(),
  spaces: spaces(),
  boundaries: boundaries(),
  openings: openings(),
  connectors: connectors(),
  surfaces: surfaces(),
  walkable: surfaces().map((entry) => entry.surface.id),
});

/**
 * Deterministic source owner for the complete two-storey citizen house.
 *
 * The registration answers `docs/spaces/001-citizen-house.md#citizen-house-space`.
 * Every repeated envelope member is derived from a count and spacing rule; the
 * source does not read files, clocks, network state, or unseeded randomness.
 *
 * @evidence spaces/001-citizen-house.md The source realizes the complete authored citizen-house space document.
 * @evidenceReview spaces/001-citizen-house.md #1d6ce1e Read the complete space design file and checked its authored room, envelope, privacy, review requirements, and compiled topology record.
 * @evidence spaces/001-citizen-house.md#citizen-house-space The source realizes the space H2's room graph, envelope, openings, connectors, surfaces, and fit-out carrier.
 * @evidenceReview spaces/001-citizen-house.md#citizen-house-space #fab42d5 Read the space H2 and checked the built environment realizes its room graph, envelope, openings, connectors, surfaces, fit-out, and observation boundary.
 * @evidence principles/core/source-units.md#source-scope-preservation The source stays within the selected spaces owner and does not create a second production branch.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Read the source scope checklist and checked this export stays within the selected spaces owner.
 * @evidence principles/core/source-units.md#source-substantive-completion The source publishes the complete environment carrier required by its selected space design.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Read the source completion checklist and checked the environment publishes the required complete carrier.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The selected space parent explicitly supplies the 11×12m house footprint, separate site context, two floor lines, room bounds, boundary/opening graph, single stair route, and measured curtainwall population rules; the current source compile implements those exact interfaces without inventing a topology or clearance decision, so no parent space defect was exposed.
 * @evidence obligations/design/space-sources.md#space-source-design-ownership The source registers the exact space H2 it realizes.
 * @evidenceReview obligations/design/space-sources.md#space-source-design-ownership #c0afa1f Read the source-ownership obligation and checked the export registers the exact space H2.
 * @evidence obligations/design/space-sources.md#space-source-stable-identities The source assigns stable identities to spaces, elements, populations, openings, connectors, and surfaces.
 * @evidenceReview obligations/design/space-sources.md#space-source-stable-identities #8f4bb4a Read the stable-identities obligation and checked all spaces, elements, populations, openings, connectors, and surfaces have stable ids.
 * @evidence obligations/design/space-sources.md#space-source-invalid-topology The source carries the topology through the engine's built-environment validation boundary.
 * @evidenceReview obligations/design/space-sources.md#space-source-invalid-topology #030592d Read the invalid-topology obligation and checked the source's built topology passes the engine validation boundary.
 */
export const citizenHouseSpaceSource: IAutoMovieLibrarySourceOwner = {
  design: "docs/spaces/001-citizen-house.md#citizen-house-space",
  build: (_context) => ({
    environments: [citizenHouseEnvironment()],
    models: [],
  }),
};
