/**
 * `house-environment`: the engine-facing built-environment record of the
 * house, the one handoff from spaces source to the renderer and to spatial
 * queries.
 *
 * Design owner: `docs/spaces/04-observations.md#engine-render-handoff`. Every
 * emitted part becomes one generated model and one building element under the
 * `house-root` element, so `lowerBuiltEnvironment` stages exactly the geometry
 * the owners emitted. Logical spaces form one tree: `house-site` contains the
 * `house` building, which contains `ground-storey` and `upper-storey`; each
 * room hangs under its storey, and `main-stair` stays under `ground-storey`
 * (`02-stair.md#stair-connector-handoff`). A room's volume is its finished
 * inner outline cut into axis-aligned convex cells between its finished floor
 * and ceiling, so an L-shaped room keeps its notch instead of its hull. Each
 * room's floor finish top is its standable surface.
 *
 * `main-stair-connection` is the one stair connector: front-entry to
 * upper-hall through the lower flight, the landing centre and the upper
 * flight, with `landings.at` measured along the 3D route and no uniform
 * `steps` summary (02 decides the omission).
 *
 * Invalid topology is refused, not repaired: a part whose owner maps to no
 * space, a room outline that is not rectilinear, and any violation reported by
 * `validateBuiltEnvironment` throw with the owner and path.
 */
import { srgbHexToLinearColor, validateBuiltEnvironment } from "@automovie/engine";
import type {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieBuiltSurface,
  IAutoMovieConvexSpaceCell,
  IAutoMovieModel,
  IAutoMovieVector3,
} from "@automovie/interface";

import { GARAGE, MAIN } from "./building";
import { type IHouse, buildHouse } from "./house";
import { roomLevels } from "./rooms/shared";
import type { IHousePart, IPlanPoint } from "./solids";
import { CEILING_RESERVATION, GROUND_LAYERS, STOREYS } from "./storeys";

/** Axis-aligned box, world metres. */
interface IBox {
  x: readonly [number, number];
  y: readonly [number, number];
  z: readonly [number, number];
}

const IDENTITY = { translation: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } };

const cell = (id: string, b: IBox): IAutoMovieConvexSpaceCell => ({
  id,
  planes: [
    { normal: { x: 1, y: 0, z: 0 }, offset: b.x[1] },
    { normal: { x: -1, y: 0, z: 0 }, offset: -b.x[0] },
    { normal: { x: 0, y: 1, z: 0 }, offset: b.y[1] },
    { normal: { x: 0, y: -1, z: 0 }, offset: -b.y[0] },
    { normal: { x: 0, y: 0, z: 1 }, offset: b.z[1] },
    { normal: { x: 0, y: 0, z: -1 }, offset: -b.z[0] },
  ],
});

/**
 * Cut a rectilinear outline into rectangles: one X strip between each pair of
 * consecutive vertex X values, split into the Z intervals the outline covers
 * at the strip's middle. Refuses a non-rectilinear outline.
 */
const rectangles = (owner: string, outline: readonly IPlanPoint[]): { x: [number, number]; z: [number, number] }[] => {
  for (let i = 0; i < outline.length; ++i) {
    const a = outline[i]!;
    const b = outline[(i + 1) % outline.length]!;
    if (a.x !== b.x && a.z !== b.z) throw new Error(`${owner}: outline edge (${a.x}, ${a.z}) → (${b.x}, ${b.z}) is not axis-aligned`);
  }
  const xs = [...new Set(outline.map((p) => p.x))].sort((a, b) => a - b);
  const result: { x: [number, number]; z: [number, number] }[] = [];
  for (let i = 0; i + 1 < xs.length; ++i) {
    const mid = (xs[i]! + xs[i + 1]!) / 2;
    const crossings: number[] = [];
    for (let k = 0; k < outline.length; ++k) {
      const a = outline[k]!;
      const b = outline[(k + 1) % outline.length]!;
      if (a.z === b.z && Math.min(a.x, b.x) < mid && mid < Math.max(a.x, b.x)) crossings.push(a.z);
    }
    crossings.sort((a, b) => a - b);
    if (crossings.length % 2 !== 0) throw new Error(`${owner}: outline is not closed at X = ${mid}`);
    for (let k = 0; k < crossings.length; k += 2) result.push({ x: [xs[i]!, xs[i + 1]!], z: [crossings[k]!, crossings[k + 1]!] });
  }
  return result;
};

/** Logical space of each part owner; a part whose owner is absent is refused. */
const OWNER_SPACE: Readonly<Record<string, string>> = {
  "floors/ground.ts": "ground-storey",
  "floors/upper.ts": "house",
  "garage.ts": "house",
  "envelope/front.ts": "house",
  "envelope/rear.ts": "house",
  "envelope/left.ts": "house",
  "envelope/right.ts": "house",
  "roof/main-front.ts": "house",
  "roof/main-back.ts": "house",
  "roof/front-gable-left.ts": "house",
  "roof/front-gable-right.ts": "house",
  "roof/right-front.ts": "house",
  "roof/right-back.ts": "house",
  "roof/garage-front.ts": "house",
  "roof/garage-back.ts": "house",
  "stair.ts": "main-stair",
  "porch.ts": "house-site",
  "site/front-walk.ts": "house-site",
  "site/driveway.ts": "house-site",
  "site/side-walk.ts": "house-site",
  "site/terrace.ts": "house-site",
  "site/fence.ts": "house-site",
};

const spaceOfPart = (house: IHouse, p: IHousePart): string => {
  const room = house.spaces.find((s) => s.owner === p.owner);
  if (room !== undefined) return room.id;
  const space = OWNER_SPACE[p.owner];
  if (space === undefined) throw new Error(`part "${p.id}" has owner ${p.owner}, which maps to no logical space`);
  return space;
};

const hex = (color: number): string => `#${color.toString(16).padStart(6, "0")}`;

/** One generated single-part model per emitted part, keyed by the part id. */
const modelOf = (p: IHousePart): IAutoMovieModel => ({
  id: p.id,
  name: p.id,
  origin: "generated",
  skeleton: null,
  asset: null,
  body: null,
  materials: [
    {
      id: `${p.id}-base`,
      name: `${p.id}-base`,
      baseColor: srgbHexToLinearColor(hex(p.color)),
      metallic: 0,
      roughness: 0.8,
      opacity: 1,
      alphaMode: "opaque",
      doubleSided: false,
      baseColorTexture: null,
      emissive: null,
      transmission: 0,
      ior: 1.5,
      thickness: 0,
      clearcoat: 0,
    },
  ],
  parts: [{ id: "solid", name: p.id, material: `${p.id}-base`, attachedBone: null, transform: null, geometry: { type: "mesh", mesh: p.mesh } }],
});

/** Plan and height bounds of a part's mesh. */
const boundsOf = (parts: readonly IHousePart[]): IBox => {
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const p of parts)
    for (let i = 0; i < p.mesh.positions.length; ++i) {
      const axis = i % 3;
      lo[axis] = Math.min(lo[axis]!, p.mesh.positions[i]!);
      hi[axis] = Math.max(hi[axis]!, p.mesh.positions[i]!);
    }
  return { x: [lo[0]!, hi[0]!], y: [lo[1]!, hi[1]!], z: [lo[2]!, hi[2]!] };
};

/** Route of the one stair connector (02 stair-reservation, stair-connector-handoff). */
const STAIR_ROUTE: readonly IAutoMovieVector3[] = [
  { x: -1.225, y: STOREYS.groundFloor, z: -0.85 },
  { x: -1.225, y: STOREYS.groundFloor, z: -1.45 },
  { x: -1.225, y: 1.36, z: -3.41 },
  { x: -1.225, y: 1.36, z: -3.985 },
  { x: -0.65, y: 1.36, z: -3.985 },
  { x: 1.87, y: STOREYS.upperFloor, z: -3.985 },
  { x: 2.47, y: STOREYS.upperFloor, z: -3.985 },
];
const STAIR_LANDING_STATION = 3;

const length = (route: readonly IAutoMovieVector3[], upTo: number): number => {
  let sum = 0;
  for (let i = 1; i <= upTo; ++i) {
    const a = route[i - 1]!;
    const b = route[i]!;
    sum += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  }
  return sum;
};

/** Build the house's built-environment record; throws on invalid topology. */
export const buildHouseEnvironment = (house: IHouse = buildHouse()): IAutoMovieBuiltEnvironment => {
  const site = boundsOf(house.parts);
  const top = boundsOf(house.parts.filter((p) => OWNER_SPACE[p.owner] === "house")).y[1];
  const groundBottom = STOREYS.groundFloor - GROUND_LAYERS.finish - GROUND_LAYERS.base;
  const garageBottom = STOREYS.garageFloor - GROUND_LAYERS.garageBase;
  const spaces: IAutoMovieBuiltSpace[] = [
    { id: "house-site", kind: "site", parent: null, cells: [cell("house-site/0", { x: site.x, y: site.y, z: site.z })] },
    {
      id: "house",
      kind: "building",
      parent: "house-site",
      cells: [
        cell("house/main", { x: MAIN.outer.x, y: [site.y[0], top], z: MAIN.outer.z }),
        cell("house/garage", { x: GARAGE.outer.x, y: [site.y[0], top], z: GARAGE.outer.z }),
      ],
    },
    {
      id: "ground-storey",
      kind: "storey",
      parent: "house",
      cells: [
        cell("ground-storey/main", { x: MAIN.outer.x, y: [groundBottom, STOREYS.upperFloor], z: MAIN.outer.z }),
        cell("ground-storey/garage", { x: GARAGE.outer.x, y: [garageBottom, STOREYS.garageCeiling + CEILING_RESERVATION], z: GARAGE.outer.z }),
      ],
    },
    {
      id: "upper-storey",
      kind: "storey",
      parent: "house",
      cells: [cell("upper-storey/main", { x: MAIN.outer.x, y: [STOREYS.groundCeiling, STOREYS.upperCeiling + CEILING_RESERVATION], z: MAIN.outer.z })],
    },
    {
      id: "main-stair",
      kind: "stair",
      parent: "ground-storey",
      cells: [
        cell("main-stair/lower-flight", { x: [-1.8, -0.65], y: [STOREYS.groundFloor, STOREYS.upperCeiling], z: [-4.56, -1.45] }),
        cell("main-stair/upper-flight", { x: [-0.65, 1.87], y: [STOREYS.groundFloor, STOREYS.upperCeiling], z: [-4.56, -3.41] }),
      ],
    },
  ];
  const surfaces: IAutoMovieBuiltSurface[] = [];
  for (const room of house.spaces) {
    const [floor, ceiling] = roomLevels(room);
    spaces.push({
      id: room.id,
      kind: "room",
      parent: room.storey,
      cells: rectangles(room.owner, room.outline).map((r, i) => cell(`${room.id}/${i}`, { x: r.x, y: [floor, ceiling], z: r.z })),
    });
    surfaces.push({
      space: room.id,
      surface: {
        id: `${room.id}-floor-surface`,
        kind: "floor",
        polygon: room.outline.map((p) => ({ x: p.x, y: 0, z: p.z })),
        anchor: { x: room.outline[0]!.x, y: floor, z: room.outline[0]!.z },
        rampTo: null,
      },
    });
  }
  const elements: IAutoMovieBuiltElement[] = [
    { id: "house-root", kind: "building", parent: null, model: null, space: "house", transform: IDENTITY },
    ...house.parts.map((p) => ({ id: p.id, kind: p.role, parent: "house-root", model: p.id, space: spaceOfPart(house, p), transform: IDENTITY })),
  ];
  const stair: IAutoMovieBuiltConnector = {
    id: "main-stair-connection",
    kind: "stair",
    from: "front-entry",
    to: "upper-hall",
    bidirectional: true,
    landings: [{ space: "main-stair", at: length(STAIR_ROUTE, STAIR_LANDING_STATION) / length(STAIR_ROUTE, STAIR_ROUTE.length - 1) }],
    route: [...STAIR_ROUTE],
    width: 1.0,
    clearHeight: 2.0,
    elements: house.parts.filter((p) => p.owner === "stair.ts").map((p) => p.id),
  };
  const environment: IAutoMovieBuiltEnvironment = {
    version: 1,
    id: "modern-suburban-house",
    units: "meter",
    buildings: [{ id: "house", element: "house-root", space: "house-site" }],
    models: house.parts.map(modelOf),
    modelReferences: [],
    elements,
    spaces,
    boundaries: [],
    openings: [],
    connectors: [stair],
    surfaces,
    walkable: surfaces.map((s) => s.surface.id),
  };
  const validation = validateBuiltEnvironment({ environment });
  if (validation.success === false)
    throw new Error(
      `house environment is invalid:\n${validation.violations
        .slice(0, 12)
        .map((v) => `  ${v.path}: expected ${v.expected}`)
        .join("\n")}`,
    );
  return environment;
};
