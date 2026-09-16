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
import {
  modernSuburbanHouse,
  type Element,
  type MaterialId,
  type Opening,
  type Space,
  type Storey,
} from "../house";

const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

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

const rotationFor = (pitchDeg: number, yawDeg: number, rollDeg: number): IAutoMovieQuaternion => {
  const pitch = (pitchDeg * Math.PI) / 360;
  const yaw = (yawDeg * Math.PI) / 360;
  const roll = (rollDeg * Math.PI) / 360;
  const sinPitch = Math.sin(pitch);
  const cosPitch = Math.cos(pitch);
  const sinYaw = Math.sin(yaw);
  const cosYaw = Math.cos(yaw);
  const sinRoll = Math.sin(roll);
  const cosRoll = Math.cos(roll);
  const pitchRotation = {
    x: sinPitch * cosYaw,
    y: cosPitch * sinYaw,
    z: sinPitch * sinYaw,
    w: cosPitch * cosYaw,
  };
  const rollRotation = { x: 0, y: 0, z: sinRoll, w: cosRoll };
  return {
    x: pitchRotation.w * rollRotation.x + pitchRotation.x * rollRotation.w + pitchRotation.y * rollRotation.z - pitchRotation.z * rollRotation.y,
    y: pitchRotation.w * rollRotation.y - pitchRotation.x * rollRotation.z + pitchRotation.y * rollRotation.w + pitchRotation.z * rollRotation.x,
    z: pitchRotation.w * rollRotation.z + pitchRotation.x * rollRotation.y - pitchRotation.y * rollRotation.x + pitchRotation.z * rollRotation.w,
    w: pitchRotation.w * rollRotation.w - pitchRotation.x * rollRotation.x - pitchRotation.y * rollRotation.y - pitchRotation.z * rollRotation.z,
  };
};

const color = (hex: string, r: number, g: number, b: number): IAutoMovieColor => ({
  r,
  g,
  b,
  a: 1,
  hex,
});

const MATERIAL_COLORS: Record<MaterialId, IAutoMovieColor> = {
  "paint-warm-white": color("#eee9df", 0.87, 0.84, 0.78),
  "siding-white": color("#e4e1d8", 0.82, 0.81, 0.77),
  "brick-red-brown": color("#8b5844", 0.45, 0.24, 0.16),
  "roof-charcoal": color("#34383a", 0.08, 0.09, 0.1),
  "trim-white": color("#f6f2e9", 0.94, 0.92, 0.86),
  "glass-smoke": color("#6e7a7a", 0.25, 0.32, 0.32),
  "door-walnut": color("#5e3825", 0.24, 0.12, 0.07),
  "metal-black": color("#202426", 0.04, 0.05, 0.05),
  "wood-oak": color("#b58452", 0.5, 0.3, 0.13),
  "wood-walnut": color("#70442c", 0.3, 0.16, 0.09),
  "carpet-warm-gray": color("#aaa59a", 0.42, 0.4, 0.35),
  "tile-pale": color("#d7d1c4", 0.68, 0.64, 0.55),
  "concrete-cool-gray": color("#8b8c88", 0.38, 0.39, 0.37),
  "cabinet-taupe": color("#9d8e7e", 0.46, 0.38, 0.3),
  "stone-pale": color("#d2cbbd", 0.66, 0.62, 0.54),
  "fabric-oatmeal": color("#b4a590", 0.52, 0.43, 0.32),
  "fabric-blue-gray": color("#71808b", 0.22, 0.3, 0.36),
  greenery: color("#5c7148", 0.16, 0.28, 0.1),
};

const materialFor = (id: MaterialId): IAutoMovieMaterial => ({
  id: `material/${id}`,
  name: id,
  baseColor: MATERIAL_COLORS[id],
  metallic: id === "metal-black" ? 0.72 : 0,
  roughness: id === "glass-smoke" ? 0.18 : 0.7,
  emissive: null,
  opacity: 1,
  alphaMode: "opaque",
  doubleSided: true,
  baseColorTexture: null,
});

const modelFor = (id: MaterialId): IAutoMovieModel => {
  const material = materialFor(id);
  return {
    id: `model/${id}`,
    name: id,
    origin: "generated",
    skeleton: null,
    materials: [material],
    parts: [
      {
        id: `model/${id}/unit-box`,
        name: "unit box",
        geometry: { type: "primitive", shape: { type: "box", width: 1, height: 1, depth: 1 } },
        material: material.id,
        attachedBone: null,
        transform: null,
      },
    ],
    asset: null,
    body: null,
  };
};

const BOX_MATERIALS = Object.keys(MATERIAL_COLORS) as MaterialId[];

const partElement = (
  parent: Element,
  part: Element["parts"][number],
): IAutoMovieBuiltElement => ({
  id: `${parent.id}/${part.id}`,
  kind: part.tags[0] ?? parent.layer,
  parent: "building/root",
  transform: transform(
    vector(part.center.x, part.center.y, part.center.z),
    vector(part.size.x, part.size.y, part.size.z),
    rotationFor(part.pitchDeg, part.rotationYDeg, part.rollDeg),
  ),
  model: `model/${part.material}`,
  space: parent.spaceId,
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
  ...modernSuburbanHouse.building.elements.flatMap((item) =>
    item.parts.map((part) => partElement(item, part)),
  ),
  ...modernSuburbanHouse.site.elements.flatMap((item) =>
    item.parts.map((part) => partElement(item, part)),
  ),
];

const boxCell = (id: string, min: IAutoMovieVector3, max: IAutoMovieVector3) => ({
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

const builtSpace = (item: Space, parent: string): IAutoMovieBuiltSpace => ({
  id: item.id,
  kind: "room",
  parent,
  cells: [boxCell(`${item.id}/cell`, vector(item.bounds.min.x, item.bounds.min.y, item.bounds.min.z), vector(item.bounds.max.x, item.bounds.max.y, item.bounds.max.z))],
});

const builtStorey = (item: Storey): IAutoMovieBuiltSpace => ({
  id: item.id,
  kind: "storey",
  parent: "building",
  cells: [boxCell(`${item.id}/cell`, vector(item.bounds.min.x, item.bounds.min.y, item.bounds.min.z), vector(item.bounds.max.x, item.bounds.max.y, item.bounds.max.z))],
});

const environmentSpaces = (): IAutoMovieBuiltSpace[] => [
  {
    id: "building",
    kind: "building",
    parent: null,
    cells: [boxCell(
      "building/cell",
      vector(modernSuburbanHouse.building.envelope.min.x, modernSuburbanHouse.building.envelope.min.y, modernSuburbanHouse.building.envelope.min.z),
      vector(modernSuburbanHouse.building.envelope.max.x, modernSuburbanHouse.building.envelope.max.y, modernSuburbanHouse.building.envelope.max.z),
    )],
  },
  ...modernSuburbanHouse.building.storeys.map(builtStorey),
  ...modernSuburbanHouse.building.spaces.map((item) => builtSpace(item, item.storeyId)),
];

const boundaryKind = (opening: Opening): string =>
  opening.toSpaceId === null
    ? opening.kind === "window" || opening.kind === "slider"
      ? "exterior-curtainwall"
      : "exterior-threshold"
    : "passage";

const environmentBoundaries = (): IAutoMovieBuiltBoundary[] =>
  modernSuburbanHouse.building.openings.map((opening) => ({
    id: `boundary/${opening.id}`,
    kind: boundaryKind(opening),
    spaces: [opening.fromSpaceId ?? "building", opening.toSpaceId ?? "building"],
    elements: [`opening/${opening.id}`],
  }));

const environmentOpenings = (): IAutoMovieBuiltOpening[] =>
  modernSuburbanHouse.building.openings.map((opening) => {
    const source = modernSuburbanHouse.building.elements.find(
      (item) => item.id === `opening/${opening.id}`,
    );
    return {
      id: opening.id,
      kind: opening.kind,
      boundary: `boundary/${opening.id}`,
      fill: source?.parts[0] === undefined
        ? null
        : `${source.id}/${source.parts[0].id}`,
    };
  });

const pairKey = (from: string, to: string): string => [from, to].sort((left, right) => left.localeCompare(right)).join("::");

const horizontalDirection = (from: IAutoMovieVector3, to: IAutoMovieVector3): IAutoMovieVector3 => {
  const deltaX = to.x - from.x;
  const deltaZ = to.z - from.z;
  return Math.abs(deltaX) >= Math.abs(deltaZ)
    ? vector(Math.sign(deltaX) || 1, 0, 0)
    : vector(0, 0, Math.sign(deltaZ) || 1);
};

const passageRoute = (
  opening: Opening,
  from: Space,
  to: Space,
): IAutoMovieVector3[] => {
  const floorY = Math.max(from.bounds.min.y, to.bounds.min.y) + 0.1;
  const center = vector(opening.center.x, floorY, opening.center.z);
  const fromDirection = horizontalDirection(
    center,
    vector(
      (from.bounds.min.x + from.bounds.max.x) / 2,
      floorY,
      (from.bounds.min.z + from.bounds.max.z) / 2,
    ),
  );
  const toDirection = horizontalDirection(
    center,
    vector(
      (to.bounds.min.x + to.bounds.max.x) / 2,
      floorY,
      (to.bounds.min.z + to.bounds.max.z) / 2,
    ),
  );
  return [
    vector(center.x + fromDirection.x * 0.45, floorY, center.z + fromDirection.z * 0.45),
    center,
    vector(center.x + toDirection.x * 0.45, floorY, center.z + toDirection.z * 0.45),
  ];
};

const environmentConnectors = (): IAutoMovieBuiltConnector[] => {
  const connectors: IAutoMovieBuiltConnector[] = [];
  const seen = new Set<string>();
  const spaceById = new Map(modernSuburbanHouse.building.spaces.map((item) => [item.id, item]));
  for (const opening of modernSuburbanHouse.building.openings) {
    if (opening.fromSpaceId === null || opening.toSpaceId === null) continue;
    const from = spaceById.get(opening.fromSpaceId);
    const to = spaceById.get(opening.toSpaceId);
    if (from === undefined || to === undefined || from.storeyId !== to.storeyId) continue;
    const key = pairKey(from.id, to.id);
    if (seen.has(key)) continue;
    seen.add(key);
    connectors.push({
      id: `passage/${opening.id}`,
      kind: "passage",
      from: from.id,
      to: to.id,
      bidirectional: true,
      route: passageRoute(opening, from, to),
      width: opening.width,
      clearHeight: opening.height,
      elements: [`opening/${opening.id}`],
    });
  }
  connectors.push({
    id: modernSuburbanHouse.building.stairConnector.id,
    kind: "stair",
    from: modernSuburbanHouse.building.stairConnector.fromSpaceId,
    to: modernSuburbanHouse.building.stairConnector.toSpaceId,
    bidirectional: true,
    route: [...modernSuburbanHouse.building.stairConnector.route],
    orientations: [IDENTITY, IDENTITY, IDENTITY],
    width: 1.05,
    clearHeight: 2.1,
    steps: { count: modernSuburbanHouse.building.stairConnector.stepCount, rise: modernSuburbanHouse.building.stairConnector.riseM, run: 0.255 },
    elements: ["stair/single-l-turn"],
  });
  return connectors;
};

const environmentSurfaces = (): IAutoMovieBuiltSurface[] =>
  modernSuburbanHouse.building.spaces.map((item) => ({
    space: item.id,
    surface: {
      id: `surface/${item.id}`,
      kind: "floor",
      polygon: [
        vector(item.bounds.min.x, item.bounds.min.y, item.bounds.min.z),
        vector(item.bounds.max.x, item.bounds.min.y, item.bounds.min.z),
        vector(item.bounds.max.x, item.bounds.min.y, item.bounds.max.z),
        vector(item.bounds.min.x, item.bounds.min.y, item.bounds.max.z),
      ],
      height: { kind: "constant", value: item.bounds.min.y },
    },
  }));

const modernSuburbanHouseEnvironment = (): IAutoMovieBuiltEnvironment => ({
  version: 1,
  id: modernSuburbanHouse.id,
  units: "meter",
  buildings: [{ id: modernSuburbanHouse.building.id, element: "building/root", space: "building" }],
  models: BOX_MATERIALS.map((id) => modelFor(id)),
  modelReferences: [],
  elements: environmentElements(),
  populations: [],
  spaces: environmentSpaces(),
  boundaries: environmentBoundaries(),
  openings: environmentOpenings(),
  connectors: environmentConnectors(),
  surfaces: environmentSurfaces(),
  walkable: environmentSurfaces().map((item) => item.surface.id),
});

/** Deterministic AutoMovie source owner for the complete modern suburban house. */
export const modernSuburbanHouseSpaceSource: IAutoMovieLibrarySourceOwner = {
  design: "docs/spaces/house.md#building-and-storeys",
  build: () => ({
    environments: [modernSuburbanHouseEnvironment()],
    models: [],
  }),
};
