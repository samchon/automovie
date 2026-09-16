import type {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieBuiltSpace,
  IAutoMovieBuiltSurface,
  IAutoMovieColor,
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
  stone: color("#b7aa92", 0.47, 0.40, 0.30),
  roof: color("#65594a", 0.13, 0.10, 0.07),
  floor: color("#c6b999", 0.57, 0.48, 0.33),
  courtyard: color("#8c9a91", 0.25, 0.33, 0.29),
  earth: color("#8b765d", 0.25, 0.16, 0.09),
} as const;

type MaterialName = keyof typeof MATERIALS;

const materialFor = (name: MaterialName): IAutoMovieMaterial => ({
  id: `material/${name}`,
  name,
  baseColor: MATERIALS[name],
  metallic: 0,
  roughness: name === "courtyard" ? 0.9 : 0.78,
  emissive: null,
  opacity: 1,
  alphaMode: "opaque",
  doubleSided: true,
  baseColorTexture: null,
});

const modelFor = (name: MaterialName): IAutoMovieModel => ({
  id: `model/${name}`,
  name: `${name} unit box`,
  origin: "generated",
  parts: [
    {
      id: `model/${name}/unit-box`,
      name: "unit box",
      geometry: {
        type: "primitive",
        shape: { type: "box", width: 1, height: 1, depth: 1 },
      },
      material: `material/${name}`,
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
    "stone",
    "ground-storey",
  ),
  boxElement(
    "wall/south-east",
    "exterior-wall",
    bounds(0.8, 0, -9, 12, 3.6, -8.4),
    "stone",
    "ground-storey",
  ),
  boxElement(
    "wall/south-entry-lintel",
    "exterior-lintel",
    bounds(-0.8, 2.6, -9, 0.8, 3.6, -8.4),
    "stone",
    "ground-storey",
  ),
  boxElement(
    "wall/north",
    "exterior-wall",
    bounds(-12, 0, 8.4, 12, 3.6, 9),
    "stone",
    "ground-storey",
  ),
  boxElement(
    "wall/west",
    "exterior-wall",
    bounds(-12, 0, -9, -11.4, 3.6, 9),
    "stone",
    "ground-storey",
  ),
  boxElement(
    "wall/east-south",
    "exterior-wall",
    bounds(11.4, 0, -9, 12, 3.6, 6.2),
    "stone",
    "ground-storey",
  ),
  boxElement(
    "wall/east-north",
    "exterior-wall",
    bounds(11.4, 0, 7.4, 12, 3.6, 9),
    "stone",
    "ground-storey",
  ),
  boxElement(
    "wall/east-service-lintel",
    "exterior-lintel",
    bounds(11.4, 2.1, 6.2, 12, 3.6, 7.4),
    "stone",
    "ground-storey",
  ),
];

const sanctuaryPartitionElements = (): IAutoMovieBuiltElement[] => [
  boxElement(
    "partition/sanctuary-west-jamb",
    "room-loop-partition",
    bounds(-3.2, 0, 5.6, -0.55, 3.6, 6),
    "stone",
    "ground-storey",
  ),
  boxElement(
    "partition/sanctuary-east-jamb",
    "room-loop-partition",
    bounds(0.55, 0, 5.6, 3.2, 3.6, 6),
    "stone",
    "ground-storey",
  ),
  boxElement(
    "partition/sanctuary-lintel",
    "room-loop-lintel",
    bounds(-0.55, 2.1, 5.6, 0.55, 3.6, 6),
    "stone",
    "ground-storey",
  ),
];

const communalPartitionElements = (): IAutoMovieBuiltElement[] => [
  boxElement(
    "partition/communal-south-jamb",
    "room-loop-partition",
    bounds(-7.4, 0, -3.2, -7, 3.6, -0.55),
    "stone",
    "ground-storey",
  ),
  boxElement(
    "partition/communal-north-jamb",
    "room-loop-partition",
    bounds(-7.4, 0, 0.55, -7, 3.6, 3.2),
    "stone",
    "ground-storey",
  ),
  boxElement(
    "partition/communal-lintel",
    "room-loop-lintel",
    bounds(-7.4, 2.1, -0.55, -7, 3.6, 0.55),
    "stone",
    "ground-storey",
  ),
];

const eastRoomDoorElements = (): IAutoMovieBuiltElement[] => [
  boxElement(
    "partition/administration-south-jamb",
    "room-loop-partition",
    bounds(7, 0, 2.6, 7.4, 3.6, 3.35),
    "stone",
    "ground-storey",
  ),
  boxElement(
    "partition/administration-north-jamb",
    "room-loop-partition",
    bounds(7, 0, 4.45, 7.4, 3.6, 5.2),
    "stone",
    "ground-storey",
  ),
  boxElement(
    "partition/administration-lintel",
    "room-loop-lintel",
    bounds(7, 2.1, 3.35, 7.4, 3.6, 4.45),
    "stone",
    "ground-storey",
  ),
  boxElement(
    "partition/records-south-jamb",
    "room-loop-partition",
    bounds(7, 0, -0.3, 7.4, 3.6, 0.45),
    "stone",
    "ground-storey",
  ),
  boxElement(
    "partition/records-north-jamb",
    "room-loop-partition",
    bounds(7, 0, 1.55, 7.4, 3.6, 2.3),
    "stone",
    "ground-storey",
  ),
  boxElement(
    "partition/records-lintel",
    "room-loop-lintel",
    bounds(7, 2.1, 0.45, 7.4, 3.6, 1.55),
    "stone",
    "ground-storey",
  ),
  boxElement(
    "partition/storage-south-jamb",
    "room-loop-partition",
    bounds(7, 0, -5.2, 7.4, 3.6, -3.5),
    "stone",
    "ground-storey",
  ),
  boxElement(
    "partition/storage-north-jamb",
    "room-loop-partition",
    bounds(7, 0, -2.4, 7.4, 3.6, -0.7),
    "stone",
    "ground-storey",
  ),
  boxElement(
    "partition/storage-lintel",
    "room-loop-lintel",
    bounds(7, 2.1, -3.5, 7.4, 3.6, -2.4),
    "stone",
    "ground-storey",
  ),
];

const eastSeparatorElements = (): IAutoMovieBuiltElement[] => [
  boxElement(
    "separator/east-admin-records",
    "east-room-separator",
    bounds(7.4, 0, 2.3, 11.4, 3.6, 2.6),
    "stone",
    "ground-storey",
  ),
  boxElement(
    "separator/east-records-storage",
    "east-room-separator",
    bounds(7.4, 0, -0.7, 11.4, 3.6, -0.3),
    "stone",
    "ground-storey",
  ),
];

const roofElements = (): IAutoMovieBuiltElement[] => [
  boxElement(
    "roof/south-cover",
    "roof-cover",
    bounds(-12, 3.6, -9, 12, 3.8, -3.6),
    "roof",
    "building",
  ),
  boxElement(
    "roof/north-cover",
    "roof-cover",
    bounds(-12, 3.6, 3.6, 12, 3.8, 9),
    "roof",
    "building",
  ),
  boxElement(
    "roof/west-cover",
    "roof-cover",
    bounds(-12, 3.6, -3.6, -5, 3.8, 3.6),
    "roof",
    "building",
  ),
  boxElement(
    "roof/east-cover",
    "roof-cover",
    bounds(5, 3.6, -3.6, 12, 3.8, 3.6),
    "roof",
    "building",
  ),
];

const floorElements = (): IAutoMovieBuiltElement[] => [
  boxElement(
    "floor/entry-threshold",
    "floor",
    bounds(-11.4, -0.1, -8.4, 11.4, 0, -5.6),
    "floor",
    "entry-threshold",
  ),
  boxElement(
    "floor/courtyard",
    "floor",
    bounds(-5, -0.1, -3.6, 5, 0, 3.6),
    "courtyard",
    "courtyard",
  ),
  boxElement(
    "floor/loop-south",
    "floor",
    bounds(-7, -0.1, -5.6, 7, 0, -3.6),
    "floor",
    "colonnade-loop",
  ),
  boxElement(
    "floor/loop-north",
    "floor",
    bounds(-7, -0.1, 3.6, 7, 0, 5.6),
    "floor",
    "colonnade-loop",
  ),
  boxElement(
    "floor/loop-west",
    "floor",
    bounds(-7, -0.1, -3.6, -5, 0, 3.6),
    "floor",
    "colonnade-loop",
  ),
  boxElement(
    "floor/loop-east",
    "floor",
    bounds(5, -0.1, -3.6, 7, 0, 3.6),
    "floor",
    "colonnade-loop",
  ),
  boxElement(
    "floor/sanctuary",
    "floor",
    bounds(-3.2, -0.1, 6, 3.2, 0, 8.4),
    "floor",
    "sanctuary",
  ),
  boxElement(
    "floor/communal-votive",
    "floor",
    bounds(-11.4, -0.1, -3.2, -7.4, 0, 3.2),
    "floor",
    "communal-votive-room",
  ),
  boxElement(
    "floor/administration",
    "floor",
    bounds(7.4, -0.1, 2.6, 11.4, 0, 5.2),
    "floor",
    "administration-room",
  ),
  boxElement(
    "floor/records",
    "floor",
    bounds(7.4, -0.1, -0.3, 11.4, 0, 2.3),
    "floor",
    "records-room",
  ),
  boxElement(
    "floor/votive-storage",
    "floor",
    bounds(7.4, -0.1, -5.2, 11.4, 0, -0.7),
    "floor",
    "votive-storage-room",
  ),
  boxElement(
    "floor/service-yard",
    "floor",
    bounds(12.4, -0.1, 5.4, 15.2, 0, 8.2),
    "earth",
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
  semanticElement("fountain/socket", "fountain-socket", "courtyard"),
];

const observationAnchorData = [
  {
    room: "sanctuary",
    points: [
      ["threshold", vector(0, 0, 6)],
      ["center", vector(0, 0, 7.2)],
      ["north", vector(0, 0, 8.1)],
      ["east", vector(2.3, 0, 7.2)],
      ["south", vector(0, 0, 6.3)],
      ["west", vector(-2.3, 0, 7.2)],
    ],
  },
  {
    room: "communal-votive-room",
    points: [
      ["threshold", vector(-7.4, 0, 0)],
      ["center", vector(-9.4, 0, 0)],
      ["north", vector(-9.4, 0, 2.3)],
      ["east", vector(-8.3, 0, 0)],
      ["south", vector(-9.4, 0, -2.3)],
      ["west", vector(-10.5, 0, 0)],
    ],
  },
  {
    room: "administration-room",
    points: [
      ["threshold", vector(7.4, 0, 3.9)],
      ["center", vector(9.4, 0, 3.9)],
      ["north", vector(9.4, 0, 4.8)],
      ["east", vector(10.3, 0, 3.9)],
      ["south", vector(9.4, 0, 3)],
      ["west", vector(8.5, 0, 3.9)],
    ],
  },
  {
    room: "records-room",
    points: [
      ["threshold", vector(7.4, 0, 1)],
      ["center", vector(9.4, 0, 1)],
      ["north", vector(9.4, 0, 1.8)],
      ["east", vector(10.3, 0, 1)],
      ["south", vector(9.4, 0, 0.2)],
      ["west", vector(8.5, 0, 1)],
    ],
  },
  {
    room: "votive-storage-room",
    points: [
      ["threshold", vector(7.4, 0, -2.95)],
      ["center", vector(9.4, 0, -2.95)],
      ["north", vector(9.4, 0, -1.85)],
      ["east", vector(10.3, 0, -2.95)],
      ["south", vector(9.4, 0, -4.05)],
      ["west", vector(8.5, 0, -2.95)],
    ],
  },
] as const;

const observationAnchorElements = (): IAutoMovieBuiltElement[] => observationAnchorData.flatMap((room) =>
  room.points.map(([name, position]) => semanticElement(
    `route-anchor/${room.room}/${name}`,
    "observation-route-anchor",
    room.room,
    position,
  )),
);

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
  width: number,
  clearHeight: number,
  elements: string[],
): IAutoMovieBuiltConnector => ({
  id,
  kind: "passage",
  from,
  to,
  bidirectional: true,
  route,
  width,
  clearHeight,
  elements,
});

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
    ["fountain/socket"],
  ),
  passage(
    "door-sanctuary",
    "colonnade-loop",
    "sanctuary",
    [vector(0, 0, 5.6), vector(0, 0, 6)],
    1.1,
    2.1,
    ["opening/sanctuary-door"],
  ),
  passage(
    "door-communal-votive",
    "colonnade-loop",
    "communal-votive-room",
    [vector(-7, 0, 0), vector(-7.4, 0, 0)],
    1.1,
    2.1,
    ["opening/communal-door"],
  ),
  passage(
    "door-administration",
    "colonnade-loop",
    "administration-room",
    [vector(7, 0, 3.9), vector(7.4, 0, 3.9)],
    1.1,
    2.1,
    ["opening/administration-door"],
  ),
  passage(
    "door-records",
    "colonnade-loop",
    "records-room",
    [vector(7, 0, 1), vector(7.4, 0, 1)],
    1.1,
    2.1,
    ["opening/records-door"],
  ),
  passage(
    "door-votive-storage",
    "colonnade-loop",
    "votive-storage-room",
    [vector(7, 0, -2.95), vector(7.4, 0, -2.95)],
    1.1,
    2.1,
    ["opening/votive-storage-door"],
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
  floorSurface("surface/courtyard-floor", "courtyard", plan(-5, -3.6, 5, 3.6)),
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

/** Deterministic space source for the reviewed civic temple spatial graph. */
export const ancientCivicTempleSpaceSource: IAutoMovieLibrarySourceOwner = {
  design: "docs/spaces/temple.md#one-storey-civic-temple-graph",
  build: () => ({
    environments: [ancientCivicTempleEnvironment()],
    models: [],
  }),
};
