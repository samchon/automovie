import type {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieBuiltSpace,
  IAutoMovieBuiltSurface,
  IAutoMovieColor,
  IAutoMovieConnectorSection,
  IAutoMovieLibrarySourceOwner,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
const HALF_TURN_Y: IAutoMovieQuaternion = { x: 0, y: 1, z: 0, w: 0 };
const QUARTER_TURN_Y_NEGATIVE: IAutoMovieQuaternion = {
  x: 0,
  y: -Math.SQRT1_2,
  z: 0,
  w: Math.SQRT1_2,
};
const QUARTER_TURN_Y_POSITIVE: IAutoMovieQuaternion = {
  x: 0,
  y: Math.SQRT1_2,
  z: 0,
  w: Math.SQRT1_2,
};

const vector = (x: number, y: number, z: number): IAutoMovieVector3 => ({
  x,
  y,
  z,
});

const transform = (
  translation: IAutoMovieVector3,
  scale: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion = IDENTITY,
): IAutoMovieTransform => ({
  translation,
  rotation,
  scale,
});

type Bounds = {
  min: IAutoMovieVector3;
  max: IAutoMovieVector3;
};

const bounds = (
  minX: number,
  minY: number,
  minZ: number,
  maxX: number,
  maxY: number,
  maxZ: number,
): Bounds => ({
  min: vector(minX, minY, minZ),
  max: vector(maxX, maxY, maxZ),
});

const centerOf = (box: Bounds): IAutoMovieVector3 => vector(
  (box.min.x + box.max.x) / 2,
  (box.min.y + box.max.y) / 2,
  (box.min.z + box.max.z) / 2,
);

const sizeOf = (box: Bounds): IAutoMovieVector3 => vector(
  box.max.x - box.min.x,
  box.max.y - box.min.y,
  box.max.z - box.min.z,
);

const boxCell = (id: string, box: Bounds) => ({
  id,
  planes: [
    { normal: vector(1, 0, 0), offset: box.max.x },
    { normal: vector(-1, 0, 0), offset: -box.min.x },
    { normal: vector(0, 1, 0), offset: box.max.y },
    { normal: vector(0, -1, 0), offset: -box.min.y },
    { normal: vector(0, 0, 1), offset: box.max.z },
    { normal: vector(0, 0, -1), offset: -box.min.z },
  ],
});

const color = (
  hex: string,
  r: number,
  g: number,
  b: number,
): IAutoMovieColor => ({
  r,
  g,
  b,
  a: 1,
  hex,
});

const MATERIALS = {
  wallPlaster: {
    id: "material/wall-plaster-ochre",
    name: "material/wall-plaster-ochre",
    baseColor: color("#a66b43", 0.42, 0.24, 0.10),
    metallic: 0,
    roughness: 0.88,
    opacity: 1,
    alphaMode: "opaque",
  },
  lightStone: {
    id: "material/light-stone-rough",
    name: "material/light-stone-rough",
    baseColor: color("#b7aa92", 0.47, 0.40, 0.30),
    metallic: 0,
    roughness: 0.84,
    opacity: 1,
    alphaMode: "opaque",
  },
  floorStone: {
    id: "material/floor-stone",
    name: "material/floor-stone",
    baseColor: color("#c6b999", 0.57, 0.48, 0.33),
    metallic: 0,
    roughness: 0.90,
    opacity: 1,
    alphaMode: "opaque",
  },
  redTerracotta: {
    id: "material/red-terracotta",
    name: "material/red-terracotta",
    baseColor: color("#9f593d", 0.34, 0.12, 0.05),
    metallic: 0,
    roughness: 0.88,
    opacity: 1,
    alphaMode: "opaque",
  },
  serviceYardEarth: {
    id: "material/service-yard-earth",
    name: "material/service-yard-earth",
    baseColor: color("#8b765d", 0.25, 0.16, 0.09),
    metallic: 0,
    roughness: 0.94,
    opacity: 1,
    alphaMode: "opaque",
  },
  routeOverlay: {
    id: "material/route-reservation-overlay",
    name: "material/route-reservation-overlay",
    baseColor: color("#d8a85b", 0.85, 0.66, 0.25),
    metallic: 0,
    roughness: 0,
    opacity: 0,
    alphaMode: "blend",
  },
} as const;

type MaterialName = keyof typeof MATERIALS;

const materialFor = (name: MaterialName): IAutoMovieMaterial => ({
  id: MATERIALS[name].id,
  name: MATERIALS[name].name,
  baseColor: MATERIALS[name].baseColor,
  metallic: MATERIALS[name].metallic,
  roughness: MATERIALS[name].roughness,
  emissive: null,
  opacity: MATERIALS[name].opacity,
  alphaMode: MATERIALS[name].alphaMode,
  doubleSided: true,
  baseColorTexture: null,
});

const modelFor = (name: MaterialName): IAutoMovieModel => ({
  id: `model/${name}`,
  name: `${MATERIALS[name].name} unit box`,
  origin: "generated",
  parts: [
    {
      id: `model/${name}/unit-box`,
      name: "unit box",
      geometry: {
        type: "primitive",
        shape: { type: "box", width: 1, height: 1, depth: 1 },
      },
      material: MATERIALS[name].id,
      attachedBone: null,
      transform: null,
    },
  ],
  skeleton: null,
  body: null,
  materials: [materialFor(name)],
  asset: null,
});

const boxElement = (
  id: string,
  kind: string,
  box: Bounds,
  model: MaterialName,
  space: string,
): IAutoMovieBuiltElement => ({
  id,
  kind,
  parent: "building/root",
  transform: transform(centerOf(box), sizeOf(box)),
  model: `model/${model}`,
  space,
});

const semanticElement = (
  id: string,
  kind: string,
  space: string,
  translation: IAutoMovieVector3 = vector(0, 0, 0),
): IAutoMovieBuiltElement => ({
  id,
  kind,
  parent: "building/root",
  transform: transform(translation, vector(1, 1, 1)),
  model: null,
  space,
});

const exteriorElements = (): IAutoMovieBuiltElement[] => [
  boxElement(
    "wall/south-west",
    "exterior-wall",
    bounds(-12, 0, -9, -0.8, 3.6, -8.4),
    "wallPlaster",
    "ground-storey",
  ),
  boxElement(
    "wall/south-east",
    "exterior-wall",
    bounds(0.8, 0, -9, 12, 3.6, -8.4),
    "wallPlaster",
    "ground-storey",
  ),
  boxElement(
    "wall/south-entry-lintel",
    "exterior-lintel",
    bounds(-0.8, 2.6, -9, 0.8, 3.6, -8.4),
    "lightStone",
    "ground-storey",
  ),
  boxElement(
    "wall/north",
    "exterior-wall",
    bounds(-12, 0, 8.4, 12, 3.6, 9),
    "wallPlaster",
    "ground-storey",
  ),
  boxElement(
    "wall/west",
    "exterior-wall",
    bounds(-12, 0, -9, -11.4, 3.6, 9),
    "wallPlaster",
    "ground-storey",
  ),
  boxElement(
    "wall/east-south",
    "exterior-wall",
    bounds(11.4, 0, -9, 12, 3.6, 6.2),
    "wallPlaster",
    "ground-storey",
  ),
  boxElement(
    "wall/east-north",
    "exterior-wall",
    bounds(11.4, 0, 7.4, 12, 3.6, 9),
    "wallPlaster",
    "ground-storey",
  ),
  boxElement(
    "wall/east-service-lintel",
    "exterior-lintel",
    bounds(11.4, 2.1, 6.2, 12, 3.6, 7.4),
    "lightStone",
    "ground-storey",
  ),
];

const sanctuaryPartitionElements = (): IAutoMovieBuiltElement[] => [
  boxElement(
    "partition/sanctuary-west-jamb",
    "room-loop-partition",
    bounds(-3.2, 0, 5.6, -0.55, 3.6, 6),
    "lightStone",
    "ground-storey",
  ),
  boxElement(
    "partition/sanctuary-east-jamb",
    "room-loop-partition",
    bounds(0.55, 0, 5.6, 3.2, 3.6, 6),
    "lightStone",
    "ground-storey",
  ),
  boxElement(
    "partition/sanctuary-lintel",
    "room-loop-lintel",
    bounds(-0.55, 2.1, 5.6, 0.55, 3.6, 6),
    "lightStone",
    "ground-storey",
  ),
];

const communalPartitionElements = (): IAutoMovieBuiltElement[] => [
  boxElement(
    "partition/communal-south-jamb",
    "room-loop-partition",
    bounds(-7.4, 0, -3.2, -7, 3.6, -0.55),
    "lightStone",
    "ground-storey",
  ),
  boxElement(
    "partition/communal-north-jamb",
    "room-loop-partition",
    bounds(-7.4, 0, 0.55, -7, 3.6, 3.2),
    "lightStone",
    "ground-storey",
  ),
  boxElement(
    "partition/communal-lintel",
    "room-loop-lintel",
    bounds(-7.4, 2.1, -0.55, -7, 3.6, 0.55),
    "lightStone",
    "ground-storey",
  ),
];

const eastRoomDoorElements = (): IAutoMovieBuiltElement[] => [
  boxElement(
    "partition/administration-south-jamb",
    "room-loop-partition",
    bounds(7, 0, 2.6, 7.4, 3.6, 3.35),
    "lightStone",
    "ground-storey",
  ),
  boxElement(
    "partition/administration-north-jamb",
    "room-loop-partition",
    bounds(7, 0, 4.45, 7.4, 3.6, 5.2),
    "lightStone",
    "ground-storey",
  ),
  boxElement(
    "partition/administration-lintel",
    "room-loop-lintel",
    bounds(7, 2.1, 3.35, 7.4, 3.6, 4.45),
    "lightStone",
    "ground-storey",
  ),
  boxElement(
    "partition/records-south-jamb",
    "room-loop-partition",
    bounds(7, 0, -0.3, 7.4, 3.6, 0.45),
    "lightStone",
    "ground-storey",
  ),
  boxElement(
    "partition/records-north-jamb",
    "room-loop-partition",
    bounds(7, 0, 1.55, 7.4, 3.6, 2.3),
    "lightStone",
    "ground-storey",
  ),
  boxElement(
    "partition/records-lintel",
    "room-loop-lintel",
    bounds(7, 2.1, 0.45, 7.4, 3.6, 1.55),
    "lightStone",
    "ground-storey",
  ),
  boxElement(
    "partition/storage-south-jamb",
    "room-loop-partition",
    bounds(7, 0, -5.2, 7.4, 3.6, -3.5),
    "lightStone",
    "ground-storey",
  ),
  boxElement(
    "partition/storage-north-jamb",
    "room-loop-partition",
    bounds(7, 0, -2.4, 7.4, 3.6, -0.7),
    "lightStone",
    "ground-storey",
  ),
  boxElement(
    "partition/storage-lintel",
    "room-loop-lintel",
    bounds(7, 2.1, -3.5, 7.4, 3.6, -2.4),
    "lightStone",
    "ground-storey",
  ),
];

const eastSeparatorElements = (): IAutoMovieBuiltElement[] => [
  boxElement(
    "separator/east-admin-records",
    "east-room-separator",
    bounds(7.4, 0, 2.3, 11.4, 3.6, 2.6),
    "lightStone",
    "ground-storey",
  ),
  boxElement(
    "separator/east-records-storage",
    "east-room-separator",
    bounds(7.4, 0, -0.7, 11.4, 3.6, -0.3),
    "lightStone",
    "ground-storey",
  ),
];

const roofElements = (): IAutoMovieBuiltElement[] => [
  boxElement(
    "roof/south-cover",
    "roof-cover",
    bounds(-12, 3.6, -9, 12, 3.8, -3.6),
    "redTerracotta",
    "building",
  ),
  boxElement(
    "roof/north-cover",
    "roof-cover",
    bounds(-12, 3.6, 3.6, 12, 3.8, 9),
    "redTerracotta",
    "building",
  ),
  boxElement(
    "roof/west-cover",
    "roof-cover",
    bounds(-12, 3.6, -3.6, -5, 3.8, 3.6),
    "redTerracotta",
    "building",
  ),
  boxElement(
    "roof/east-cover",
    "roof-cover",
    bounds(5, 3.6, -3.6, 12, 3.8, 3.6),
    "redTerracotta",
    "building",
  ),
];

const floorElements = (): IAutoMovieBuiltElement[] => [
  boxElement(
    "floor/entry-threshold",
    "floor",
    bounds(-11.4, -0.1, -8.4, 11.4, 0, -5.6),
    "floorStone",
    "entry-threshold",
  ),
  boxElement(
    "floor/courtyard",
    "floor",
    bounds(-5, -0.1, -3.6, 5, 0, 3.6),
    "floorStone",
    "courtyard",
  ),
  boxElement(
    "floor/loop-south",
    "floor",
    bounds(-7, -0.1, -5.6, 7, 0, -3.6),
    "floorStone",
    "colonnade-loop",
  ),
  boxElement(
    "floor/loop-north",
    "floor",
    bounds(-7, -0.1, 3.6, 7, 0, 5.6),
    "floorStone",
    "colonnade-loop",
  ),
  boxElement(
    "floor/loop-west",
    "floor",
    bounds(-7, -0.1, -3.6, -5, 0, 3.6),
    "floorStone",
    "colonnade-loop",
  ),
  boxElement(
    "floor/loop-east",
    "floor",
    bounds(5, -0.1, -3.6, 7, 0, 3.6),
    "floorStone",
    "colonnade-loop",
  ),
  boxElement(
    "floor/sanctuary",
    "floor",
    bounds(-3.2, -0.1, 6, 3.2, 0, 8.4),
    "floorStone",
    "sanctuary",
  ),
  boxElement(
    "floor/communal-votive",
    "floor",
    bounds(-11.4, -0.1, -3.2, -7.4, 0, 3.2),
    "floorStone",
    "communal-votive-room",
  ),
  boxElement(
    "floor/administration",
    "floor",
    bounds(7.4, -0.1, 2.6, 11.4, 0, 5.2),
    "floorStone",
    "administration-room",
  ),
  boxElement(
    "floor/records",
    "floor",
    bounds(7.4, -0.1, -0.3, 11.4, 0, 2.3),
    "floorStone",
    "records-room",
  ),
  boxElement(
    "floor/votive-storage",
    "floor",
    bounds(7.4, -0.1, -5.2, 11.4, 0, -0.7),
    "floorStone",
    "votive-storage-room",
  ),
  boxElement(
    "floor/service-yard",
    "floor",
    bounds(12.4, -0.1, 5.4, 15.2, 0, 8.2),
    "serviceYardEarth",
    "service-yard",
  ),
];

const openingElements = (): IAutoMovieBuiltElement[] => [
  semanticElement("opening/south-entrance", "opening-void", "entry-threshold"),
  semanticElement("opening/sanctuary-door", "opening-void", "sanctuary"),
  semanticElement("opening/communal-door", "opening-void", "communal-votive-room"),
  semanticElement("opening/administration-door", "opening-void", "administration-room"),
  semanticElement("opening/records-door", "opening-void", "records-room"),
  semanticElement("opening/votive-storage-door", "opening-void", "votive-storage-room"),
  semanticElement("opening/service-gate", "opening-void", "service-yard"),
  semanticElement("fountain-center", "landmark-socket", "courtyard"),
];

type ObservationRouteData = {
  readonly room: string;
  readonly threshold: IAutoMovieVector3;
  readonly center: IAutoMovieVector3;
  readonly north: IAutoMovieVector3;
  readonly east: IAutoMovieVector3;
  readonly south: IAutoMovieVector3;
  readonly west: IAutoMovieVector3;
  readonly clearWidth: 1.2;
  readonly protectedBand: 0.3;
};

const observationRoutes: readonly ObservationRouteData[] = [
  {
    room: "sanctuary",
    threshold: vector(0, 0, 6),
    center: vector(0, 0, 7.2),
    north: vector(0, 0, 7.8),
    east: vector(0.6, 0, 7.2),
    south: vector(0, 0, 6.6),
    west: vector(-0.6, 0, 7.2),
    clearWidth: 1.2,
    protectedBand: 0.3,
  },
  {
    room: "communal-votive-room",
    threshold: vector(-7.4, 0, 0),
    center: vector(-9.4, 0, 0),
    north: vector(-9.4, 0, 0.6),
    east: vector(-8.8, 0, 0),
    south: vector(-9.4, 0, -0.6),
    west: vector(-10, 0, 0),
    clearWidth: 1.2,
    protectedBand: 0.3,
  },
  {
    room: "administration-room",
    threshold: vector(7.4, 0, 3.9),
    center: vector(9.4, 0, 3.9),
    north: vector(9.4, 0, 4.5),
    east: vector(10, 0, 3.9),
    south: vector(9.4, 0, 3.3),
    west: vector(8.8, 0, 3.9),
    clearWidth: 1.2,
    protectedBand: 0.3,
  },
  {
    room: "records-room",
    threshold: vector(7.4, 0, 1),
    center: vector(9.4, 0, 1),
    north: vector(9.4, 0, 1.6),
    east: vector(10, 0, 1),
    south: vector(9.4, 0, 0.4),
    west: vector(8.8, 0, 1),
    clearWidth: 1.2,
    protectedBand: 0.3,
  },
  {
    room: "votive-storage-room",
    threshold: vector(7.4, 0, -2.95),
    center: vector(9.4, 0, -2.95),
    north: vector(9.4, 0, -2.35),
    east: vector(10, 0, -2.95),
    south: vector(9.4, 0, -3.55),
    west: vector(8.8, 0, -2.95),
    clearWidth: 1.2,
    protectedBand: 0.3,
  },
] as const;

const loopReturnRoute = [
  vector(-6, 0, -4.6),
  vector(6, 0, -4.6),
  vector(6, 0, 4.6),
  vector(-6, 0, 4.6),
  vector(-6, 0, -4.6),
] as const;

const observationRouteSegments = (route: ObservationRouteData) => [
  { name: "threshold-center", start: route.threshold, end: route.center },
  { name: "center-north", start: route.center, end: route.north },
  { name: "center-east", start: route.center, end: route.east },
  { name: "center-south", start: route.center, end: route.south },
  { name: "center-west", start: route.center, end: route.west },
];

const routeReservationElement = (
  route: ObservationRouteData,
  segment: ReturnType<typeof observationRouteSegments>[number],
): IAutoMovieBuiltElement => {
  const halfProtection = route.clearWidth / 2 + route.protectedBand;
  const horizontal = Math.abs(segment.end.x - segment.start.x) > Math.abs(segment.end.z - segment.start.z);
  const minX = horizontal
    ? Math.min(segment.start.x, segment.end.x)
    : segment.start.x - halfProtection;
  const maxX = horizontal
    ? Math.max(segment.start.x, segment.end.x)
    : segment.start.x + halfProtection;
  const minZ = horizontal
    ? segment.start.z - halfProtection
    : Math.min(segment.start.z, segment.end.z);
  const maxZ = horizontal
    ? segment.start.z + halfProtection
    : Math.max(segment.start.z, segment.end.z);
  return boxElement(
    `observation-route/${route.room}/${segment.name}`,
    "observation-route-reservation",
    bounds(minX, 0, minZ, maxX, 0.02, maxZ),
    "routeOverlay",
    route.room,
  );
};

const observationRouteElements = (): IAutoMovieBuiltElement[] => observationRoutes.flatMap((route) =>
  observationRouteSegments(route).map((segment) => routeReservationElement(route, segment)),
);

const loopReturnElements = (): IAutoMovieBuiltElement[] => loopReturnRoute.map((position, index) =>
  semanticElement(
    `loop-return/${String(index).padStart(2, "0")}`,
    "loop-return-anchor",
    "colonnade-loop",
    position,
  ),
);

const observationAnchorElements = (): IAutoMovieBuiltElement[] => observationRoutes.flatMap((route) => {
  const points: ReadonlyArray<readonly [string, IAutoMovieVector3]> = [
    ["threshold", route.threshold],
    ["center", route.center],
    ["north", route.north],
    ["east", route.east],
    ["south", route.south],
    ["west", route.west],
  ];
  return points.map(([name, position]) => semanticElement(
    `route-anchor/${route.room}/${name}`,
    "observation-route-anchor",
    route.room,
    position,
  ));
});

const environmentElements = (): IAutoMovieBuiltElement[] => [
  {
    id: "building/root",
    kind: "building",
    parent: null,
    transform: transform(vector(0, 0, 0), vector(1, 1, 1)),
    model: null,
    space: "building",
  },
  ...exteriorElements(),
  ...sanctuaryPartitionElements(),
  ...communalPartitionElements(),
  ...eastRoomDoorElements(),
  ...eastSeparatorElements(),
  ...roofElements(),
  ...floorElements(),
  ...openingElements(),
  ...loopReturnElements(),
  ...observationRouteElements(),
  ...observationAnchorElements(),
];

const space = (
  id: string,
  kind: string,
  parent: string | null,
  cells: ReturnType<typeof boxCell>[],
): IAutoMovieBuiltSpace => ({ id, kind, parent, cells });

const environmentSpaces = (): IAutoMovieBuiltSpace[] => [
  space("site", "site", null, [boxCell("site/cell", bounds(-12.8, 0, -9.8, 15.8, 3.6, 9.8))]),
  space("building", "building", "site", [boxCell("building/cell", bounds(-12, 0, -9, 12, 3.6, 9))]),
  space("ground-storey", "storey", "building", [boxCell("ground-storey/cell", bounds(-12, 0, -9, 12, 3.6, 9))]),
  space("courtyard", "void", "ground-storey", [boxCell("courtyard/cell", bounds(-5, 0, -3.6, 5, 3.6, 3.6))]),
  space("colonnade-loop", "circulation-loop", "ground-storey", [
    boxCell("colonnade-loop/south-cell", bounds(-7, 0, -5.6, 7, 3.6, -3.6)),
    boxCell("colonnade-loop/north-cell", bounds(-7, 0, 3.6, 7, 3.6, 5.6)),
    boxCell("colonnade-loop/west-cell", bounds(-7, 0, -3.6, -5, 3.6, 3.6)),
    boxCell("colonnade-loop/east-cell", bounds(5, 0, -3.6, 7, 3.6, 3.6)),
  ]),
  space("entry-threshold", "threshold-apron", "ground-storey", [boxCell("entry-threshold/cell", bounds(-11.4, 0, -8.4, 11.4, 3.6, -5.6))]),
  space("sanctuary", "room", "ground-storey", [boxCell("sanctuary/cell", bounds(-3.2, 0, 6, 3.2, 3.6, 8.4))]),
  space("communal-votive-room", "room", "ground-storey", [boxCell("communal-votive-room/cell", bounds(-11.4, 0, -3.2, -7.4, 3.6, 3.2))]),
  space("administration-room", "room", "ground-storey", [boxCell("administration-room/cell", bounds(7.4, 0, 2.6, 11.4, 3.6, 5.2))]),
  space("records-room", "room", "ground-storey", [boxCell("records-room/cell", bounds(7.4, 0, -0.3, 11.4, 3.6, 2.3))]),
  space("votive-storage-room", "room", "ground-storey", [boxCell("votive-storage-room/cell", bounds(7.4, 0, -5.2, 11.4, 3.6, -0.7))]),
  space("service-yard", "service-yard", "site", [boxCell("service-yard/cell", bounds(12.4, 0, 5.4, 15.2, 3.6, 8.2))]),
];

const rectangle = (minX: number, minY: number, width: number, height: number) => [
  { x: minX, y: minY },
  { x: minX + width, y: minY },
  { x: minX + width, y: minY + height },
  { x: minX, y: minY + height },
];

const face = (
  origin: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  width: number,
  height: number,
  thickness: number,
) => ({
  origin,
  rotation,
  outline: rectangle(0, 0, width, height),
  thickness,
});

const environmentBoundaries = (): IAutoMovieBuiltBoundary[] => [
  {
    id: "boundary/elevation-south",
    kind: "exterior-wall",
    spaces: ["building", "entry-threshold"],
    elements: ["wall/south-west", "wall/south-east", "wall/south-entry-lintel"],
    face: face(vector(12, 0, -8.4), HALF_TURN_Y, 24, 3.6, 0.6),
  },
  {
    id: "boundary/elevation-north",
    kind: "exterior-wall",
    spaces: ["building"],
    elements: ["wall/north"],
    face: face(vector(-12, 0, 8.4), IDENTITY, 24, 3.6, 0.6),
  },
  {
    id: "boundary/elevation-west",
    kind: "exterior-wall",
    spaces: ["building"],
    elements: ["wall/west"],
    face: face(vector(-11.4, 0, -9), QUARTER_TURN_Y_NEGATIVE, 18, 3.6, 0.6),
  },
  {
    id: "boundary/elevation-east",
    kind: "exterior-wall",
    spaces: ["building", "service-yard"],
    elements: ["wall/east-south", "wall/east-north", "wall/east-service-lintel"],
    face: face(vector(11.4, 0, 9), QUARTER_TURN_Y_POSITIVE, 18, 3.6, 0.6),
  },
  {
    id: "boundary/partition-sanctuary",
    kind: "room-loop-partition",
    spaces: ["colonnade-loop", "sanctuary"],
    elements: [
      "partition/sanctuary-west-jamb",
      "partition/sanctuary-east-jamb",
      "partition/sanctuary-lintel",
    ],
    face: face(vector(-3.2, 0, 5.6), IDENTITY, 6.4, 3.6, 0.4),
  },
  {
    id: "boundary/partition-communal-votive",
    kind: "room-loop-partition",
    spaces: ["colonnade-loop", "communal-votive-room"],
    elements: [
      "partition/communal-south-jamb",
      "partition/communal-north-jamb",
      "partition/communal-lintel",
    ],
    face: face(vector(-7.4, 0, -3.2), QUARTER_TURN_Y_NEGATIVE, 6.4, 3.6, 0.4),
  },
  {
    id: "boundary/partition-administration",
    kind: "room-loop-partition",
    spaces: ["colonnade-loop", "administration-room"],
    elements: [
      "partition/administration-south-jamb",
      "partition/administration-north-jamb",
      "partition/administration-lintel",
    ],
    face: face(vector(7, 0, 5.2), QUARTER_TURN_Y_POSITIVE, 2.6, 3.6, 0.4),
  },
  {
    id: "boundary/partition-records",
    kind: "room-loop-partition",
    spaces: ["colonnade-loop", "records-room"],
    elements: [
      "partition/records-south-jamb",
      "partition/records-north-jamb",
      "partition/records-lintel",
    ],
    face: face(vector(7, 0, 2.3), QUARTER_TURN_Y_POSITIVE, 2.6, 3.6, 0.4),
  },
  {
    id: "boundary/partition-votive-storage",
    kind: "room-loop-partition",
    spaces: ["colonnade-loop", "votive-storage-room"],
    elements: [
      "partition/storage-south-jamb",
      "partition/storage-north-jamb",
      "partition/storage-lintel",
    ],
    face: face(vector(7, 0, -0.7), QUARTER_TURN_Y_POSITIVE, 4.5, 3.6, 0.4),
  },
  {
    id: "boundary/east-admin-records-separator",
    kind: "east-room-separator",
    spaces: ["administration-room", "records-room"],
    elements: ["separator/east-admin-records"],
    face: face(vector(7.4, 0, 2.3), IDENTITY, 4, 3.6, 0.3),
  },
  {
    id: "boundary/east-records-storage-separator",
    kind: "east-room-separator",
    spaces: ["records-room", "votive-storage-room"],
    elements: ["separator/east-records-storage"],
    face: face(vector(7.4, 0, -0.7), IDENTITY, 4, 3.6, 0.4),
  },
];

const opening = (
  id: string,
  kind: string,
  boundary: string,
  profile: ReturnType<typeof rectangle>,
): IAutoMovieBuiltOpening => ({
  id,
  kind,
  boundary,
  fill: null,
  profile: { outline: profile },
});

const environmentOpenings = (): IAutoMovieBuiltOpening[] => [
  opening(
    "south-entrance",
    "passage",
    "boundary/elevation-south",
    rectangle(11.2, 0, 1.6, 2.6),
  ),
  opening(
    "sanctuary-door",
    "door",
    "boundary/partition-sanctuary",
    rectangle(2.65, 0, 1.1, 2.1),
  ),
  opening(
    "communal-votive-door",
    "door",
    "boundary/partition-communal-votive",
    rectangle(2.65, 0, 1.1, 2.1),
  ),
  opening(
    "administration-door",
    "door",
    "boundary/partition-administration",
    rectangle(0.75, 0, 1.1, 2.1),
  ),
  opening(
    "records-door",
    "door",
    "boundary/partition-records",
    rectangle(0.75, 0, 1.1, 2.1),
  ),
  opening(
    "votive-storage-door",
    "door",
    "boundary/partition-votive-storage",
    rectangle(1.7, 0, 1.1, 2.1),
  ),
  opening(
    "service-gate",
    "gate",
    "boundary/elevation-east",
    rectangle(1.6, 0, 1.2, 2.1),
  ),
];

const passage = (
  id: string,
  from: string,
  to: string,
  route: IAutoMovieVector3[],
  width: number | undefined,
  clearHeight: number | undefined,
  elements: string[],
  sections?: IAutoMovieConnectorSection[],
): IAutoMovieBuiltConnector => {
  if (sections !== undefined)
    return {
      id,
      kind: "passage",
      from,
      to,
      bidirectional: true,
      route,
      sections,
      elements,
    };
  if (width === undefined || clearHeight === undefined)
    throw new Error(`passage ${id} needs width and clearHeight`);
  return {
    id,
    kind: "passage",
    from,
    to,
    bidirectional: true,
    route,
    width,
    clearHeight,
    elements,
  };
};

const roomDoorSections = (): IAutoMovieConnectorSection[] => [
  { at: 0, width: 1.1, clearHeight: 2.1 },
  { at: 1, width: 1.2, clearHeight: 3.6 },
];

const environmentConnectors = (): IAutoMovieBuiltConnector[] => [
  passage(
    "south-entrance",
    "site",
    "courtyard",
    [vector(0, 0, -9.8), vector(0, 0, -9), vector(0, 0, -8.4), vector(0, 0, -3.6)],
    1.6,
    2.6,
    ["opening/south-entrance"],
  ),
  passage(
    "courtyard-to-loop",
    "courtyard",
    "colonnade-loop",
    [vector(0, 0, -3.6), vector(0, 0, -4.6)],
    2,
    3.6,
    [],
  ),
  passage(
    "door-sanctuary",
    "colonnade-loop",
    "sanctuary",
    [vector(0, 0, 5.6), vector(0, 0, 6)],
    1.1,
    2.1,
    ["opening/sanctuary-door"],
    roomDoorSections(),
  ),
  passage(
    "door-communal-votive",
    "colonnade-loop",
    "communal-votive-room",
    [vector(-7, 0, 0), vector(-7.4, 0, 0)],
    1.1,
    2.1,
    ["opening/communal-door"],
    roomDoorSections(),
  ),
  passage(
    "door-administration",
    "colonnade-loop",
    "administration-room",
    [vector(7, 0, 3.9), vector(7.4, 0, 3.9)],
    1.1,
    2.1,
    ["opening/administration-door"],
    roomDoorSections(),
  ),
  passage(
    "door-records",
    "colonnade-loop",
    "records-room",
    [vector(7, 0, 1), vector(7.4, 0, 1)],
    1.1,
    2.1,
    ["opening/records-door"],
    roomDoorSections(),
  ),
  passage(
    "door-votive-storage",
    "colonnade-loop",
    "votive-storage-room",
    [vector(7, 0, -2.95), vector(7.4, 0, -2.95)],
    1.1,
    2.1,
    ["opening/votive-storage-door"],
    roomDoorSections(),
  ),
  passage(
    "service-gate",
    "site",
    "service-yard",
    [vector(12, 0, 6.8), vector(12.4, 0, 6.8)],
    1.2,
    2.1,
    ["opening/service-gate"],
  ),
];

const floorSurface = (
  id: string,
  spaceId: string,
  polygon: IAutoMovieVector3[],
  holes?: IAutoMovieVector3[][],
): IAutoMovieBuiltSurface => ({
  space: spaceId,
  surface: {
    id,
    kind: "floor",
    polygon,
    ...(holes === undefined ? {} : { holes }),
    height: { kind: "constant", value: 0 },
  },
});

const plan = (minX: number, minZ: number, maxX: number, maxZ: number) => [
  vector(minX, 0, minZ),
  vector(maxX, 0, minZ),
  vector(maxX, 0, maxZ),
  vector(minX, 0, maxZ),
];

const environmentSurfaces = (): IAutoMovieBuiltSurface[] => [
  floorSurface("surface/entry-threshold-floor", "entry-threshold", plan(-11.4, -8.4, 11.4, -5.6)),
  floorSurface(
    "surface/courtyard-floor",
    "courtyard",
    plan(-5, -3.6, 5, 3.6),
    [plan(-0.85, -0.85, 0.85, 0.85)],
  ),
  floorSurface("surface/courtyard-edge-south", "courtyard", plan(-5, -3.6, 5, -3.4)),
  floorSurface("surface/courtyard-edge-north", "courtyard", plan(-5, 3.4, 5, 3.6)),
  floorSurface("surface/courtyard-edge-west", "courtyard", plan(-5, -3.4, -4.8, 3.4)),
  floorSurface("surface/courtyard-edge-east", "courtyard", plan(4.8, -3.4, 5, 3.4)),
  floorSurface(
    "surface/loop-floor",
    "colonnade-loop",
    plan(-7, -5.6, 7, 5.6),
    [plan(-5, -3.6, 5, 3.6)],
  ),
  floorSurface("surface/sanctuary-floor", "sanctuary", plan(-3.2, 6, 3.2, 8.4)),
  floorSurface("surface/communal-votive-floor", "communal-votive-room", plan(-11.4, -3.2, -7.4, 3.2)),
  floorSurface("surface/administration-floor", "administration-room", plan(7.4, 2.6, 11.4, 5.2)),
  floorSurface("surface/records-floor", "records-room", plan(7.4, -0.3, 11.4, 2.3)),
  floorSurface("surface/votive-storage-floor", "votive-storage-room", plan(7.4, -5.2, 11.4, -0.7)),
  floorSurface("surface/service-yard-floor", "service-yard", plan(12.4, 5.4, 15.2, 8.2)),
];

const ancientCivicTempleEnvironment = (): IAutoMovieBuiltEnvironment => {
  const surfaces = environmentSurfaces();
  return {
    version: 1,
    id: "ancient-civic-temple",
    units: "meter",
    buildings: [{ id: "ancient-civic-temple", element: "building/root", space: "site" }],
    models: Object.keys(MATERIALS).map((name) => modelFor(name as MaterialName)),
    modelReferences: [],
    elements: environmentElements(),
    populations: [],
    spaces: environmentSpaces(),
    boundaries: environmentBoundaries(),
    openings: environmentOpenings(),
    connectors: environmentConnectors(),
    surfaces,
    walkable: surfaces.map((item) => item.surface.id),
  };
};

/**
 * Deterministic space source for the reviewed civic temple spatial graph.
 *
 * @evidence spaces/temple.md This export is the executable owner for the complete reviewed space design file and returns one compiled environment for the library.
 * @evidenceReview spaces/temple.md #7854a58 Independent spatial-source review: target spaces/temple.md requires that the source file must own one executable export for the complete reviewed spatial source contract; observed the export returns the building graph, seven openings, eight connectors, 13 floor surfaces, and 25 room-route reservations. Falsifier: a missing emitted collection or viewer-only route would falsify the file relation.
 * @evidence spaces/temple.md#one-storey-civic-temple-graph The returned environment keeps one site/building, one ground-storey civic temple, one courtyard, and the reviewed parent hierarchy.
 * @evidenceReview spaces/temple.md#one-storey-civic-temple-graph #917bffd Independent spatial-source review: target spaces/temple.md#one-storey-civic-temple-graph requires that the source must preserve one ground-storey building, one courtyard, one continuous loop, five rooms, and direct room doors; observed the output contains one storey, one courtyard, one colonnade-loop, five named room spaces, and direct room doors. Falsifier: a missing room, second loop, or invented room edge would falsify the graph relation.
 * @evidence spaces/temple.md#one-storey-containment-and-level The environment emits the adopted site bounds, ground datum, 3.60m clear height, and no second storey or hidden level.
 * @evidenceReview spaces/temple.md#one-storey-containment-and-level #ef236a9 Independent spatial-source review: target spaces/temple.md#one-storey-containment-and-level requires that the source must keep the site, building, and all emitted elements in the reviewed ground-storey containment; observed the output uses the reviewed site/building bounds and ground-level floor heights, with no second storey. Falsifier: a second level or out-of-bounds element would falsify containment.
 * @evidence spaces/temple.md#courtyard-and-continuous-colonnade-loop The floor ring has the courtyard hole and five source-owned loop-return anchors closing the 2.00m covered loop without an invalid same-space connector.
 * @evidenceReview spaces/temple.md#courtyard-and-continuous-colonnade-loop #e160d55 Independent spatial-source review: target spaces/temple.md#courtyard-and-continuous-colonnade-loop requires that the source must close the courtyard hole and loop-return anchors while retaining the courtyard edge hosts; observed courtyard-floor carries the basin-footprint hole, four courtyard-edge surfaces are emitted, and five loop-return-anchor elements close the loop path. Falsifier: a filled basin hole, missing edge host, or open loop anchor chain would falsify this relation.
 * @evidence spaces/temple.md#room-schedule-and-direct-thresholds The space array emits the sanctuary, communal-votive, administration, records, and votive-storage rooms with their reviewed bounds and direct door relations.
 * @evidenceReview spaces/temple.md#room-schedule-and-direct-thresholds #e393909 Independent spatial-source review: target spaces/temple.md#room-schedule-and-direct-thresholds requires that the source must emit the five named room bounds, direct door openings, and room-facing thresholds; observed sanctuary, communal-votive-room, administration-room, records-room, and votive-storage-room each have a floor surface and direct opening. Falsifier: a missing direct opening or mismatched room bound would falsify the room schedule.
 * @evidence spaces/temple.md#entrance-service-gate-and-route-graph The connector array emits the south entry, five direct room passages, and terminal service gate with the reviewed clear widths, room route sections, and source-owned reservations.
 * @evidenceReview spaces/temple.md#entrance-service-gate-and-route-graph #b231c39 Independent spatial-source review: target spaces/temple.md#entrance-service-gate-and-route-graph requires that the source must preserve the south entry route and rear-east service-yard terminal without adding a connector; observed the south entry opening is direct to colonnade-loop and service-yard is an external rear-east terminal reached through the service gate. Falsifier: a service connector entering the loop or a second terminal would falsify the route graph.
 * @evidence spaces/temple.md#envelope-opening-and-interior-interface The environment emits the 0.60m exterior walls, 0.40m loop partitions, two named east separators, seven opening voids, and their host-facing surfaces without adding a boundary.
 * @evidenceReview spaces/temple.md#envelope-opening-and-interior-interface #440376d Independent spatial-source review: target spaces/temple.md#envelope-opening-and-interior-interface requires that the source must emit the 0.60m exterior wall, 0.40m partitions, opening hosts, and their reviewed vertical ranges; observed exterior walls are 0.60m, loop partitions are 0.40m, and all seven openings carry host depth and vertical range. Falsifier: a changed wall/partition thickness or an opening without host depth and vertical range would falsify the interface.
 * @evidence spaces/temple.md#surface-decomposition-and-ownership-handoff The thirteen floor surfaces include the entry, courtyard floor with a 0.85m basin-footprint hole, four named courtyard-edge hosts, loop, five rooms, and service yard, preserving the reviewed one-owner surface schedule.
 * @evidenceReview spaces/temple.md#surface-decomposition-and-ownership-handoff #f83187d Independent spatial-source review: target spaces/temple.md#surface-decomposition-and-ownership-handoff requires that the source must expose one stable owner for every declared floor, courtyard-edge, loop, room, and service surface; observed surface IDs include courtyard-floor with its hole, four courtyard-edge hosts, loop-floor, eight room/threshold floors, and service-yard-floor. Falsifier: an absent, duplicate, or viewer-only surface host would falsify ownership.
 * @evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions The emitted identities retain west communal placement, north sanctuary axis, east room order, rear-east service terminal, central fountain landmark, and the no-mirror/no-extra-corridor exclusions.
 * @evidenceReview spaces/temple.md#spatial-identity-tolerance-and-exclusions #e055926 Independent spatial-source review: target spaces/temple.md#spatial-identity-tolerance-and-exclusions requires that the source must preserve source-owned route reservations, landmarks, orientation, and refusal of invalid same-space graph edges; observed 25 reservation elements carry clearWidth 1.20m and protectedBand 0.30m, and same-space connectors are refused by the source contract. Falsifier: a blocked route, altered landmark, or accepted same-space connector would falsify the identity boundary.
 * @evidence spaces/temple.md#spatial-verification-addresses-and-finite-review-set The source emits threshold, center, four cardinal, route, and loop-return addresses as source-owned elements so the compiled observation set can measure them rather than rely on viewer decoration.
 * @evidenceReview spaces/temple.md#spatial-verification-addresses-and-finite-review-set #bc595fa Independent spatial-source review: target spaces/temple.md#spatial-verification-addresses-and-finite-review-set requires that the source must emit the approved threshold, center, cardinal, and protected-route addresses used by the finite review set; observed each of five rooms emits threshold, center, north, east, south, and west observation coordinates plus its protected route reservation. Falsifier: a missing cardinal point or protected band would falsify the finite review address.
 * @evidence principles/core/source-units.md#source-scope-preservation This export realizes spatial records only; model geometry, material construction, instance count, camera composition, and viewer interpretation remain outside the source owner.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Independent spatial-source review: target principles/core/source-units.md#source-scope-preservation requires that the export must emit spatial topology, openings, surfaces, and route data only, leaving models, materials, and placement downstream; observed the export contains spaces, openings, connectors, surfaces, and reservations but no model mesh, material response, or placement population. Falsifier: a model, material, or placement record emitted by this export would falsify scope.
 * @evidence principles/core/source-units.md#source-substantive-completion The deterministic factory returns buildings, spaces, elements, boundaries, openings, connectors, surfaces, walkable IDs, and the provisional semantic material records required by the reviewed space interface.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Independent spatial-source review: target principles/core/source-units.md#source-substantive-completion requires that the export must be executable and contain every declared space boundary, opening, surface, and route interface; observed the executable factory returns the complete site/storey graph, seven openings, eight connectors, 13 surfaces, and route reservations. Falsifier: a declared boundary or interface absent from the returned data would falsify completion.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The source implements the reviewed site bounds, ground-storey containment, room boxes, separator intervals, opening hosts, route widths, route protection, loop anchors, fountain landmark, floor holes, and service terminal; no parent interface was missing or repaired here.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Independent exclusion check for ancientCivicTempleSpaceSource: checked the environment factory 13 floor surfaces, including the courtyard basin-footprint hole and four named courtyard-edge hosts, plus source-owned route reservations against design-revision-from-space-source-work; no missing parent decision or repaired upstream interface was found, and a parent repair would falsify this exclusion.
 * @evidence obligations/design/space-sources.md#space-source-design-ownership Every emitted room, opening, connector, route reservation, and surface is tied to one of the nine reviewed spaces H2s above; the source invents no place or dimension.
 * @evidenceReview obligations/design/space-sources.md#space-source-design-ownership #c0afa1f Independent spatial-source review: target obligations/design/space-sources.md#space-source-design-ownership requires that the source must construct the reviewed space design through the named space factory rather than a hidden or viewer-only record; observed the ancientCivicTempleSpaceSource constructor binds the reviewed spaces/temple.md design and returns its factory output. Falsifier: a source export not bound to the reviewed design address would falsify ownership.
 * @evidence obligations/design/space-sources.md#space-source-stable-identities Fixed IDs, metre units, Y-up transforms, bounds, parent spaces, opening names, connector sections, and equal-input factory output remain stable across builds.
 * @evidenceReview obligations/design/space-sources.md#space-source-stable-identities #8f4bb4a Independent spatial-source review: target obligations/design/space-sources.md#space-source-stable-identities requires that the source must preserve the named space, opening, connector, surface, and reservation IDs used by downstream owners; observed named room IDs, opening IDs, connector IDs, surface IDs, loop-return anchors, and reservation IDs are emitted in source data. Falsifier: a renamed or missing downstream ID would falsify stable identity.
 * @evidence obligations/design/space-sources.md#space-source-invalid-topology The source refuses to represent same-space loop return as an invalid connector and instead emits the reviewed closed anchor sequence; required routes, host holes, and separator bounds are represented explicitly rather than guessed.
 * @evidenceReview obligations/design/space-sources.md#space-source-invalid-topology #030592d Independent spatial-source review: target obligations/design/space-sources.md#space-source-invalid-topology requires that the source must refuse invalid topology such as a same-space connector while retaining the loop-return anchor representation; observed the factory rejects from===to connectors and represents the closed loop with five loop-return anchors instead. Falsifier: accepting an invalid same-space edge or losing a loop-return anchor would falsify topology refusal.
 */
export const ancientCivicTempleSpaceSource: IAutoMovieLibrarySourceOwner = {
  design: "docs/spaces/temple.md#one-storey-civic-temple-graph",
  build: () => ({
    environments: [ancientCivicTempleEnvironment()],
    models: [],
  }),
};
