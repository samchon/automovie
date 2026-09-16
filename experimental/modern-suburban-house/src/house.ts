/**
 * Deterministic authored source for the modern suburban house library.
 *
 * The source keeps the authored decisions in metres and derives repeated
 * envelope populations from measured extents. It is intentionally a compact
 * building description: a consuming adapter can lower these bounded parts to
 * the installed AutoMovie architecture API without introducing another design
 * owner or a serialized project store.
 */

export type MaterialId =
  | "paint-warm-white"
  | "siding-white"
  | "brick-red-brown"
  | "roof-charcoal"
  | "trim-white"
  | "glass-smoke"
  | "door-walnut"
  | "metal-black"
  | "wood-oak"
  | "wood-walnut"
  | "carpet-warm-gray"
  | "tile-pale"
  | "concrete-cool-gray"
  | "cabinet-taupe"
  | "stone-pale"
  | "fabric-oatmeal"
  | "fabric-blue-gray"
  | "greenery";

export type PartShape = "box" | "slab" | "triangle" | "cylinder";

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface Bounds {
  readonly min: Vec3;
  readonly max: Vec3;
}

export interface Part {
  readonly id: string;
  readonly shape: PartShape;
  readonly center: Vec3;
  readonly size: Vec3;
  readonly material: MaterialId;
  readonly rotationYDeg: number;
  readonly pitchDeg: number;
  readonly rollDeg: number;
  readonly tags: readonly string[];
}

export type OpeningKind = "door" | "window" | "slider" | "garage-door";

export interface Opening {
  readonly id: string;
  readonly hostElementId: string;
  readonly kind: OpeningKind;
  readonly axis: "x" | "z";
  readonly center: Vec3;
  readonly width: number;
  readonly sillM: number;
  readonly height: number;
  readonly fromSpaceId: string | null;
  readonly toSpaceId: string | null;
}

export interface Element {
  readonly id: string;
  readonly storeyId: string | null;
  readonly spaceId: string | null;
  readonly surfaceOwnerId: string;
  readonly layer: "site" | "envelope" | "opening" | "module" | "fit-out";
  readonly parts: readonly Part[];
}

export interface Space {
  readonly id: string;
  readonly storeyId: string;
  readonly kind:
    | "entry"
    | "living"
    | "stair-hall"
    | "open-common"
    | "pantry"
    | "powder"
    | "laundry-mudroom"
    | "garage"
    | "upper-hall"
    | "primary-bedroom"
    | "bedroom"
    | "bathroom"
    | "storage";
  readonly bounds: Bounds;
  readonly surfaceOwnerId: string;
  readonly thresholdIds: readonly string[];
  readonly adjacentSpaceIds: readonly string[];
  readonly floorMaterial: MaterialId;
}

export interface Storey {
  readonly id: string;
  readonly level: 0 | 1;
  readonly elevationM: number;
  readonly clearHeightM: number;
  readonly bounds: Bounds;
  readonly spaceIds: readonly string[];
  readonly elementIds: readonly string[];
}

export interface SurfaceOwner {
  readonly id: string;
  readonly scope: "elevation" | "roof" | "storey" | "room";
  readonly completeSurface: string;
  readonly stage: "massing" | "envelope" | "modules" | "fit-out" | "finish";
}

export interface ModuleLaw {
  readonly id: string;
  readonly hostSurfaceOwnerId: string;
  readonly family: "siding" | "brick" | "shingle";
  readonly measuredLengthM: number;
  readonly measuredHeightM: number;
  readonly spacingM: number;
  readonly count: number;
  readonly staggerRule: "none" | "alternate-half-module" | "corner-return";
}

export interface Site {
  readonly boundary: Bounds;
  readonly streetEdgeZ: number;
  readonly elements: readonly Element[];
}

export interface Building {
  readonly id: string;
  readonly envelope: Bounds;
  readonly storeys: readonly Storey[];
  readonly spaces: readonly Space[];
  readonly elements: readonly Element[];
  readonly openings: readonly Opening[];
  readonly surfaceOwners: readonly SurfaceOwner[];
  readonly stairConnector: {
    readonly id: string;
    readonly fromSpaceId: string;
    readonly toSpaceId: string;
    readonly route: readonly Vec3[];
    readonly stepCount: number;
    readonly riseM: number;
    readonly turnCount: 1;
  };
}

export interface ReviewObservation {
  readonly id: string;
  readonly subjectId: string;
  readonly kind:
    | "setting"
    | "elevation"
    | "corner"
    | "roof"
    | "opening"
    | "threshold"
    | "room-corner"
    | "room-cardinal";
  readonly position: Vec3;
  readonly direction: Vec3;
}

export interface AuditResult {
  readonly ok: boolean;
  readonly issues: readonly string[];
}

export interface HouseLibrary {
  readonly id: "modern-suburban-house";
  readonly site: Site;
  readonly building: Building;
  readonly moduleLaws: readonly ModuleLaw[];
  readonly reviewPopulation: readonly ReviewObservation[];
  readonly topologyAudit: AuditResult;
  readonly surfaceAudit: AuditResult;
  readonly siteAudit: AuditResult;
  readonly vehicleAudit: AuditResult;
  readonly quantities: {
    readonly mainFootprintM2: number;
    readonly garageFootprintM2: number;
    readonly grossTargetM2: number;
    readonly elementCount: number;
    readonly openingCount: number;
    readonly roomCount: number;
  };
}

const MAIN = {
  minX: -5.5,
  maxX: 5.5,
  minZ: -4.8,
  maxZ: 4.8,
};

const GARAGE = {
  minX: 5.5,
  maxX: 11.3,
  minZ: -4.8,
  maxZ: 1.4,
};

const WALL = 0.18;
const PARTITION = 0.12;
const GROUND_ELEVATION = 0;
const UPPER_ELEVATION = 2.93;
const GROUND_HEIGHT = 2.65;
const UPPER_HEIGHT = 2.55;

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

const box = (
  id: string,
  center: Vec3,
  size: Vec3,
  material: MaterialId,
  tags: readonly string[] = [],
  shape: PartShape = "box",
  rotationYDeg = 0,
  pitchDeg = 0,
  rollDeg = 0,
): Part => ({
  id,
  shape,
  center,
  size,
  material,
  rotationYDeg,
  pitchDeg,
  rollDeg,
  tags,
});

const extent = (center: Vec3, size: Vec3): Bounds => ({
  min: v(
    center.x - size.x / 2,
    center.y - size.y / 2,
    center.z - size.z / 2,
  ),
  max: v(
    center.x + size.x / 2,
    center.y + size.y / 2,
    center.z + size.z / 2,
  ),
});

const rotatePartPoint = (point: Vec3, part: Part): Vec3 => {
  const pitch = (part.pitchDeg * Math.PI) / 180;
  const yaw = (part.rotationYDeg * Math.PI) / 180;
  const roll = (part.rollDeg * Math.PI) / 180;
  const yawX = point.x * Math.cos(yaw) - point.z * Math.sin(yaw);
  const yawZ = point.x * Math.sin(yaw) + point.z * Math.cos(yaw);
  const pitched = {
    x: yawX,
    y: point.y * Math.cos(pitch) - yawZ * Math.sin(pitch),
    z: point.y * Math.sin(pitch) + yawZ * Math.cos(pitch),
  };
  return {
    x: pitched.x * Math.cos(roll) - pitched.y * Math.sin(roll),
    y: pitched.x * Math.sin(roll) + pitched.y * Math.cos(roll),
    z: pitched.z,
  };
};

const partExtent = (part: Part): Bounds => {
  const points: Vec3[] = [];
  for (const x of [-0.5, 0.5]) {
    for (const y of [-0.5, 0.5]) {
      for (const z of [-0.5, 0.5]) {
        const rotated = rotatePartPoint(v(x * part.size.x, y * part.size.y, z * part.size.z), part);
        points.push(v(part.center.x + rotated.x, part.center.y + rotated.y, part.center.z + rotated.z));
      }
    }
  }
  return points.reduce(
    (current, point) => ({
      min: v(
        Math.min(current.min.x, point.x),
        Math.min(current.min.y, point.y),
        Math.min(current.min.z, point.z),
      ),
      max: v(
        Math.max(current.max.x, point.x),
        Math.max(current.max.y, point.y),
        Math.max(current.max.z, point.z),
      ),
    }),
    { min: points[0], max: points[0] },
  );
};

const unionBounds = (parts: readonly Part[]): Bounds => {
  if (parts.length === 0) {
    return { min: v(0, 0, 0), max: v(0, 0, 0) };
  }
  const first = partExtent(parts[0]);
  return parts.slice(1).reduce(
    (current, part) => {
      const next = partExtent(part);
      return {
        min: v(
          Math.min(current.min.x, next.min.x),
          Math.min(current.min.y, next.min.y),
          Math.min(current.min.z, next.min.z),
        ),
        max: v(
          Math.max(current.max.x, next.max.x),
          Math.max(current.max.y, next.max.y),
          Math.max(current.max.z, next.max.z),
        ),
      };
    },
    first,
  );
};

const element = (
  id: string,
  storeyId: string | null,
  spaceId: string | null,
  surfaceOwnerId: string,
  layer: Element["layer"],
  parts: readonly Part[],
): Element => ({ id, storeyId, spaceId, surfaceOwnerId, layer, parts });

const space = (
  id: string,
  storeyId: string,
  kind: Space["kind"],
  min: Vec3,
  max: Vec3,
  floorMaterial: MaterialId,
  thresholdIds: readonly string[],
  adjacentSpaceIds: readonly string[],
): Space => ({
  id,
  storeyId,
  kind,
  bounds: { min, max },
  surfaceOwnerId: `surface.space.${id}`,
  thresholdIds,
  adjacentSpaceIds,
  floorMaterial,
});

interface OpeningSpec {
  readonly id: string;
  readonly kind: OpeningKind;
  readonly centerAlongAxis: number;
  readonly width: number;
  readonly sillM: number;
  readonly height: number;
  readonly fromSpaceId: string | null;
  readonly toSpaceId: string | null;
}

interface WallSpec {
  readonly id: string;
  readonly storeyId: string;
  readonly surfaceOwnerId: string;
  readonly axis: "x" | "z";
  readonly fixedCoordinate: number;
  readonly start: number;
  readonly end: number;
  readonly bottomM: number;
  readonly topM: number;
  readonly thicknessM: number;
  readonly openings: readonly OpeningSpec[];
}

const wallParts = (spec: WallSpec): Part[] => {
  const openings = [...spec.openings].sort(
    (a, b) => a.centerAlongAxis - b.centerAlongAxis,
  );
  const parts: Part[] = [];
  const addSpan = (start: number, end: number, bottom: number, top: number): void => {
    if (end <= start || top <= bottom) return;
    parts.push(
      box(
        `${spec.id}.solid.${parts.length}`,
        spec.axis === "x"
          ? v((start + end) / 2, (bottom + top) / 2, spec.fixedCoordinate)
          : v(spec.fixedCoordinate, (bottom + top) / 2, (start + end) / 2),
        spec.axis === "x"
          ? v(end - start, top - bottom, spec.thicknessM)
          : v(spec.thicknessM, top - bottom, end - start),
        "siding-white",
        ["wall", "opening-clear"],
      ),
    );
  };
  let cursor = spec.start;
  for (const opening of openings) {
    const openingStart = opening.centerAlongAxis - opening.width / 2;
    addSpan(cursor, openingStart, spec.bottomM, spec.topM);
    addSpan(
      openingStart,
      opening.centerAlongAxis + opening.width / 2,
      spec.bottomM,
      spec.bottomM + opening.sillM,
    );
    addSpan(
      openingStart,
      opening.centerAlongAxis + opening.width / 2,
      spec.bottomM + opening.sillM + opening.height,
      spec.topM,
    );
    cursor = opening.centerAlongAxis + opening.width / 2;
  }
  addSpan(cursor, spec.end, spec.bottomM, spec.topM);
  return parts;
};

const wallOpenings = (spec: WallSpec): Opening[] =>
  spec.openings.map((opening) => ({
    id: opening.id,
    hostElementId: spec.id,
    kind: opening.kind,
    axis: spec.axis,
    center:
      spec.axis === "x"
        ? v(
            opening.centerAlongAxis,
            spec.bottomM + opening.sillM + opening.height / 2,
            spec.fixedCoordinate,
          )
        : v(
            spec.fixedCoordinate,
            spec.bottomM + opening.sillM + opening.height / 2,
            opening.centerAlongAxis,
          ),
    width: opening.width,
    sillM: opening.sillM,
    height: opening.height,
    fromSpaceId: opening.fromSpaceId,
    toSpaceId: opening.toSpaceId,
  }));

const openingParts = (opening: Opening): Part[] => {
  const frame = opening.kind === "door" || opening.kind === "garage-door"
    ? 0.09
    : 0.07;
  const depth = 0.11;
  const frameMaterial = opening.kind === "door" ? "trim-white" : "metal-black";
  const panelMaterial = opening.kind === "door"
    ? "door-walnut"
    : opening.kind === "garage-door"
      ? "metal-black"
      : "glass-smoke";
  const horizontal = opening.axis === "x";
  const width = opening.width;
  const height = opening.height;
  const center = opening.center;
  const pieces: Part[] = [
    box(
      `${opening.id}.frame.left`,
      horizontal
        ? v(center.x - width / 2 + frame / 2, center.y, center.z)
        : v(center.x, center.y, center.z - width / 2 + frame / 2),
      horizontal ? v(frame, height, depth) : v(depth, height, frame),
      frameMaterial,
      ["opening-frame"],
    ),
    box(
      `${opening.id}.frame.right`,
      horizontal
        ? v(center.x + width / 2 - frame / 2, center.y, center.z)
        : v(center.x, center.y, center.z + width / 2 - frame / 2),
      horizontal ? v(frame, height, depth) : v(depth, height, frame),
      frameMaterial,
      ["opening-frame"],
    ),
    box(
      `${opening.id}.frame.head`,
      horizontal
        ? v(center.x, center.y + height / 2 - frame / 2, center.z)
        : v(center.x, center.y + height / 2 - frame / 2, center.z),
      horizontal ? v(width, frame, depth) : v(depth, frame, width),
      frameMaterial,
      ["opening-frame"],
    ),
  ];
  if (opening.kind === "window" || opening.kind === "slider") {
    pieces.push(
      box(
        `${opening.id}.glass`,
        center,
        horizontal
          ? v(width - frame * 2, height - frame * 2, 0.03)
          : v(0.03, height - frame * 2, width - frame * 2),
        panelMaterial,
        ["glazing"],
      ),
    );
  } else {
    pieces.push(
      box(
        `${opening.id}.panel`,
        center,
        horizontal
          ? v(width - frame * 2, height - frame, 0.06)
          : v(0.06, height - frame, width - frame * 2),
        panelMaterial,
        ["operable-panel"],
      ),
    );
  }
  return pieces;
};

const makeWall = (spec: WallSpec): { element: Element; openings: Opening[] } => {
  const openings = wallOpenings(spec);
  return {
    element: element(
      spec.id,
      spec.storeyId,
      null,
      spec.surfaceOwnerId,
      "envelope",
      wallParts(spec),
    ),
    openings,
  };
};

const partitionWithOpenings = (
  id: string,
  storeyId: string,
  spaceId: string,
  axis: "x" | "z",
  fixedCoordinate: number,
  start: number,
  end: number,
  bottomM: number,
  topM: number,
  openings: readonly OpeningSpec[],
): { element: Element; openings: Opening[] } => {
  const spec: WallSpec = {
    id,
    storeyId,
    surfaceOwnerId: `surface.space.${spaceId}`,
    axis,
    fixedCoordinate,
    start,
    end,
    bottomM,
    topM,
    thicknessM: PARTITION,
    openings,
  };
  return {
    element: element(
      id,
      storeyId,
      spaceId,
      spec.surfaceOwnerId,
      "envelope",
      wallParts(spec).map((part) => ({ ...part, material: "paint-warm-white" as const })),
    ),
    openings: wallOpenings(spec),
  };
};

const slab = (
  id: string,
  storeyId: string | null,
  spaceId: string | null,
  owner: string,
  center: Vec3,
  size: Vec3,
  material: MaterialId,
  tags: readonly string[] = [],
): Element =>
  element(id, storeyId, spaceId, owner, "envelope", [box(id, center, size, material, tags)]);

const furniture = (
  id: string,
  storeyId: string | null,
  spaceId: string | null,
  parts: readonly Part[],
): Element =>
  element(
    id,
    storeyId,
    spaceId,
    spaceId ? `surface.space.${spaceId}` : "surface.elevation.front",
    storeyId ? "fit-out" : "site",
    parts,
  );

const simpleFurniture = (
  id: string,
  storeyId: string | null,
  spaceId: string | null,
  center: Vec3,
  size: Vec3,
  material: MaterialId,
  tags: readonly string[] = [],
): Element => furniture(id, storeyId, spaceId, [box(id, center, size, material, tags)]);

const groundSpaces = (): Space[] => [
  space(
    "ground/front-entry",
    "ground",
    "entry",
    v(-4.9, 0.15, -4.5),
    v(-1.8, 2.65, -3.0),
    "wood-oak",
    ["front-door"],
    ["ground/living-room", "ground/stair-hall"],
  ),
  space(
    "ground/living-room",
    "ground",
    "living",
    v(-4.9, 0.15, -2.95),
    v(-1.8, 2.65, -0.2),
    "wood-oak",
    ["entry-to-living"],
    ["ground/front-entry", "ground/stair-hall"],
  ),
  space(
    "ground/stair-hall",
    "ground",
    "stair-hall",
    v(-1.65, 0.15, -4.5),
    v(1.25, 2.65, 0.1),
    "wood-oak",
    ["entry-to-stair", "connector/stair-ground-to-upper"],
    ["ground/front-entry", "ground/living-room", "ground/kitchen-dining-family", "upper/hall"],
  ),
  space(
    "ground/kitchen-dining-family",
    "ground",
    "open-common",
    v(-4.9, 0.15, 0.2),
    v(2.7, 2.65, 4.5),
    "wood-oak",
    ["stair-to-common", "kitchen-to-pantry", "dining-rear-slider"],
    ["ground/stair-hall", "ground/pantry"],
  ),
  space(
    "ground/pantry",
    "ground",
    "pantry",
    v(2.85, 0.15, 2.45),
    v(5.05, 2.65, 4.5),
    "wood-oak",
    ["kitchen-to-pantry"],
    ["ground/kitchen-dining-family", "ground/powder-room"],
  ),
  space(
    "ground/powder-room",
    "ground",
    "powder",
    v(2.85, 0.15, 1.35),
    v(5.05, 2.65, 2.35),
    "tile-pale",
    ["powder-door"],
    ["ground/pantry", "ground/laundry-mudroom"],
  ),
  space(
    "ground/laundry-mudroom",
    "ground",
    "laundry-mudroom",
    v(2.85, 0.15, 0.15),
    v(5.05, 2.65, 1.25),
    "tile-pale",
    ["mudroom-door", "mudroom-to-garage"],
    ["ground/powder-room", "ground/garage"],
  ),
  space(
    "ground/garage",
    "ground",
    "garage",
    v(5.65, 0.15, -4.5),
    v(11.15, 2.65, 1.1),
    "concrete-cool-gray",
    ["garage-overhead-door", "mudroom-to-garage"],
    ["ground/laundry-mudroom"],
  ),
];

const upperSpaces = (): Space[] => [
  space(
    "upper/hall",
    "upper",
    "upper-hall",
    v(-1.4, UPPER_ELEVATION + 0.15, -3.9),
    v(4.95, UPPER_ELEVATION + UPPER_HEIGHT, 1.15),
    "carpet-warm-gray",
    ["connector/stair-ground-to-upper", "hall-primary-door", "hall-bedroom-two-door", "hall-bedroom-three-door", "hall-bath-one-door", "hall-linen-door"],
    ["upper/primary-bedroom", "upper/bedroom-two", "upper/bedroom-three", "upper/bathroom-one", "upper/linen-storage", "ground/stair-hall"],
  ),
  space(
    "upper/primary-bedroom",
    "upper",
    "primary-bedroom",
    v(-4.9, UPPER_ELEVATION + 0.15, 1.3),
    v(-1.55, UPPER_ELEVATION + UPPER_HEIGHT, 4.5),
    "carpet-warm-gray",
    ["hall-primary-door"],
    ["upper/hall", "upper/primary-bath"],
  ),
  space(
    "upper/bedroom-two",
    "upper",
    "bedroom",
    v(-4.9, UPPER_ELEVATION + 0.15, -3.9),
    v(-1.55, UPPER_ELEVATION + UPPER_HEIGHT, -1.55),
    "carpet-warm-gray",
    ["hall-bedroom-two-door"],
    ["upper/hall"],
  ),
  space(
    "upper/bedroom-three",
    "upper",
    "bedroom",
    v(1.55, UPPER_ELEVATION + 0.15, 1.3),
    v(4.95, UPPER_ELEVATION + UPPER_HEIGHT, 4.5),
    "carpet-warm-gray",
    ["hall-bedroom-three-door"],
    ["upper/hall"],
  ),
  space(
    "upper/bathroom-one",
    "upper",
    "bathroom",
    v(1.55, UPPER_ELEVATION + 0.15, -0.9),
    v(3.0, UPPER_ELEVATION + UPPER_HEIGHT, 0.95),
    "tile-pale",
    ["hall-bath-one-door"],
    ["upper/hall"],
  ),
  space(
    "upper/linen-storage",
    "upper",
    "storage",
    v(3.05, UPPER_ELEVATION + 0.15, -3.9),
    v(4.95, UPPER_ELEVATION + UPPER_HEIGHT, -1.55),
    "carpet-warm-gray",
    ["hall-linen-door"],
    ["upper/hall"],
  ),
  space(
    "upper/primary-bath",
    "upper",
    "bathroom",
    v(-1.55, UPPER_ELEVATION + 0.15, 3.0),
    v(-0.35, UPPER_ELEVATION + UPPER_HEIGHT, 4.5),
    "tile-pale",
    ["primary-bath-door"],
    ["upper/primary-bedroom"],
  ),
];

const surfaceOwners = (): SurfaceOwner[] => [
  { id: "surface.elevation.front", scope: "elevation", completeSurface: "front exposed facade", stage: "envelope" },
  { id: "surface.elevation.back", scope: "elevation", completeSurface: "rear exposed facade", stage: "envelope" },
  { id: "surface.elevation.left", scope: "elevation", completeSurface: "left exposed facade", stage: "envelope" },
  { id: "surface.elevation.right", scope: "elevation", completeSurface: "right exposed facade and garage side", stage: "envelope" },
  { id: "surface.roof.main.north", scope: "roof", completeSurface: "north-facing main roof slope", stage: "envelope" },
  { id: "surface.roof.main.south", scope: "roof", completeSurface: "south-facing main roof slope", stage: "envelope" },
  { id: "surface.roof.garage", scope: "roof", completeSurface: "garage roof and underside", stage: "envelope" },
  { id: "surface.storey.ground-floor", scope: "storey", completeSurface: "ground floor finish and slab", stage: "envelope" },
  { id: "surface.storey.ground-ceiling", scope: "storey", completeSurface: "ground ceiling plane", stage: "envelope" },
  { id: "surface.storey.upper-floor", scope: "storey", completeSurface: "upper floor finish and slab", stage: "envelope" },
  { id: "surface.storey.upper-ceiling", scope: "storey", completeSurface: "upper ceiling plane", stage: "envelope" },
  ...[
    "ground/front-entry",
    "ground/living-room",
    "ground/stair-hall",
    "ground/kitchen-dining-family",
    "ground/pantry",
    "ground/powder-room",
    "ground/laundry-mudroom",
    "ground/garage",
    "upper/hall",
    "upper/primary-bedroom",
    "upper/bedroom-two",
    "upper/bedroom-three",
    "upper/bathroom-one",
    "upper/linen-storage",
    "upper/primary-bath",
  ].map((id) => ({
    id: `surface.space.${id}`,
    scope: "room" as const,
    completeSurface: `${id} complete room surface`,
    stage: "fit-out" as const,
  })),
];

const addOpeningElement = (
  opening: Opening,
  elements: Element[],
): void => {
  const owner = opening.fromSpaceId
    ? `surface.space.${opening.fromSpaceId}`
    : opening.toSpaceId
      ? `surface.space.${opening.toSpaceId}`
      : opening.kind === "garage-door"
        ? "surface.elevation.front"
        : "surface.elevation.front";
  elements.push(
    element(
      `opening/${opening.id}`,
      opening.fromSpaceId?.startsWith("upper/") || opening.toSpaceId?.startsWith("upper/") ? "upper" : "ground",
      opening.fromSpaceId,
      owner,
      "opening",
      openingParts(opening),
    ),
  );
};

const mainWalls = (storeyId: string, elevationM: number, heightM: number): WallSpec[] => [
  {
    id: `${storeyId}/wall/front`,
    storeyId,
    surfaceOwnerId: "surface.elevation.front",
    axis: "x",
    fixedCoordinate: MAIN.minZ,
    start: MAIN.minX,
    end: MAIN.maxX,
    bottomM: elevationM,
    topM: elevationM + heightM,
    thicknessM: WALL,
    openings: storeyId === "ground"
      ? [
          { id: "front-door", kind: "door", centerAlongAxis: -3.0, width: 1.0, sillM: 0, height: 2.2, fromSpaceId: "ground/front-entry", toSpaceId: null },
          { id: "living-front-window", kind: "window", centerAlongAxis: -4.25, width: 1.55, sillM: 0.85, height: 1.35, fromSpaceId: "ground/living-room", toSpaceId: null },
          { id: "stair-front-window", kind: "window", centerAlongAxis: 0.55, width: 1.2, sillM: 1.05, height: 1.15, fromSpaceId: "ground/stair-hall", toSpaceId: null },
        ]
      : [
          { id: "upper-front-window-left", kind: "window", centerAlongAxis: -3.75, width: 1.5, sillM: 0.65, height: 1.35, fromSpaceId: "upper/bedroom-two", toSpaceId: null },
          { id: "upper-front-window-right", kind: "window", centerAlongAxis: 3.0, width: 1.45, sillM: 0.65, height: 1.35, fromSpaceId: "upper/bedroom-three", toSpaceId: null },
        ],
  },
  {
    id: `${storeyId}/wall/back`,
    storeyId,
    surfaceOwnerId: "surface.elevation.back",
    axis: "x",
    fixedCoordinate: MAIN.maxZ,
    start: MAIN.minX,
    end: MAIN.maxX,
    bottomM: elevationM,
    topM: elevationM + heightM,
    thicknessM: WALL,
    openings: storeyId === "ground"
      ? [
          { id: "kitchen-back-window", kind: "window", centerAlongAxis: -3.0, width: 1.45, sillM: 1.05, height: 1.1, fromSpaceId: "ground/kitchen-dining-family", toSpaceId: null },
          { id: "dining-rear-slider", kind: "slider", centerAlongAxis: 0.15, width: 2.1, sillM: 0, height: 2.15, fromSpaceId: "ground/kitchen-dining-family", toSpaceId: null },
          { id: "family-back-window", kind: "window", centerAlongAxis: 3.25, width: 1.45, sillM: 1.05, height: 1.1, fromSpaceId: "ground/kitchen-dining-family", toSpaceId: null },
        ]
      : [
          { id: "primary-back-window", kind: "window", centerAlongAxis: -3.1, width: 2.0, sillM: 0.7, height: 1.4, fromSpaceId: "upper/primary-bedroom", toSpaceId: null },
          { id: "bedroom-three-back-window", kind: "window", centerAlongAxis: 3.2, width: 1.5, sillM: 0.7, height: 1.35, fromSpaceId: "upper/bedroom-three", toSpaceId: null },
        ],
  },
  {
    id: `${storeyId}/wall/left`,
    storeyId,
    surfaceOwnerId: "surface.elevation.left",
    axis: "z",
    fixedCoordinate: MAIN.minX,
    start: MAIN.minZ,
    end: MAIN.maxZ,
    bottomM: elevationM,
    topM: elevationM + heightM,
    thicknessM: WALL,
    openings: storeyId === "ground"
      ? [
          { id: "living-left-window", kind: "window", centerAlongAxis: -1.9, width: 1.55, sillM: 0.85, height: 1.35, fromSpaceId: "ground/living-room", toSpaceId: null },
          { id: "kitchen-left-window", kind: "window", centerAlongAxis: 3.2, width: 1.4, sillM: 1.05, height: 1.1, fromSpaceId: "ground/kitchen-dining-family", toSpaceId: null },
        ]
      : [
          { id: "bedroom-two-left-window", kind: "window", centerAlongAxis: -3.0, width: 1.4, sillM: 0.7, height: 1.3, fromSpaceId: "upper/bedroom-two", toSpaceId: null },
          { id: "primary-left-window", kind: "window", centerAlongAxis: 3.1, width: 1.55, sillM: 0.7, height: 1.3, fromSpaceId: "upper/primary-bedroom", toSpaceId: null },
        ],
  },
  {
    id: `${storeyId}/wall/right`,
    storeyId,
    surfaceOwnerId: "surface.elevation.right",
    axis: "z",
    fixedCoordinate: MAIN.maxX,
    start: MAIN.minZ,
    end: MAIN.maxZ,
    bottomM: elevationM,
    topM: elevationM + heightM,
    thicknessM: WALL,
    openings: storeyId === "ground"
      ? [
          { id: "mudroom-to-garage", kind: "door", centerAlongAxis: 0.7, width: 0.9, sillM: 0, height: 2.1, fromSpaceId: "ground/laundry-mudroom", toSpaceId: "ground/garage" },
        ]
      : [
          { id: "bath-right-window", kind: "window", centerAlongAxis: -0.2, width: 0.75, sillM: 1.25, height: 0.75, fromSpaceId: "upper/bathroom-one", toSpaceId: null },
        ],
  },
];

const garageWalls = (): WallSpec[] => [
  {
    id: "ground/garage-wall/front",
    storeyId: "ground",
    surfaceOwnerId: "surface.elevation.front",
    axis: "x",
    fixedCoordinate: GARAGE.minZ,
    start: GARAGE.minX,
    end: GARAGE.maxX,
    bottomM: 0,
    topM: GROUND_HEIGHT,
    thicknessM: WALL,
    openings: [
      { id: "garage-overhead-door", kind: "garage-door", centerAlongAxis: 8.4, width: 4.65, sillM: 0, height: 2.35, fromSpaceId: "ground/garage", toSpaceId: null },
    ],
  },
  {
    id: "ground/garage-wall/right",
    storeyId: "ground",
    surfaceOwnerId: "surface.elevation.right",
    axis: "z",
    fixedCoordinate: GARAGE.maxX,
    start: GARAGE.minZ,
    end: GARAGE.maxZ,
    bottomM: 0,
    topM: GROUND_HEIGHT,
    thicknessM: WALL,
    openings: [
      { id: "garage-side-window", kind: "window", centerAlongAxis: -0.4, width: 1.1, sillM: 1.2, height: 0.8, fromSpaceId: "ground/garage", toSpaceId: null },
    ],
  },
  {
    id: "ground/garage-wall/back",
    storeyId: "ground",
    surfaceOwnerId: "surface.elevation.back",
    axis: "x",
    fixedCoordinate: GARAGE.maxZ,
    start: GARAGE.minX,
    end: GARAGE.maxX,
    bottomM: 0,
    topM: GROUND_HEIGHT,
    thicknessM: WALL,
    openings: [],
  },
];

const stairElements = (): Element[] => {
  const parts: Part[] = [];
  const lowerRun = 14;
  const stepCount = lowerRun + 4;
  const rise = UPPER_ELEVATION / stepCount;
  const going = 0.255;
  for (let index = 0; index < lowerRun; index += 1) {
    const top = rise * (index + 1);
    parts.push(
      box(
        `stair.lower.${index + 1}`,
        v(-0.3, top / 2, -3.7 + going * index),
        v(1.05, top, 0.34),
        "wood-oak",
        ["stair-step", "single-stair"],
      ),
    );
  }
  parts.push(
    box("stair.landing", v(-0.3, rise * lowerRun + 0.08, -0.1), v(1.65, 0.16, 1.1), "wood-oak", ["stair-landing"]),
  );
  for (let index = 0; index < 4; index += 1) {
    const top = rise * (lowerRun + index + 1);
    parts.push(
      box(
        `stair.turn.${index + 1}`,
        v(-0.3 + 0.23 * index, top / 2, -0.1),
        v(0.38, top, 1.05),
        "wood-oak",
        ["stair-step", "turn-step", "single-stair"],
      ),
    );
  }
  parts.push(
    box("stair.handrail", v(0.35, 1.0, -1.95), v(0.08, 0.08, 3.4), "wood-walnut", ["handrail"]),
    box("stair.guard", v(0.62, 1.75, -0.2), v(0.07, 1.2, 1.15), "trim-white", ["guardrail"]),
  );
  return [element("stair/single-l-turn", "ground", "ground/stair-hall", "surface.space.ground/stair-hall", "fit-out", parts)];
};

const roofElements = (): Element[] => {
  return [
    element("roof/main-north", null, null, "surface.roof.main.north", "envelope", [
      box("roof.main.north", v(-2.75, 6.5, 0), v(6.25, 0.18, 10.15), "roof-charcoal", ["roof-slope", "exposed"], "slab", 0, 0, 18),
      box("roof.ridge", v(0, 7.5, 0), v(0.22, 0.2, 9.9), "trim-white", ["ridge-cap"]),
    ]),
    element("roof/main-south", null, null, "surface.roof.main.south", "envelope", [
      box("roof.main.south", v(2.75, 6.5, 0), v(6.25, 0.18, 10.15), "roof-charcoal", ["roof-slope", "exposed"], "slab", 0, 0, -18),
    ]),
    element("roof/garage", null, null, "surface.roof.garage", "envelope", [
      box("roof.garage", v(8.4, 4.15, -1.7), v(5.95, 0.18, 6.55), "roof-charcoal", ["garage-roof", "exposed"], "slab", 0, 0, 12),
    ]),
  ];
};

const chimneyElements = (): Element[] => [
  element(
    "chimney/front-left",
    null,
    null,
    "surface.elevation.left",
    "envelope",
    [
      box("chimney/shaft", v(-4.4, 4.05, 1.5), v(0.72, 3.7, 0.72), "brick-red-brown", ["chimney", "brick"]),
      box("chimney/cap", v(-4.4, 5.95, 1.5), v(0.86, 0.14, 0.86), "metal-black", ["chimney-cap"]),
    ],
  ),
];

const addGroundPartitions = (elements: Element[], openings: Opening[]): void => {
  const add = (result: { element: Element; openings: Opening[] }): void => {
    elements.push(result.element);
    openings.push(...result.openings);
  };
  add(partitionWithOpenings("ground/partition/entry-living", "ground", "ground/front-entry", "x", -3.0, MAIN.minX, -1.8, 0, GROUND_HEIGHT, [{ id: "entry-to-living", kind: "door", centerAlongAxis: -3.35, width: 1.2, sillM: 0, height: 2.1, fromSpaceId: "ground/front-entry", toSpaceId: "ground/living-room" }]));
  add(partitionWithOpenings("ground/partition/living-stair", "ground", "ground/living-room", "z", -1.7, -3.0, 0.1, 0, GROUND_HEIGHT, [
    { id: "entry-to-stair", kind: "door", centerAlongAxis: -2.45, width: 0.95, sillM: 0, height: 2.1, fromSpaceId: "ground/front-entry", toSpaceId: "ground/stair-hall" },
    { id: "living-to-stair", kind: "door", centerAlongAxis: -0.75, width: 1.0, sillM: 0, height: 2.1, fromSpaceId: "ground/living-room", toSpaceId: "ground/stair-hall" },
  ]));
  add(partitionWithOpenings("ground/partition/stair-common", "ground", "ground/stair-hall", "x", 0.1, -1.7, 2.7, 0, GROUND_HEIGHT, [{ id: "stair-to-common", kind: "door", centerAlongAxis: 1.35, width: 1.8, sillM: 0, height: 2.1, fromSpaceId: "ground/stair-hall", toSpaceId: "ground/kitchen-dining-family" }]));
  add(partitionWithOpenings("ground/partition/service", "ground", "ground/pantry", "z", 2.75, 0.1, 4.5, 0, GROUND_HEIGHT, [{ id: "kitchen-to-pantry", kind: "door", centerAlongAxis: 3.45, width: 0.9, sillM: 0, height: 2.1, fromSpaceId: "ground/kitchen-dining-family", toSpaceId: "ground/pantry" }]));
  add(partitionWithOpenings("ground/partition/pantry-powder", "ground", "ground/pantry", "x", 2.4, 2.75, 5.05, 0, GROUND_HEIGHT, [{ id: "powder-door", kind: "door", centerAlongAxis: 3.7, width: 0.75, sillM: 0, height: 2.1, fromSpaceId: "ground/pantry", toSpaceId: "ground/powder-room" }]));
  add(partitionWithOpenings("ground/partition/powder-mudroom", "ground", "ground/powder-room", "x", 1.3, 2.75, 5.05, 0, GROUND_HEIGHT, [{ id: "mudroom-door", kind: "door", centerAlongAxis: 4.35, width: 0.75, sillM: 0, height: 2.1, fromSpaceId: "ground/powder-room", toSpaceId: "ground/laundry-mudroom" }]));
};

const addUpperPartitions = (elements: Element[], openings: Opening[]): void => {
  const add = (result: { element: Element; openings: Opening[] }): void => {
    elements.push(result.element);
    openings.push(...result.openings);
  };
  add(partitionWithOpenings("upper/partition/hall-primary", "upper", "upper/primary-bedroom", "z", -1.48, 1.025, 4.575, UPPER_ELEVATION, UPPER_ELEVATION + UPPER_HEIGHT, [{ id: "hall-primary-door", kind: "door", centerAlongAxis: 2.0, width: 0.9, sillM: 0, height: 2.1, fromSpaceId: "upper/hall", toSpaceId: "upper/primary-bedroom" }]));
  add(partitionWithOpenings("upper/partition/hall-bedroom-two", "upper", "upper/bedroom-two", "z", -1.48, -3.9, -1.55, UPPER_ELEVATION, UPPER_ELEVATION + UPPER_HEIGHT, [{ id: "hall-bedroom-two-door", kind: "door", centerAlongAxis: -2.7, width: 0.9, sillM: 0, height: 2.1, fromSpaceId: "upper/hall", toSpaceId: "upper/bedroom-two" }]));
  add(partitionWithOpenings("upper/partition/hall-bedroom-three", "upper", "upper/bedroom-three", "z", 1.48, 1.025, 4.575, UPPER_ELEVATION, UPPER_ELEVATION + UPPER_HEIGHT, [{ id: "hall-bedroom-three-door", kind: "door", centerAlongAxis: 2.3, width: 0.9, sillM: 0, height: 2.1, fromSpaceId: "upper/hall", toSpaceId: "upper/bedroom-three" }]));
  add(partitionWithOpenings("upper/partition/hall-baths", "upper", "upper/bathroom-one", "z", 3.0, -0.9, 0.95, UPPER_ELEVATION, UPPER_ELEVATION + UPPER_HEIGHT, [{ id: "hall-bath-one-door", kind: "door", centerAlongAxis: 0.1, width: 0.8, sillM: 0, height: 2.1, fromSpaceId: "upper/hall", toSpaceId: "upper/bathroom-one" }]));
  add(partitionWithOpenings("upper/partition/linen", "upper", "upper/linen-storage", "z", 3.02, -3.9, -1.55, UPPER_ELEVATION, UPPER_ELEVATION + UPPER_HEIGHT, [{ id: "hall-linen-door", kind: "door", centerAlongAxis: -2.7, width: 0.75, sillM: 0, height: 2.1, fromSpaceId: "upper/hall", toSpaceId: "upper/linen-storage" }]));
  add(partitionWithOpenings("upper/partition/primary-bath", "upper", "upper/primary-bath", "z", -1.55, 3.0, 4.5, UPPER_ELEVATION, UPPER_ELEVATION + UPPER_HEIGHT, [{ id: "primary-bath-door", kind: "door", centerAlongAxis: 3.75, width: 0.75, sillM: 0, height: 2.1, fromSpaceId: "upper/primary-bedroom", toSpaceId: "upper/primary-bath" }]));
};

const addFloorAndCeilingElements = (elements: Element[], spaces: readonly Space[]): void => {
  elements.push(
    slab("ground/floor-slab", "ground", null, "surface.storey.ground-floor", v(0, -0.14, 0), v(11.0, 0.28, 9.6), "concrete-cool-gray", ["structural-floor"]),
    slab("ground/ceiling", "ground", null, "surface.storey.ground-ceiling", v(0, GROUND_HEIGHT + 0.14, 0), v(11.0, 0.28, 9.6), "paint-warm-white", ["ceiling"]),
    slab("upper/floor-slab", "upper", null, "surface.storey.upper-floor", v(0, UPPER_ELEVATION - 0.14, 0), v(11.0, 0.28, 9.6), "wood-oak", ["structural-floor"]),
    slab("upper/ceiling", "upper", null, "surface.storey.upper-ceiling", v(0, UPPER_ELEVATION + UPPER_HEIGHT + 0.14, 0), v(11.0, 0.28, 9.6), "paint-warm-white", ["ceiling"]),
  );
  for (const item of spaces) {
    const width = item.bounds.max.x - item.bounds.min.x;
    const depth = item.bounds.max.z - item.bounds.min.z;
    elements.push(
      slab(
        `floor-finish/${item.id}`,
        item.storeyId,
        item.id,
        item.surfaceOwnerId,
        v((item.bounds.min.x + item.bounds.max.x) / 2, item.bounds.min.y + 0.02, (item.bounds.min.z + item.bounds.max.z) / 2),
        v(Math.max(0.1, width - 0.06), 0.04, Math.max(0.1, depth - 0.06)),
        item.floorMaterial,
        ["finish-floor", "room-surface"],
      ),
    );
  }
};

const lightingElements = (spaces: readonly Space[]): Element[] => [
  ...spaces.map((item) => simpleFurniture(
    `lighting/${item.id}/ceiling-fixture`,
    item.storeyId,
    item.id,
    v((item.bounds.min.x + item.bounds.max.x) / 2, item.bounds.max.y - 0.18, (item.bounds.min.z + item.bounds.max.z) / 2),
    v(0.42, 0.08, 0.42),
    "trim-white",
    ["lighting-fixture", "ceiling-light"],
  )),
  simpleFurniture("lighting/kitchen/under-cabinet-task-light", "ground", "ground/kitchen-dining-family", v(-3.4, 1.55, 3.27), v(2.15, 0.06, 0.05), "trim-white", ["lighting-fixture", "under-cabinet-light"]),
];

const addInteriorFitOut = (elements: Element[], spaces: readonly Space[]): void => {
  const ground = "ground";
  elements.push(
    furniture("living/sofa", ground, "ground/living-room", [
      box("living/sofa/base", v(-3.75, 0.55, -1.75), v(2.55, 0.75, 0.82), "fabric-oatmeal", ["seating"]),
      box("living/sofa/back", v(-3.75, 1.1, -2.08), v(2.55, 0.85, 0.18), "fabric-oatmeal", ["seating"]),
    ]),
    simpleFurniture("living/armchair", ground, "ground/living-room", v(-2.25, 0.55, -0.8), v(0.85, 1.0, 0.85), "fabric-blue-gray", ["seating"]),
    simpleFurniture("living/armchair-two", ground, "ground/living-room", v(-2.25, 0.55, -2.45), v(0.85, 1.0, 0.85), "fabric-blue-gray", ["seating"]),
    simpleFurniture("living/coffee-table", ground, "ground/living-room", v(-3.75, 0.42, -0.55), v(1.35, 0.22, 0.65), "wood-walnut", ["table"]),
    simpleFurniture("living/fireplace", ground, "ground/living-room", v(-4.95, 1.2, 0.0), v(0.16, 2.25, 2.3), "brick-red-brown", ["fireplace"]),
    simpleFurniture("living/bookcase", ground, "ground/living-room", v(-2.05, 1.25, -0.29), v(0.42, 2.25, 0.16), "wood-walnut", ["storage"]),
    simpleFurniture("living/rug", ground, "ground/living-room", v(-3.55, 0.2, -1.25), v(2.4, 0.04, 1.55), "fabric-blue-gray", ["rug"]),
    simpleFurniture("living/plant", ground, "ground/living-room", v(-4.65, 0.8, -0.5), v(0.42, 1.25, 0.42), "greenery", ["plant"]),
    furniture("kitchen/cabinets", ground, "ground/kitchen-dining-family", [
      box("kitchen/base-cabinets", v(-3.4, 0.65, 3.65), v(2.6, 1.1, 0.65), "cabinet-taupe", ["kitchen"]),
      box("kitchen/tall-cabinets", v(-4.55, 1.55, 2.95), v(0.75, 2.5, 0.72), "cabinet-taupe", ["kitchen", "appliance-housing"]),
      box("kitchen/island", v(-1.8, 0.85, 2.15), v(2.0, 1.0, 0.9), "cabinet-taupe", ["island"]),
      box("kitchen/island-counter", v(-1.8, 1.42, 2.15), v(2.18, 0.12, 1.02), "stone-pale", ["counter"]),
      box("kitchen/sink", v(-3.2, 1.28, 3.25), v(0.65, 0.06, 0.42), "stone-pale", ["fixture"]),
    ]),
    simpleFurniture("kitchen/refrigerator", ground, "ground/kitchen-dining-family", v(-4.55, 1.15, 2.05), v(0.82, 2.15, 0.75), "metal-black", ["appliance"]),
    simpleFurniture("kitchen/range", ground, "ground/kitchen-dining-family", v(-2.2, 1.15, 2.95), v(0.85, 1.15, 0.66), "metal-black", ["appliance"]),
    simpleFurniture("kitchen/hood", ground, "ground/kitchen-dining-family", v(-2.2, 2.03, 2.95), v(0.95, 0.16, 0.72), "metal-black", ["appliance", "hood"]),
    simpleFurniture("kitchen/island-stool-one", ground, "ground/kitchen-dining-family", v(-2.55, 0.48, 1.45), v(0.42, 0.72, 0.42), "wood-walnut", ["seating", "island-stool"]),
    simpleFurniture("kitchen/island-stool-two", ground, "ground/kitchen-dining-family", v(-1.8, 0.48, 1.45), v(0.42, 0.72, 0.42), "wood-walnut", ["seating", "island-stool"]),
    simpleFurniture("kitchen/island-stool-three", ground, "ground/kitchen-dining-family", v(-1.05, 0.48, 1.45), v(0.42, 0.72, 0.42), "wood-walnut", ["seating", "island-stool"]),
    furniture("dining/table", ground, "ground/kitchen-dining-family", [
      box("dining/table-top", v(0.05, 0.82, 3.15), v(2.35, 0.12, 1.05), "wood-walnut", ["dining"]),
      box("dining/table-leg-a", v(-0.8, 0.38, 2.82), v(0.12, 0.75, 0.12), "wood-walnut", ["dining"]),
      box("dining/table-leg-b", v(0.9, 0.38, 2.82), v(0.12, 0.75, 0.12), "wood-walnut", ["dining"]),
      box("dining/table-leg-c", v(-0.8, 0.38, 3.48), v(0.12, 0.75, 0.12), "wood-walnut", ["dining"]),
      box("dining/table-leg-d", v(0.9, 0.38, 3.48), v(0.12, 0.75, 0.12), "wood-walnut", ["dining"]),
    ]),
    simpleFurniture("dining/chair-front-left", ground, "ground/kitchen-dining-family", v(-0.45, 0.45, 2.35), v(0.48, 0.82, 0.48), "fabric-blue-gray", ["seating", "dining-chair"]),
    simpleFurniture("dining/chair-front-center", ground, "ground/kitchen-dining-family", v(0.05, 0.45, 2.35), v(0.48, 0.82, 0.48), "fabric-blue-gray", ["seating", "dining-chair"]),
    simpleFurniture("dining/chair-front-right", ground, "ground/kitchen-dining-family", v(1.5, 0.45, 2.35), v(0.48, 0.82, 0.48), "fabric-blue-gray", ["seating", "dining-chair"]),
    simpleFurniture("dining/chair-rear-left", ground, "ground/kitchen-dining-family", v(-1.4, 0.45, 3.95), v(0.48, 0.82, 0.48), "fabric-blue-gray", ["seating", "dining-chair"]),
    simpleFurniture("dining/chair-rear-center", ground, "ground/kitchen-dining-family", v(0.05, 0.45, 3.95), v(0.48, 0.82, 0.48), "fabric-blue-gray", ["seating", "dining-chair"]),
    simpleFurniture("dining/chair-rear-right", ground, "ground/kitchen-dining-family", v(1.5, 0.45, 3.95), v(0.48, 0.82, 0.48), "fabric-blue-gray", ["seating", "dining-chair"]),
    furniture("family/sofa", ground, "ground/kitchen-dining-family", [
      box("family/sofa/base", v(1.1, 0.55, 1.5), v(2.35, 0.75, 0.85), "fabric-oatmeal", ["seating"]),
      box("family/sofa/back", v(1.1, 1.1, 1.83), v(2.35, 0.85, 0.18), "fabric-oatmeal", ["seating"]),
    ]),
    simpleFurniture("family/low-table", ground, "ground/kitchen-dining-family", v(1.1, 0.42, 0.75), v(1.15, 0.22, 0.65), "wood-walnut", ["table"]),
    simpleFurniture("family/rug", ground, "ground/kitchen-dining-family", v(1.15, 0.2, 0.72), v(2.75, 0.04, 1.85), "fabric-blue-gray", ["rug"]),
    simpleFurniture("family/plant", ground, "ground/kitchen-dining-family", v(-0.25, 0.62, 0.5), v(0.42, 1.25, 0.42), "greenery", ["plant"]),
    simpleFurniture("family/media-console", ground, "ground/kitchen-dining-family", v(2.2, 0.55, 0.05), v(0.35, 1.0, 1.8), "wood-walnut", ["media"]),
    simpleFurniture("pantry/shelves", ground, "ground/pantry", v(3.1, 1.25, 3.55), v(0.28, 2.15, 1.1), "wood-oak", ["storage"]),
    simpleFurniture("powder/vanity", ground, "ground/powder-room", v(3.9, 0.58, 1.7), v(0.8, 1.0, 0.42), "wood-walnut", ["fixture"]),
    simpleFurniture("powder/hand-basin", ground, "ground/powder-room", v(3.9, 1.14, 1.7), v(0.46, 0.08, 0.28), "stone-pale", ["fixture", "hand-basin"]),
    simpleFurniture("powder/mirror", ground, "ground/powder-room", v(3.9, 1.65, 1.47), v(0.62, 0.58, 0.04), "glass-smoke", ["mirror"]),
    simpleFurniture("powder/toilet", ground, "ground/powder-room", v(4.55, 0.55, 2.0), v(0.42, 0.8, 0.65), "tile-pale", ["fixture"]),
    simpleFurniture("mudroom/bench", ground, "ground/laundry-mudroom", v(3.35, 0.58, 0.75), v(1.75, 0.8, 0.48), "wood-oak", ["storage", "bench"]),
    simpleFurniture("mudroom/shoe-storage", ground, "ground/laundry-mudroom", v(3.45, 1.18, 0.28), v(1.2, 0.58, 0.38), "wood-oak", ["storage", "shoe-storage"]),
    simpleFurniture("mudroom/utility-sink", ground, "ground/laundry-mudroom", v(4.45, 0.72, 0.28), v(0.62, 0.9, 0.42), "stone-pale", ["fixture", "utility-sink"]),
    simpleFurniture("mudroom/laundry-pair", ground, "ground/laundry-mudroom", v(4.65, 1.05, 0.95), v(0.7, 1.9, 0.42), "metal-black", ["appliance"]),
    simpleFurniture("mudroom/hooks", ground, "ground/laundry-mudroom", v(3.25, 1.7, 0.55), v(1.2, 0.45, 0.08), "wood-walnut", ["storage"]),
    simpleFurniture("garage/storage-cabinets", ground, "ground/garage", v(6.25, 1.15, 0.55), v(0.55, 2.05, 1.95), "cabinet-taupe", ["garage-storage"]),
    simpleFurniture("garage/storage-shelf", ground, "ground/garage", v(10.15, 1.25, 0.55), v(0.5, 2.25, 2.25), "metal-black", ["garage-storage"]),
  );

  const upper = "upper";
  const bedrooms: Array<{ id: string; x: number; z: number; bed: MaterialId }> = [
    { id: "primary-bedroom", x: -3.25, z: 2.75, bed: "fabric-oatmeal" },
    { id: "bedroom-two", x: -3.25, z: -2.8, bed: "fabric-blue-gray" },
    { id: "bedroom-three", x: 3.1, z: 2.8, bed: "fabric-blue-gray" },
  ];
  for (const bedroom of bedrooms) {
    elements.push(
      simpleFurniture(`fitout/${bedroom.id}/bed`, upper, `upper/${bedroom.id}`, v(bedroom.x, UPPER_ELEVATION + 0.45, bedroom.z), v(1.85, 0.55, 2.15), bedroom.bed, ["bed"]),
      simpleFurniture(`fitout/${bedroom.id}/nightstand`, upper, `upper/${bedroom.id}`, v(bedroom.x - 1.25, UPPER_ELEVATION + 0.48, bedroom.z), v(0.42, 0.55, 0.42), "wood-walnut", ["storage"]),
      simpleFurniture(`fitout/${bedroom.id}/dresser`, upper, `upper/${bedroom.id}`, v(bedroom.x + 1.25, UPPER_ELEVATION + 0.65, bedroom.id === "bedroom-two" ? bedroom.z + 0.7 : 1.55), v(0.42, 1.15, 1.2), "wood-walnut", ["storage"]),
    );
  }
  elements.push(
    simpleFurniture("fitout/primary-bedroom/nightstand-two", upper, "upper/primary-bedroom", v(-2.05, UPPER_ELEVATION + 0.48, 2.75), v(0.42, 0.55, 0.42), "wood-walnut", ["storage", "nightstand"]),
  );
  elements.push(
    simpleFurniture("fitout/primary-bedroom/closet", upper, "upper/primary-bedroom", v(-1.8, UPPER_ELEVATION + 1.15, 3.9), v(0.42, 2.2, 1.1), "wood-oak", ["closet"]),
    simpleFurniture("fitout/bedroom-two/closet", upper, "upper/bedroom-two", v(-1.85, UPPER_ELEVATION + 1.15, -3.55), v(0.4, 2.2, 0.95), "wood-oak", ["closet"]),
    simpleFurniture("fitout/bedroom-three/closet", upper, "upper/bedroom-three", v(4.5, UPPER_ELEVATION + 1.15, 3.9), v(0.4, 2.2, 1.0), "wood-oak", ["closet"]),
    simpleFurniture("fitout/upper/hall-linen", upper, "upper/linen-storage", v(4.45, UPPER_ELEVATION + 1.15, -2.65), v(0.38, 2.2, 1.45), "wood-oak", ["storage"]),
    simpleFurniture("fitout/bathroom-one/vanity", upper, "upper/bathroom-one", v(2.15, UPPER_ELEVATION + 0.6, -0.35), v(0.8, 1.05, 0.42), "wood-walnut", ["fixture"]),
    simpleFurniture("fitout/bathroom-one/mirror", upper, "upper/bathroom-one", v(2.15, UPPER_ELEVATION + 1.62, -0.58), v(0.68, 0.58, 0.04), "glass-smoke", ["mirror"]),
    simpleFurniture("fitout/bathroom-one/toilet", upper, "upper/bathroom-one", v(2.65, UPPER_ELEVATION + 0.55, 0.55), v(0.42, 0.8, 0.62), "tile-pale", ["fixture"]),
    simpleFurniture("fitout/bathroom-one/shower", upper, "upper/bathroom-one", v(1.9, UPPER_ELEVATION + 1.15, 0.35), v(0.34, 2.0, 0.62), "tile-pale", ["fixture", "shower"]),
    simpleFurniture("fitout/primary-bath/vanity", upper, "upper/primary-bath", v(-1.2, UPPER_ELEVATION + 0.6, 3.45), v(0.5, 1.05, 0.32), "wood-walnut", ["fixture"]),
    simpleFurniture("fitout/primary-bath/mirror", upper, "upper/primary-bath", v(-1.2, UPPER_ELEVATION + 1.62, 3.25), v(0.5, 0.58, 0.04), "glass-smoke", ["mirror"]),
    simpleFurniture("fitout/primary-bath/toilet", upper, "upper/primary-bath", v(-1.36, UPPER_ELEVATION + 0.55, 4.0), v(0.34, 0.8, 0.42), "tile-pale", ["fixture"]),
    simpleFurniture("fitout/primary-bath/shower", upper, "upper/primary-bath", v(-0.58, UPPER_ELEVATION + 1.15, 3.32), v(0.34, 2.0, 0.5), "tile-pale", ["fixture", "shower"]),
    simpleFurniture("fitout/primary-bath/tub", upper, "upper/primary-bath", v(-0.75, UPPER_ELEVATION + 0.55, 4.2), v(0.78, 0.7, 1.0), "tile-pale", ["fixture", "tub"]),
  );
  elements.push(...lightingElements(spaces));
};

const moduleCount = (family: ModuleLaw["family"], lengthM: number, heightM: number, spacingM: number): number => {
  const rowPitch = family === "brick" ? 0.1875 : spacingM;
  const moduleLength = family === "siding" ? spacingM * 4 : spacingM;
  return Math.ceil(lengthM / moduleLength) * Math.ceil(heightM / rowPitch);
};

const moduleLaws = (): ModuleLaw[] => [
  { id: "module.siding.front", hostSurfaceOwnerId: "surface.elevation.front", family: "siding", measuredLengthM: 16.8, measuredHeightM: 5.4, spacingM: 0.203, count: moduleCount("siding", 16.8, 5.4, 0.203), staggerRule: "corner-return" },
  { id: "module.siding.back", hostSurfaceOwnerId: "surface.elevation.back", family: "siding", measuredLengthM: 11.0, measuredHeightM: 5.4, spacingM: 0.203, count: moduleCount("siding", 11.0, 5.4, 0.203), staggerRule: "corner-return" },
  { id: "module.siding.left", hostSurfaceOwnerId: "surface.elevation.left", family: "siding", measuredLengthM: 9.6, measuredHeightM: 5.4, spacingM: 0.203, count: moduleCount("siding", 9.6, 5.4, 0.203), staggerRule: "corner-return" },
  { id: "module.siding.right-main", hostSurfaceOwnerId: "surface.elevation.right", family: "siding", measuredLengthM: 9.6, measuredHeightM: 5.4, spacingM: 0.203, count: moduleCount("siding", 9.6, 5.4, 0.203), staggerRule: "corner-return" },
  { id: "module.siding.right-garage", hostSurfaceOwnerId: "surface.elevation.right", family: "siding", measuredLengthM: 5.95, measuredHeightM: 2.65, spacingM: 0.203, count: moduleCount("siding", 5.95, 2.65, 0.203), staggerRule: "corner-return" },
  { id: "module.brick.front-skirt", hostSurfaceOwnerId: "surface.elevation.front", family: "brick", measuredLengthM: 16.8, measuredHeightM: 0.75, spacingM: 0.406, count: moduleCount("brick", 16.8, 0.75, 0.406), staggerRule: "alternate-half-module" },
  { id: "module.brick.back-skirt", hostSurfaceOwnerId: "surface.elevation.back", family: "brick", measuredLengthM: 11.0, measuredHeightM: 0.75, spacingM: 0.406, count: moduleCount("brick", 11.0, 0.75, 0.406), staggerRule: "alternate-half-module" },
  { id: "module.brick.left-skirt", hostSurfaceOwnerId: "surface.elevation.left", family: "brick", measuredLengthM: 9.6, measuredHeightM: 0.75, spacingM: 0.406, count: moduleCount("brick", 9.6, 0.75, 0.406), staggerRule: "alternate-half-module" },
  { id: "module.brick.right-main-skirt", hostSurfaceOwnerId: "surface.elevation.right", family: "brick", measuredLengthM: 9.6, measuredHeightM: 0.75, spacingM: 0.406, count: moduleCount("brick", 9.6, 0.75, 0.406), staggerRule: "alternate-half-module" },
  { id: "module.brick.right-garage-skirt", hostSurfaceOwnerId: "surface.elevation.right", family: "brick", measuredLengthM: 5.95, measuredHeightM: 0.75, spacingM: 0.406, count: moduleCount("brick", 5.95, 0.75, 0.406), staggerRule: "alternate-half-module" },
  { id: "module.shingle.main-north", hostSurfaceOwnerId: "surface.roof.main.north", family: "shingle", measuredLengthM: 10.15, measuredHeightM: 6.25, spacingM: 0.305, count: moduleCount("shingle", 10.15, 6.25, 0.305), staggerRule: "alternate-half-module" },
  { id: "module.shingle.main-south", hostSurfaceOwnerId: "surface.roof.main.south", family: "shingle", measuredLengthM: 10.15, measuredHeightM: 6.25, spacingM: 0.305, count: moduleCount("shingle", 10.15, 6.25, 0.305), staggerRule: "alternate-half-module" },
  { id: "module.shingle.garage", hostSurfaceOwnerId: "surface.roof.garage", family: "shingle", measuredLengthM: 6.55, measuredHeightM: 5.95, spacingM: 0.305, count: moduleCount("shingle", 6.55, 5.95, 0.305), staggerRule: "alternate-half-module" },
];

const moduleElements = (laws: readonly ModuleLaw[]): Element[] => {
  const roofPlaneY = (centerX: number, centerY: number, slopeDeg: number, x: number): number =>
    centerY + Math.tan((slopeDeg * Math.PI) / 180) * (x - centerX);
  const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);
  const elements: Element[] = [];
  for (const law of laws) {
    const parts: Part[] = [];
    const isSiding = law.family === "siding";
    const material: MaterialId = isSiding
      ? "siding-white"
      : law.family === "brick"
        ? "brick-red-brown"
        : "roof-charcoal";
    const rowPitch = law.family === "brick" ? 0.1875 : law.spacingM;
    const moduleLength = law.family === "siding" ? law.spacingM * 4 : law.spacingM;
    const rows = Math.ceil(law.measuredHeightM / rowPitch);
    const columns = Math.ceil(law.measuredLengthM / moduleLength);
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const offset = row % 2 === 0 ? 0 : law.spacingM / 2;
        const along = column * moduleLength + offset;
        const vertical = row * rowPitch + rowPitch / 2;
        const isRoof = law.family === "shingle";
        const isSide = law.hostSurfaceOwnerId.endsWith("left") || law.hostSurfaceOwnerId.endsWith("right");
        const roofSlopeDeg = law.hostSurfaceOwnerId.endsWith("garage")
          ? 12
          : law.hostSurfaceOwnerId.endsWith("north")
            ? 18
            : -18;
        const roofHost = isRoof
          ? law.hostSurfaceOwnerId.endsWith("garage")
            ? { centerX: (GARAGE.minX + GARAGE.maxX) / 2, centerY: 4.15, centerZ: -1.7, spanX: 5.95, spanZ: 6.55, slabThicknessM: 0.18 }
            : law.hostSurfaceOwnerId.endsWith("north")
              ? { centerX: -2.75, centerY: 6.5, centerZ: 0, spanX: 6.25, spanZ: 10.15, slabThicknessM: 0.18 }
              : { centerX: 2.75, centerY: 6.5, centerZ: 0, spanX: 6.25, spanZ: 10.15, slabThicknessM: 0.18 }
          : null;
        const roofSizeX = rowPitch * 0.95;
        const roofSizeZ = moduleLength * 0.95;
        const roofHalfX = roofHost === null
          ? 0
          : Math.abs(Math.cos((roofSlopeDeg * Math.PI) / 180)) * roofSizeX / 2
            + Math.abs(Math.sin((roofSlopeDeg * Math.PI) / 180)) * 0.06 / 2;
        const hostHalfX = roofHost === null
          ? 0
          : Math.abs(Math.cos((roofSlopeDeg * Math.PI) / 180)) * roofHost.spanX / 2
            + Math.abs(Math.sin((roofSlopeDeg * Math.PI) / 180)) * roofHost.slabThicknessM / 2;
        const rawRoofX = law.hostSurfaceOwnerId.endsWith("garage")
          ? (roofHost?.centerX ?? 0) - (roofHost?.spanX ?? 0) / 2 + vertical
          : law.hostSurfaceOwnerId.endsWith("north")
            ? (roofHost?.centerX ?? 0) - (roofHost?.spanX ?? 0) / 2 + vertical
            : (roofHost?.centerX ?? 0) + (roofHost?.spanX ?? 0) / 2 - vertical;
        const roofX = roofHost === null
          ? 0
          : clamp(rawRoofX, roofHost.centerX - hostHalfX + roofHalfX, roofHost.centerX + hostHalfX - roofHalfX);
        const rawRoofZ = roofHost === null
          ? 0
          : roofHost.centerZ - roofHost.spanZ / 2 + along + moduleLength / 2;
        const roofZ = roofHost === null
          ? 0
          : clamp(rawRoofZ, roofHost.centerZ - roofHost.spanZ / 2 + roofSizeZ / 2, roofHost.centerZ + roofHost.spanZ / 2 - roofSizeZ / 2);
        const center = isRoof && roofHost !== null
            ? v(roofX, roofPlaneY(roofHost.centerX, roofHost.centerY, roofSlopeDeg, roofX) + 0.11, roofZ)
          : isSide
            ? v(law.id.endsWith("garage") ? GARAGE.maxX + 0.1 : law.hostSurfaceOwnerId.endsWith("left") ? MAIN.minX - 0.1 : MAIN.maxX + 0.1, 0.15 + vertical, (law.id.endsWith("garage") ? GARAGE.minZ : MAIN.minZ) + Math.min(along, law.measuredLengthM))
            : v(MAIN.minX + Math.min(along, law.measuredLengthM), 0.15 + vertical, law.hostSurfaceOwnerId.endsWith("front") ? MAIN.minZ - 0.1 : MAIN.maxZ + 0.1);
        const size = isRoof
          ? v(roofSizeX, 0.06, roofSizeZ)
          : isSide
            ? v(0.025, rowPitch * 0.92, moduleLength * 0.95)
            : v(moduleLength * 0.95, rowPitch * 0.92, 0.025);
        parts.push(
          box(
            `${law.id}.${row}.${column}`,
            center,
            size,
            material,
            ["generated-module", law.family, `law-count:${law.count}`],
            "box",
            0,
            0,
            isRoof ? roofSlopeDeg : 0,
          ),
        );
      }
    }
    elements.push(element(law.id, null, null, law.hostSurfaceOwnerId, "module", parts));
  }
  return elements;
};

const siteElements = (): Element[] => [
  slab("site/lawn", null, null, "surface.elevation.front", v(2.2, -0.1, -6.4), v(18.0, 0.2, 3.2), "greenery", ["site"]),
  slab("site/rear-lawn", null, null, "surface.elevation.back", v(2.2, -0.1, 6.3), v(18.0, 0.2, 4.0), "greenery", ["site"]),
  slab("site/front-walk", null, null, "surface.elevation.front", v(-3.0, 0.03, -5.6), v(1.35, 0.06, 2.2), "concrete-cool-gray", ["site", "walk"]),
  slab("site/driveway", null, null, "surface.elevation.front", v(8.4, 0.03, -5.55), v(5.6, 0.06, 2.3), "concrete-cool-gray", ["site", "driveway"]),
  simpleFurniture("site/porch", null, "ground/front-entry", v(-3.0, 0.18, -5.0), v(3.2, 0.3, 1.15), "concrete-cool-gray", ["site", "porch"]),
  simpleFurniture("site/porch-column-left", null, "ground/front-entry", v(-4.25, 1.35, -4.95), v(0.22, 2.7, 0.22), "trim-white", ["site", "porch"]),
  simpleFurniture("site/porch-column-right", null, "ground/front-entry", v(-1.75, 1.35, -4.95), v(0.22, 2.7, 0.22), "trim-white", ["site", "porch"]),
  simpleFurniture("site/front-shrub-left", null, null, v(-5.85, 0.55, -4.6), v(0.8, 1.1, 0.8), "greenery", ["site", "planting"]),
  simpleFurniture("site/front-shrub-right", null, null, v(5.0, 0.55, -4.6), v(0.8, 1.1, 0.8), "greenery", ["site", "planting"]),
  element("site/rear-fence", null, null, "surface.elevation.back", "site", [
    box("site/rear-fence/rail", v(1.0, 0.58, 8.65), v(24.8, 0.1, 0.1), "wood-walnut", ["site", "fence", "rear-edge"]),
    box("site/rear-fence/post-left", v(-11.4, 0.6, 8.65), v(0.14, 1.2, 0.14), "wood-walnut", ["site", "fence", "rear-edge"]),
    box("site/rear-fence/post-center", v(1.0, 0.6, 8.65), v(0.14, 1.2, 0.14), "wood-walnut", ["site", "fence", "rear-edge"]),
    box("site/rear-fence/post-right", v(13.4, 0.6, 8.65), v(0.14, 1.2, 0.14), "wood-walnut", ["site", "fence", "rear-edge"]),
  ]),
];

const makeStoreys = (spaces: readonly Space[], elements: readonly Element[]): Storey[] => [
  {
    id: "ground",
    level: 0,
    elevationM: GROUND_ELEVATION,
    clearHeightM: GROUND_HEIGHT,
    bounds: { min: v(MAIN.minX, 0, MAIN.minZ), max: v(GARAGE.maxX, GROUND_HEIGHT, MAIN.maxZ) },
    spaceIds: spaces.filter((item) => item.storeyId === "ground").map((item) => item.id),
    elementIds: elements.filter((item) => item.storeyId === "ground").map((item) => item.id),
  },
  {
    id: "upper",
    level: 1,
    elevationM: UPPER_ELEVATION,
    clearHeightM: UPPER_HEIGHT,
    bounds: { min: v(MAIN.minX, UPPER_ELEVATION, MAIN.minZ), max: v(MAIN.maxX, UPPER_ELEVATION + UPPER_HEIGHT, MAIN.maxZ) },
    spaceIds: spaces.filter((item) => item.storeyId === "upper").map((item) => item.id),
    elementIds: elements.filter((item) => item.storeyId === "upper").map((item) => item.id),
  },
];

const auditTopology = (building: Building): AuditResult => {
  const issues: string[] = [];
  const spaceMap = new Map(building.spaces.map((item) => [item.id, item]));
  const openingIds = new Set<string>();
  const elementIds = new Set(building.elements.map((item) => item.id));
  for (const opening of building.openings) {
    if (openingIds.has(opening.id)) issues.push(`duplicate opening: ${opening.id}`);
    openingIds.add(opening.id);
    if (!elementIds.has(opening.hostElementId)) issues.push(`opening host is missing: ${opening.id}`);
  }
  for (const storey of building.storeys) {
    for (const spaceId of storey.spaceIds) {
      const item = spaceMap.get(spaceId);
      if (!item || item.storeyId !== storey.id) {
        issues.push(`space ${spaceId} is not owned by storey ${storey.id}`);
      }
    }
  }
  const required = [
    "ground/front-entry",
    "ground/living-room",
    "ground/stair-hall",
    "ground/kitchen-dining-family",
    "ground/pantry",
    "ground/powder-room",
    "ground/laundry-mudroom",
    "ground/garage",
    "upper/hall",
    "upper/primary-bedroom",
    "upper/bedroom-two",
    "upper/bedroom-three",
    "upper/bathroom-one",
    "upper/linen-storage",
    "upper/primary-bath",
  ];
  for (const id of required) {
    if (!spaceMap.has(id)) {
      issues.push(`required space is missing: ${id}`);
    }
  }
  const visited = new Set<string>();
  const queue = ["ground/front-entry"];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    for (const next of spaceMap.get(current)?.adjacentSpaceIds ?? []) {
      if (!visited.has(next)) queue.push(next);
    }
  }
  for (const id of required) {
    if (!visited.has(id)) issues.push(`space is disconnected from entry: ${id}`);
  }
  const routeEdges = new Set<string>();
  const edgeKey = (left: string, right: string): string =>
    [left, right].sort((a, b) => a.localeCompare(b)).join("::");
  for (const opening of building.openings) {
    if (opening.fromSpaceId !== null && opening.toSpaceId !== null) {
      const from = spaceMap.get(opening.fromSpaceId);
      const to = spaceMap.get(opening.toSpaceId);
      if (!from || !to) {
        issues.push(`opening endpoint space is missing: ${opening.id}`);
        continue;
      }
      routeEdges.add(edgeKey(opening.fromSpaceId, opening.toSpaceId));
      if (!from.adjacentSpaceIds.includes(opening.toSpaceId)) {
        issues.push(`opening source adjacency is missing: ${opening.id}`);
      }
      if (!to.adjacentSpaceIds.includes(opening.fromSpaceId)) {
        issues.push(`opening destination adjacency is missing: ${opening.id}`);
      }
    }
  }
  routeEdges.add(edgeKey(building.stairConnector.fromSpaceId, building.stairConnector.toSpaceId));
  for (const item of building.spaces) {
    for (const adjacentId of item.adjacentSpaceIds) {
      if (!spaceMap.has(adjacentId)) {
        issues.push(`adjacent space is missing: ${item.id}/${adjacentId}`);
        continue;
      }
      if (!spaceMap.get(adjacentId)?.adjacentSpaceIds.includes(item.id)) {
        issues.push(`space adjacency is not reciprocal: ${item.id}/${adjacentId}`);
      }
      if (!routeEdges.has(edgeKey(item.id, adjacentId))) {
        issues.push(`space adjacency has no opening or connector: ${item.id}/${adjacentId}`);
      }
    }
  }
  for (const space of building.spaces) {
    for (const thresholdId of space.thresholdIds) {
      if (thresholdId !== building.stairConnector.id && !openingIds.has(thresholdId)) {
        issues.push(`space threshold is not represented by an opening or connector: ${space.id}/${thresholdId}`);
      }
    }
  }
  if (building.stairConnector.turnCount !== 1) {
    issues.push("stair connector is not the one required L-turn");
  }
  return { ok: issues.length === 0, issues };
};

const auditSurfaces = (building: Building): AuditResult => {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const owner of building.surfaceOwners) {
    if (ids.has(owner.id)) issues.push(`duplicate surface owner: ${owner.id}`);
    ids.add(owner.id);
  }
  for (const item of building.elements) {
    if (!ids.has(item.surfaceOwnerId)) {
      issues.push(`element ${item.id} has no surface owner: ${item.surfaceOwnerId}`);
    }
    if (item.parts.length === 0) issues.push(`element has no geometry: ${item.id}`);
  }
  for (const space of building.spaces) {
    const finishes = building.elements.filter(
      (item) => item.id === `floor-finish/${space.id}` && item.spaceId === space.id,
    );
    if (finishes.length !== 1) {
      issues.push(`room floor finish count is not one: ${space.id}`);
      continue;
    }
    if (finishes[0].parts[0]?.material !== space.floorMaterial) {
      issues.push(`room floor finish material is incorrect: ${space.id}`);
    }
  }
  return { ok: issues.length === 0, issues };
};

const auditSite = (site: Site): AuditResult => {
  const issues: string[] = [];
  for (const item of site.elements) {
    for (const part of item.parts) {
      const bounds = extent(part.center, part.size);
      if (bounds.min.x < site.boundary.min.x || bounds.max.x > site.boundary.max.x) {
        issues.push(`site element exceeds X boundary: ${item.id}/${part.id}`);
      }
      if (bounds.min.z < site.boundary.min.z || bounds.max.z > site.boundary.max.z) {
        issues.push(`site element exceeds Z boundary: ${item.id}/${part.id}`);
      }
    }
  }
  if (site.streetEdgeZ !== site.boundary.min.z) {
    issues.push("street edge is not the front site boundary");
  }
  return { ok: issues.length === 0, issues };
};

const auditVehicles = (building: Building, site: Site): AuditResult => {
  const issues: string[] = [];
  const all = [...building.elements, ...site.elements];
  for (const item of all) {
    const text = `${item.id} ${item.parts.flatMap((part) => part.tags).join(" ")}`.toLowerCase();
    if (text.includes("vehicle") || text.includes("car") || text.includes("automobile")) {
      issues.push(`vehicle-like authored element: ${item.id}`);
    }
  }
  return { ok: issues.length === 0, issues };
};

const roomReviewPopulation = (building: Building): ReviewObservation[] => {
  const spaces = building.spaces;
  const openingById = new Map(building.openings.map((opening) => [opening.id, opening]));
  const stair = building.stairConnector;
  const observations: ReviewObservation[] = [];
  for (const item of spaces) {
    const { min, max } = item.bounds;
    const center = v((min.x + max.x) / 2, min.y + 1.2, (min.z + max.z) / 2);
    const opening = item.thresholdIds
      .map((thresholdId) => openingById.get(thresholdId))
      .find((candidate): candidate is Opening => candidate !== undefined);
    const routePoint = item.id === stair.fromSpaceId
      ? stair.route[0]
      : item.id === stair.toSpaceId
        ? stair.route[stair.route.length - 1]
        : undefined;
    const boundary = opening?.center ?? routePoint ?? center;
    const deltaX = center.x - boundary.x;
    const deltaZ = center.z - boundary.z;
    const direction = Math.abs(deltaX) >= Math.abs(deltaZ)
      ? v(Math.sign(deltaX) || 1, 0, 0)
      : v(0, 0, Math.sign(deltaZ) || 1);
    observations.push({
      id: `observation.${item.id}.threshold`,
      subjectId: item.id,
      kind: "threshold",
      position: v(boundary.x + direction.x * 0.15, min.y + 1.2, boundary.z + direction.z * 0.15),
      direction,
    });
    const corners: Array<[string, Vec3]> = [
      ["north-west", v(min.x + 0.12, min.y + 1.2, max.z - 0.12)],
      ["north-east", v(max.x - 0.12, min.y + 1.2, max.z - 0.12)],
      ["south-west", v(min.x + 0.12, min.y + 1.2, min.z + 0.12)],
      ["south-east", v(max.x - 0.12, min.y + 1.2, min.z + 0.12)],
    ];
    for (const [name, position] of corners) {
      observations.push({ id: `observation.${item.id}.corner.${name}`, subjectId: item.id, kind: "room-corner", position, direction: v(0, 0, 1) });
    }
    for (const [name, direction] of [
      ["north", v(0, 0, 1)],
      ["east", v(1, 0, 0)],
      ["south", v(0, 0, -1)],
      ["west", v(-1, 0, 0)],
    ] as const) {
      observations.push({ id: `observation.${item.id}.cardinal.${name}`, subjectId: item.id, kind: "room-cardinal", position: center, direction });
    }
  }
  return observations;
};

export const deriveReviewObservationPopulation = (building: Building): readonly ReviewObservation[] => {
  const { min, max } = building.envelope;
  const centerX = (min.x + max.x) / 2;
  const centerZ = (min.z + max.z) / 2;
  const exteriorPad = Math.max(max.x - min.x, max.z - min.z) * 1.35;
  const observations: ReviewObservation[] = [
    { id: "observation.setting", subjectId: building.id, kind: "setting", position: v(centerX, 3.5, min.z - exteriorPad), direction: v(0, -0.08, 1) },
    { id: "observation.elevation.front", subjectId: "surface.elevation.front", kind: "elevation", position: v(centerX, 3.2, min.z - exteriorPad * 0.7), direction: v(0, 0, 1) },
    { id: "observation.elevation.back", subjectId: "surface.elevation.back", kind: "elevation", position: v((MAIN.minX + MAIN.maxX) / 2, 3.2, MAIN.maxZ + exteriorPad * 0.7), direction: v(0, 0, -1) },
    { id: "observation.elevation.left", subjectId: "surface.elevation.left", kind: "elevation", position: v(min.x - exteriorPad * 0.7, 3.2, centerZ), direction: v(1, 0, 0) },
    { id: "observation.elevation.right", subjectId: "surface.elevation.right", kind: "elevation", position: v(max.x + exteriorPad * 0.7, 3.2, centerZ), direction: v(-1, 0, 0) },
    { id: "observation.corner.front-left", subjectId: "building/corner/front-left", kind: "corner", position: v(MAIN.minX - exteriorPad * 0.35, 3.2, MAIN.minZ - exteriorPad * 0.35), direction: v(0.6, 0, 0.8) },
    { id: "observation.corner.front-right", subjectId: "building/corner/front-right", kind: "corner", position: v(GARAGE.maxX + exteriorPad * 0.35, 3.2, GARAGE.minZ - exteriorPad * 0.35), direction: v(-0.6, 0, 0.8) },
    { id: "observation.corner.garage-back-right", subjectId: "building/corner/garage-back-right", kind: "corner", position: v(GARAGE.maxX + exteriorPad * 0.35, 3.2, GARAGE.maxZ + exteriorPad * 0.35), direction: v(-0.8, 0, -0.5) },
    { id: "observation.corner.garage-back-left", subjectId: "building/corner/garage-back-left", kind: "corner", position: v(GARAGE.minX - exteriorPad * 0.35, 3.2, GARAGE.maxZ + exteriorPad * 0.35), direction: v(0.8, 0, -0.5) },
    { id: "observation.corner.back-right", subjectId: "building/corner/back-right", kind: "corner", position: v(MAIN.maxX + exteriorPad * 0.35, 3.2, MAIN.maxZ + exteriorPad * 0.35), direction: v(-0.6, 0, -0.8) },
    { id: "observation.corner.back-left", subjectId: "building/corner/back-left", kind: "corner", position: v(MAIN.minX - exteriorPad * 0.35, 3.2, MAIN.maxZ + exteriorPad * 0.35), direction: v(0.6, 0, -0.8) },
    { id: "observation.roof.main-north", subjectId: "surface.roof.main.north", kind: "roof", position: v(MAIN.minX - exteriorPad * 0.4, max.y + exteriorPad * 0.35, centerZ), direction: v(0.5, -0.8, 0) },
    { id: "observation.roof.main-south", subjectId: "surface.roof.main.south", kind: "roof", position: v(MAIN.maxX + exteriorPad * 0.4, max.y + exteriorPad * 0.35, centerZ), direction: v(-0.5, -0.8, 0) },
    { id: "observation.roof.garage", subjectId: "surface.roof.garage", kind: "roof", position: v((GARAGE.minX + GARAGE.maxX) / 2, max.y * 0.85, GARAGE.minZ - exteriorPad * 0.25), direction: v(-0.3, -0.85, 0.3) },
    { id: "observation.roof.garage-underside", subjectId: "surface.roof.garage", kind: "roof", position: v((GARAGE.minX + GARAGE.maxX) / 2, GROUND_HEIGHT + 0.2, GARAGE.maxZ + 0.4), direction: v(0, 1, -0.2) },
  ];
  observations.push(...building.openings.map((opening) => ({
    id: `observation.opening.${opening.id}`,
    subjectId: opening.id,
    kind: "opening" as const,
    position: opening.center,
    direction: opening.axis === "x" ? v(0, 0, opening.center.z < 0 ? 1 : -1) : v(opening.center.x < 0 ? 1 : -1, 0, 0),
  })));
  observations.push(...roomReviewPopulation(building));
  return observations;
};

export const buildModernSuburbanHouse = (): HouseLibrary => {
  const spaces = [...groundSpaces(), ...upperSpaces()];
  const elements: Element[] = [];
  const openings: Opening[] = [];
  for (const wall of [...mainWalls("ground", GROUND_ELEVATION, GROUND_HEIGHT), ...mainWalls("upper", UPPER_ELEVATION, UPPER_HEIGHT), ...garageWalls()]) {
    const result = makeWall(wall);
    elements.push(result.element);
    openings.push(...result.openings);
  }
  addGroundPartitions(elements, openings);
  addUpperPartitions(elements, openings);
  addFloorAndCeilingElements(elements, spaces);
  elements.push(...stairElements(), ...roofElements(), ...chimneyElements());
  for (const opening of openings) addOpeningElement(opening, elements);
  addInteriorFitOut(elements, spaces);
  const laws = moduleLaws();
  elements.push(...moduleElements(laws));
  const buildingEnvelope = unionBounds(elements.flatMap((item) => item.parts));
  const site: Site = {
    boundary: { min: v(-12, -0.2, -8), max: v(14, 0.8, 9) },
    streetEdgeZ: -8,
    elements: siteElements(),
  };
  const building: Building = {
    id: "modern-suburban-house/building",
    envelope: buildingEnvelope,
    storeys: makeStoreys(spaces, elements),
    spaces,
    elements,
    openings,
    surfaceOwners: surfaceOwners(),
    stairConnector: {
      id: "connector/stair-ground-to-upper",
      fromSpaceId: "ground/stair-hall",
      toSpaceId: "upper/hall",
      route: [v(-0.3, 0.08, -3.7), v(-0.3, UPPER_ELEVATION * (14 / 18), -0.1), v(0.45, UPPER_ELEVATION + 0.08, -0.1)],
      stepCount: 18,
      riseM: UPPER_ELEVATION / 18,
      turnCount: 1,
    },
  };
  const reviewPopulation = deriveReviewObservationPopulation(building);
  const topologyAudit = auditTopology(building);
  const surfaceAudit = auditSurfaces(building);
  const siteAudit = auditSite(site);
  const vehicleAudit = auditVehicles(building, site);
  return {
    id: "modern-suburban-house",
    site,
    building,
    moduleLaws: laws,
    reviewPopulation,
    topologyAudit,
    surfaceAudit,
    siteAudit,
    vehicleAudit,
    quantities: {
      mainFootprintM2: 11 * 9.6,
      garageFootprintM2: 5.8 * 6.2,
      grossTargetM2: 246,
      elementCount: building.elements.length + site.elements.length,
      openingCount: openings.length,
      roomCount: spaces.length,
    },
  };
};

export const modernSuburbanHouse = buildModernSuburbanHouse();

export const allHouseAuditsPass = (library: HouseLibrary): boolean =>
  library.topologyAudit.ok && library.surfaceAudit.ok && library.siteAudit.ok && library.vehicleAudit.ok;

export const houseContentBounds = (library: HouseLibrary): Bounds => {
  const parts = library.building.elements.flatMap((item) => item.parts);
  return unionBounds(parts);
};
