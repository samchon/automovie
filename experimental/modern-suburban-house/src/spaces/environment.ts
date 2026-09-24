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
import { builtSpaceContainsPoint, srgbHexToLinearColor, validateBuiltEnvironment } from "@automovie/engine";
import type {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieBuiltSpace,
  IAutoMovieBuiltSurface,
  IAutoMovieConvexSpaceCell,
  IAutoMovieModel,
  IAutoMovieVector3,
} from "@automovie/interface";

import { GARAGE, MAIN } from "./building";
import { clipOutline, segmentsOf } from "./boundaries";
import { type IHouse, buildHouse } from "./house";
import { roomLevels } from "./rooms/shared";
import { checkRouteNetwork } from "./routes";
import { driveTop } from "./site/driveway";
import { ZONE_HEAD_CLEARANCE } from "./site/zone";
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

/** Quarter turn about world Y taking a face's local +X to world +Z (walls along Z). */
const TO_Z_AXIS = { x: 0, y: -Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };

/** Kind of a void from its id: every void id names what it is. */
const openingKind = (owner: string, id: string): "door" | "window" | "opening" => {
  if (id.endsWith("-window")) return "window";
  if (id.endsWith("-door")) return "door";
  if (id.endsWith("-opening")) return "opening";
  throw new Error(`${owner}: void "${id}" names no door, window or opening`);
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

/**
 * The doorless exterior links of the route network (05): the porch's three
 * risers, the front walk's cross connector, the garden steps, and the side
 * path from the driveway past the side gate to the lower landing. Each route
 * runs on the paving centre line its owner builds; the side gate passage names
 * the gate leaf as its element (the gate is opened for the route check).
 */
const exteriorConnectors = (house: IHouse): IAutoMovieBuiltConnector[] => {
  const ids = (owner: string, prefix: string): string[] => house.parts.filter((p) => p.owner === owner && p.id.startsWith(prefix)).map((p) => p.id);
  const passage = (id: string, from: string, to: string, route: IAutoMovieVector3[], elements: string[], kind: "passage" | "stair" = "passage", width = kind === "stair" ? 1.5 : 1.2): IAutoMovieBuiltConnector => ({
    id,
    kind,
    from,
    to,
    bidirectional: true,
    route,
    width,
    clearHeight: ZONE_HEAD_CLEARANCE,
    elements,
  });
  return [
    passage("porch-steps", "front-walk", "front-porch", [{ x: 0.9, y: -0.45, z: 3.2 }, { x: 0.9, y: -0.45, z: 2.8 }, { x: 0.9, y: 0, z: 2.2 }, { x: 0.9, y: 0, z: 1.6 }], ids("porch.ts", "porch-step-"), "stair"),
    passage("front-walk-connector", "driveway", "front-walk", [{ x: 6.5, y: driveTop(4.85), z: 4.85 }, { x: 1.65, y: -0.45, z: 4.85 }, { x: 1.2, y: -0.45, z: 4.85 }], ids("site/front-walk.ts", "front-walk-connector")),
    passage("garden-steps", "garden-terrace", "garden-lower-landing", [{ x: 0, y: 0, z: -13.9 }, { x: 0, y: 0, z: -14.4 }, { x: 0, y: -0.45, z: -15 }, { x: 0, y: -0.45, z: -15.6 }], ids("site/terrace.ts", "garden-step-"), "stair"),
    passage("side-front-path", "driveway", "side-front-access", [{ x: 10.8, y: driveTop(5.7), z: 5.7 }, { x: 12.9, y: -0.45, z: 5.7 }, { x: 12.9, y: -0.45, z: 0.55 }], ids("site/side-walk.ts", "side-walk")),
    passage("side-yard-gate-passage", "side-front-access", "side-rear-access", [{ x: 12.9, y: -0.45, z: 0.55 }, { x: 12.9, y: -0.45, z: -0.3 }, { x: 12.9, y: -0.45, z: -2.35 }], ["side-yard-gate-leaf"], "passage", 1.05),
    passage("side-rear-path", "side-rear-access", "garden-lower-landing", [{ x: 12.9, y: -0.45, z: -2.35 }, { x: 12.9, y: -0.45, z: -16.8 }, { x: 0, y: -0.45, z: -16.8 }, { x: 0, y: -0.45, z: -15.6 }], ids("site/side-walk.ts", "side-walk")),
  ];
};

/**
 * World centre and face normal of one opening's void, and the reach from the
 * wall's mid-plane to 0.05 m beyond either face: the one place route checks and
 * observations read which outside zone an envelope opening opens on to.
 * Throws when the opening, its host face or its void is missing.
 */
export const openingAxis = (environment: IAutoMovieBuiltEnvironment, openingId: string): { centre: IAutoMovieVector3; normal: IAutoMovieVector3; reach: number } => {
  const opening = environment.openings.find((o) => o.id === openingId);
  const face = opening === undefined ? undefined : environment.boundaries.find((b) => b.id === opening.boundary)?.face;
  if (opening === undefined || face === undefined || opening.profile === undefined) throw new Error(`opening "${openingId}" has no host face or void`);
  const n = opening.profile.outline.length;
  const cx = opening.profile.outline.reduce((s, q) => s + q.x, 0) / n;
  const cy = opening.profile.outline.reduce((s, q) => s + q.y, 0) / n;
  const r = face.rotation;
  const rotate = (v: IAutoMovieVector3): IAutoMovieVector3 => {
    const t = { x: 2 * (r.y * v.z - r.z * v.y), y: 2 * (r.z * v.x - r.x * v.z), z: 2 * (r.x * v.y - r.y * v.x) };
    return { x: v.x + r.w * t.x + (r.y * t.z - r.z * t.y), y: v.y + r.w * t.y + (r.z * t.x - r.x * t.z), z: v.z + r.w * t.z + (r.x * t.y - r.y * t.x) };
  };
  const local = rotate({ x: cx, y: cy, z: 0 });
  return {
    centre: { x: face.origin.x + local.x, y: face.origin.y + local.y, z: face.origin.z + local.z },
    normal: rotate({ x: 0, y: 0, z: 1 }),
    reach: face.thickness / 2 + 0.05,
  };
};

/**
 * Refuse a connector whose route does not start in its `from` space and end in
 * its `to` space, or whose landing point, read at `at` along the 3D route,
 * lies outside the landing space: the public validation checks landing ids and
 * ranges but not that the point stands on the landing (04 engine-render-handoff).
 */
export const checkConnectors = (environment: IAutoMovieBuiltEnvironment): void => {
  const spaces = new Map(environment.spaces.map((s) => [s.id, s]));
  const inside = (id: string, p: IAutoMovieVector3): boolean => {
    const s = spaces.get(id);
    return s !== undefined && builtSpaceContainsPoint(s, p);
  };
  const failures: string[] = [];
  for (const c of environment.connectors) {
    const route = c.route;
    if (!inside(c.from, route[0]!)) failures.push(`${c.id}: route starts outside "${c.from}"`);
    if (!inside(c.to, route[route.length - 1]!)) failures.push(`${c.id}: route ends outside "${c.to}"`);
    const total = length(route, route.length - 1);
    for (const landing of c.landings ?? []) {
      let rest = landing.at * total;
      let point = route[route.length - 1]!;
      for (let i = 1; i < route.length; ++i) {
        const a = route[i - 1]!;
        const b = route[i]!;
        const step = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
        if (rest <= step) {
          const f = step === 0 ? 0 : rest / step;
          point = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f };
          break;
        }
        rest -= step;
      }
      if (!inside(landing.space, point)) failures.push(`${c.id}: landing at ${landing.at.toFixed(3)} (${point.x.toFixed(3)}, ${point.y.toFixed(3)}, ${point.z.toFixed(3)}) is outside "${landing.space}"`);
    }
  }
  if (failures.length > 0) throw new Error(`connectors fail:\n  ${failures.join("\n  ")}`);
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
        // Under treads 7-9 the entry coat closet (entry-coat-storage) takes the volume up to its top.
        cell("main-stair/upper-flight", { x: [-0.65, 1.03], y: [STOREYS.groundFloor, STOREYS.upperCeiling], z: [-4.56, -3.41] }),
        cell("main-stair/upper-flight-over-closet", { x: [1.03, 1.87], y: [2.15, STOREYS.upperCeiling], z: [-4.56, -3.41] }),
        // The floor opening runs on to the front wall (02 stair-floor-opening): above the
        // entry ceiling the void X = [-1.80, -0.65], Z = [-1.45, -0.25] is stair space too.
        cell("main-stair/front-void", { x: [-1.8, -0.65], y: [STOREYS.groundCeiling, STOREYS.upperCeiling], z: [-1.45, -0.25] }),
      ],
    },
  ];
  for (const { room, storage } of house.storages)
    spaces.push({ id: storage.id, kind: "storage", parent: room.storey, cells: [cell(`${storage.id}/0`, storage)] });
  const surfaces: IAutoMovieBuiltSurface[] = [];
  for (const zone of house.zones) {
    const ys = zone.rampTo === null ? [zone.anchor.y] : [zone.anchor.y, zone.rampTo.y];
    const y: [number, number] = [Math.min(...ys), Math.max(...ys) + ZONE_HEAD_CLEARANCE];
    spaces.push({
      id: zone.id,
      kind: "exterior",
      // Every exterior zone of the route table sits on the ground storey (05, site-access-interface).
      parent: "ground-storey",
      cells: rectangles(zone.owner, zone.outline).map((r, i) => cell(`${zone.id}/${i}`, { x: r.x, y, z: r.z })),
    });
    surfaces.push({
      space: zone.id,
      surface: {
        id: `${zone.id}-ground-surface`,
        kind: zone.rampTo === null ? "platform" : "ramp",
        polygon: zone.outline.map((q) => ({ x: q.x, y: 0, z: q.z })),
        anchor: zone.anchor,
        rampTo: zone.rampTo,
      },
    });
  }
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
  const boundaries: IAutoMovieBuiltBoundary[] = [];
  const openings: IAutoMovieBuiltOpening[] = [];
  // Boundaries separate the building's own spaces. Outside a wall, porch, walk,
  // driveway and terrace zones are all the exterior: such a wall segment encloses
  // its one inside space, which is how the engine reads an envelope face.
  const inner = spaces.filter((s) => s.kind === "room" || s.kind === "stair" || s.kind === "storage");
  for (const p of house.parts) {
    const face = p.wall;
    if (face === undefined) continue;
    const center = (face.across[0] + face.across[1]) / 2;
    const segments = segmentsOf(inner, face);
    const idOf = (k: number): string => `${p.id}/${segments[k]!.sides.join("|")}/${k}`;
    segments.forEach((seg, k) => {
      boundaries.push({
        id: idOf(k),
        kind: p.role,
        spaces: seg.sides.filter((s) => s !== "house-site"),
        elements: [p.id],
        face: {
          origin: face.axis === "x" ? { x: 0, y: 0, z: center } : { x: center, y: 0, z: 0 },
          rotation: face.axis === "x" ? { x: 0, y: 0, z: 0, w: 1 } : TO_Z_AXIS,
          outline: clipOutline(face.outline, seg.u, seg.y).map((q) => ({ x: q.u, y: q.y })),
          thickness: face.across[1] - face.across[0],
        },
      });
    });
    for (const hole of face.holes) {
      // The opening is the passage part of the void: its overlap with the boundary
      // segment holding the void centre. A void part below both finished floors is
      // threshold and base zone, not passage between the two spaces.
      const cu = (hole.from + hole.to) / 2;
      const cy = (hole.bottom + hole.top) / 2;
      const k = segments.findIndex((s) => s.u[0] <= cu && cu <= s.u[1] && s.y[0] <= cy && cy <= s.y[1]);
      if (k < 0) throw new Error(`${p.owner}: void "${hole.id}" in "${p.id}" lies in no boundary between two spaces`);
      const seg = segments[k]!;
      const u0 = Math.max(hole.from, seg.u[0]);
      const u1 = Math.min(hole.to, seg.u[1]);
      const y0 = Math.max(hole.bottom, seg.y[0]);
      const y1 = Math.min(hole.top, seg.y[1]);
      if (u1 - u0 < 0.3 || y1 - y0 < 0.3) throw new Error(`${p.owner}: void "${hole.id}" leaves only [${u0}, ${u1}] × [${y0}, ${y1}] between ${seg.sides.join(" and ")}`);
      openings.push({
        id: hole.id,
        kind: openingKind(p.owner, hole.id),
        boundary: idOf(k),
        fill: null,
        profile: { outline: [{ x: u0, y: y0 }, { x: u1, y: y0 }, { x: u1, y: y1 }, { x: u0, y: y1 }] },
      });
    }
  }
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
    boundaries,
    openings,
    connectors: [stair, ...exteriorConnectors(house)],
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
  checkConnectors(environment);
  checkRouteNetwork(environment);
  return environment;
};
