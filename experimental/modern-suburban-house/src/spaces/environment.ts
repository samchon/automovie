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
import {
  builtSpaceContainsPoint,
  srgbHexToLinearColor,
  validateBuiltEnvironment,
} from "@automovie/engine";
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
import { buildHouse, type IHouse } from "./house";
import { roomLevels } from "./rooms/shared";
import { checkRouteNetwork } from "./routes";
import { driveTop, DRIVEWAY } from "./site/driveway";
import { FRONT_WALK } from "./site/front-walk";
import { SIDE_WALK } from "./site/side-walk";
import { LOWER_LANDING, TERRACE_EDGE_Z } from "./site/terrace";
import { PORCH_STEP_BACK_Z, PORCH_STEP_CENTRE_X } from "./porch";
import {
  STAIR_LANDING_STATION,
  STAIR_OPENING,
  STAIR_ROUTE,
  STAIR_STEPS,
} from "./stair";
import { COAT_STORAGE } from "./rooms/entry";
import { ZONE_HEAD_CLEARANCE, type IExteriorZone } from "./site/zone";
import type { IHousePart, IPlanPoint } from "./solids";
import {
  CEILING_RESERVATION,
  GROUND_LAYERS,
  INTERSTOREY_FLOOR_FINISH,
  STOREYS,
} from "./storeys";

/** Axis-aligned box, world metres. */
interface IBox {
  x: readonly [number, number];
  y: readonly [number, number];
  z: readonly [number, number];
}

const IDENTITY = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

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
    if (a.x !== b.x && a.z !== b.z) throw new Error(
      `${owner}: outline edge (${a.x}, ${a.z}) → (${b.x}, ${b.z}) is not axis-aligned`,
    );
  }
  const xs = [...new Set(outline.map((p) => p.x))].sort((a, b) => a - b);
  const result: { x: [number, number]; z: [number, number] }[] = [];
  for (let i = 0; i + 1 < xs.length; ++i) {
    const mid = (xs[i]! + xs[i + 1]!) / 2;
    const crossings: number[] = [];
    for (let k = 0; k < outline.length; ++k) {
      const a = outline[k]!;
      const b = outline[(k + 1) % outline.length]!;
      if (a.z === b.z && Math.min(a.x, b.x) < mid && mid < Math.max(a.x, b.x)) crossings.push(
        a.z,
      );
    }
    crossings.sort((a, b) => a - b);
    if (crossings.length % 2 !== 0) throw new Error(
      `${owner}: outline is not closed at X = ${mid}`,
    );
    for (let k = 0; k < crossings.length; k += 2) result.push({
      x: [xs[i]!, xs[i + 1]!],
      z: [crossings[k]!, crossings[k + 1]!],
    });
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
  if (space === undefined) throw new Error(
    `part "${p.id}" has owner ${p.owner}, which maps to no logical space`,
  );
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
  parts: [
    {
      id: "solid",
      name: p.id,
      material: `${p.id}-base`,
      attachedBone: null,
      transform: null,
      geometry: { type: "mesh", mesh: p.mesh },
    },
  ],
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

/** An actual solid-mesh witness, so a wall's bounding box cannot hide an opening. */
const containsMeshPoint = (part: IHousePart, point: IAutoMovieVector3): boolean => {
  const mesh = part.mesh;
  if (mesh.indices === null) return false;
  const hits: number[] = [];
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const v = [0, 1, 2].map((k) => {
      const at = 3 * mesh.indices![i + k]!;
      return {
        x: mesh.positions[at]!,
        y: mesh.positions[at + 1]!,
        z: mesh.positions[at + 2]!,
      };
    });
    const [a, b, c] = v as [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3];
    const d = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z);
    if (Math.abs(d) < 1e-10) continue;
    const u = ((b.z - c.z) * (point.x - c.x) + (c.x - b.x) * (point.z - c.z)) / d;
    const w = ((c.z - a.z) * (point.x - c.x) + (a.x - c.x) * (point.z - c.z)) / d;
    if (u < -1e-7 || w < -1e-7 || u + w > 1 + 1e-7) continue;
    const y = u * a.y + w * b.y + (1 - u - w) * c.y;
    if (y > point.y + 1e-7 && !hits.some((old) => Math.abs(old - y) < 1e-6)) hits.push(
      y,
    );
  }
  return hits.length % 2 === 1;
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
 * runs on the paving centre line its owner builds; the side gate passage binds
 * the two space-owned gate posts. The later model leaf is tested separately.
 */
const exteriorConnectors = (house: IHouse): IAutoMovieBuiltConnector[] => {
  const zone = (id: string): IExteriorZone => {
    const found = house.zones.find((z) => z.id === id);
    if (found === undefined) throw new Error(`connector zone ${id} is absent`);
    return found;
  };
  const walk = zone("front-walk");
  const porch = zone("front-porch");
  const side = zone("side-front-access");
  const sideRear = zone("side-rear-access");
  const garden = zone("garden-lower-landing");
  const ids = (owner: string, prefix: string): string[] => house.parts.filter((p) => p.owner === owner && p.id.startsWith(prefix)).map(
    (p) => p.id,
  );
  const passage = (id: string, from: string, to: string, route: IAutoMovieVector3[], elements: string[], kind: "passage" | "stair" = "passage", width = kind === "stair"
    ? 1.5
    : 1.2): IAutoMovieBuiltConnector => ({
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
    passage(
      "porch-steps",
      "front-walk",
      "front-porch",
      [
        { x: PORCH_STEP_CENTRE_X, y: walk.anchor.y, z: FRONT_WALK.z[0] + 0.4 },
        { x: PORCH_STEP_CENTRE_X, y: walk.anchor.y, z: FRONT_WALK.z[0] },
        { x: PORCH_STEP_CENTRE_X, y: porch.anchor.y, z: PORCH_STEP_BACK_Z },
        { x: PORCH_STEP_CENTRE_X, y: porch.anchor.y, z: porch.anchor.z },
      ],
      ids("porch.ts", "porch-step-"),
      "stair",
    ),
    passage(
      "front-walk-connector",
      "driveway",
      "front-walk",
      [
        {
          x: DRIVEWAY.x[0] + 0.6,
          y: driveTop((FRONT_WALK.connectorZ[0] + FRONT_WALK.connectorZ[1]) / 2),
          z: (FRONT_WALK.connectorZ[0] + FRONT_WALK.connectorZ[1]) / 2,
        },
        {
          x: FRONT_WALK.x[1],
          y: walk.anchor.y,
          z: (FRONT_WALK.connectorZ[0] + FRONT_WALK.connectorZ[1]) / 2,
        },
        {
          x: walk.anchor.x,
          y: walk.anchor.y,
          z: (FRONT_WALK.connectorZ[0] + FRONT_WALK.connectorZ[1]) / 2,
        },
      ],
      ids("site/front-walk.ts", "front-walk-connector"),
    ),
    passage(
      "garden-steps",
      "garden-terrace",
      "garden-lower-landing",
      [
        {
          x: garden.anchor.x,
          y: zone("garden-terrace").anchor.y,
          z: TERRACE_EDGE_Z + 0.5,
        },
        {
          x: garden.anchor.x,
          y: zone("garden-terrace").anchor.y,
          z: TERRACE_EDGE_Z,
        },
        { x: garden.anchor.x, y: garden.anchor.y, z: LOWER_LANDING.z[1] },
        { x: garden.anchor.x, y: garden.anchor.y, z: garden.anchor.z },
      ],
      ids("site/terrace.ts", "garden-step-"),
      "stair",
    ),
    passage(
      "side-front-path",
      "driveway",
      "side-front-access",
      [
        {
          x: DRIVEWAY.x[1] - 0.5,
          y: driveTop((SIDE_WALK.frontBand[0] + SIDE_WALK.frontBand[1]) / 2),
          z: (SIDE_WALK.frontBand[0] + SIDE_WALK.frontBand[1]) / 2,
        },
        {
          x: side.anchor.x,
          y: SIDE_WALK.top,
          z: (SIDE_WALK.frontBand[0] + SIDE_WALK.frontBand[1]) / 2,
        },
        { x: side.anchor.x, y: side.anchor.y, z: side.anchor.z },
      ],
      ids("site/side-walk.ts", "side-walk"),
    ),
    passage(
      "side-yard-gate-passage",
      "side-front-access",
      "side-rear-access",
      [
        { x: side.anchor.x, y: side.anchor.y, z: side.anchor.z },
        { x: side.anchor.x, y: side.anchor.y, z: GARAGE.outer.z[1] },
        { x: sideRear.anchor.x, y: sideRear.anchor.y, z: sideRear.anchor.z },
      ],
      ids("site/fence.ts", "gate-post-"),
      "passage",
      1.05,
    ),
    passage(
      "side-rear-path",
      "side-rear-access",
      "garden-lower-landing",
      [
        { x: sideRear.anchor.x, y: sideRear.anchor.y, z: sideRear.anchor.z },
        { x: sideRear.anchor.x, y: sideRear.anchor.y, z: SIDE_WALK.backBand[0] },
        { x: garden.anchor.x, y: garden.anchor.y, z: SIDE_WALK.backBand[0] },
        { x: garden.anchor.x, y: garden.anchor.y, z: LOWER_LANDING.z[1] },
      ],
      ids("site/side-walk.ts", "side-walk"),
    ),
  ];
};

/**
 * World centre and face normal of one opening's void, and the reach from the
 * wall's mid-plane to 0.05 m beyond either face: the one place route checks and
 * observations read which outside zone an envelope opening opens on to.
 * Throws when the opening, its host face or its void is missing.
 */
/**
 * @evidence spaces/06-openings.md openingAxis resolves an authored wall void to a world-space centre, local face normal, and beyond-face reach.
 * @evidence spaces/06-openings.md#external-opening-interface The reach includes half the host wall thickness plus 0.05 m for checking an exterior zone beyond the void.
 * @evidence principles/core/source-units.md#source-scope-preservation It reads the existing opening profile and boundary face, without assigning a new door or window frame.
 * @evidence principles/core/source-units.md#source-substantive-completion Missing opening, face, or profile throws; otherwise quaternion rotation and origin yield world coordinates.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The external-opening-interface parent supplies the host wall and through-thickness void; this helper's bidirectional beyond-face probe adds no opening coordinate.
 */
export const openingAxis = (environment: IAutoMovieBuiltEnvironment, openingId: string): { centre: IAutoMovieVector3; normal: IAutoMovieVector3; reach: number } => {
  const opening = environment.openings.find((o) => o.id === openingId);
  const face = opening === undefined
    ? undefined
    : environment.boundaries.find((b) => b.id === opening.boundary)?.face;
  if (opening === undefined || face === undefined || opening.profile === undefined) throw new Error(
    `opening "${openingId}" has no host face or void`,
  );
  const n = opening.profile.outline.length;
  const cx = opening.profile.outline.reduce((s, q) => s + q.x, 0) / n;
  const cy = opening.profile.outline.reduce((s, q) => s + q.y, 0) / n;
  const r = face.rotation;
  const rotate = (v: IAutoMovieVector3): IAutoMovieVector3 => {
    const t = {
      x: 2 * (r.y * v.z - r.z * v.y),
      y: 2 * (r.z * v.x - r.x * v.z),
      z: 2 * (r.x * v.y - r.y * v.x),
    };
    return {
      x: v.x + r.w * t.x + (r.y * t.z - r.z * t.y),
      y: v.y + r.w * t.y + (r.z * t.x - r.x * t.z),
      z: v.z + r.w * t.z + (r.x * t.y - r.y * t.x),
    };
  };
  const local = rotate({ x: cx, y: cy, z: 0 });
  return {
    centre: {
      x: face.origin.x + local.x,
      y: face.origin.y + local.y,
      z: face.origin.z + local.z,
    },
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
/**
 * @evidence spaces/05-route-network.md checkConnectors verifies built route endpoints and stair landing positions inside their named spaces.
 * @evidence principles/core/source-units.md#source-scope-preservation The verifier reads connector records and space cells; it does not move a failed route into a convenient room.
 * @evidence principles/core/source-units.md#source-substantive-completion It interpolates landing.at along the 3D route and throws owner-labelled failures for outside endpoints or landing.
 * @evidence obligations/design/space-sources.md#space-source-invalid-topology A connector with a route outside its declared endpoint or landing space is explicitly refused.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The route parent fixes connector spaces and landings; validation needed no replacement passage.
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
      if (!inside(landing.space, point)) failures.push(
        `${c.id}: landing at ${landing.at.toFixed(3)} (${point.x.toFixed(3)}, ${point.y.toFixed(3)}, ${point.z.toFixed(3)}) is outside "${landing.space}"`,
      );
    }
  }
  if (failures.length > 0) throw new Error(
    `connectors fail:\n  ${failures.join("\n  ")}`,
  );
};

/** Build the house's built-environment record; throws on invalid topology. */
/**
 * @evidence spaces/04-observations.md buildHouseEnvironment translates authored solids and rooms into one engine-facing built-environment record.
 * @evidence spaces/04-observations.md#engine-render-handoff Every IHousePart becomes a generated single-part model and element under house-root, with stable logical space membership.
 * @evidence principles/core/source-units.md#source-scope-preservation It uses the imported house producer and geometry records, leaving new surfaces or material fills outside this assembly.
 * @evidence principles/core/source-units.md#source-substantive-completion It builds cells, surfaces, boundaries, openings, and connectors, then validates the record and route network before return.
 * @evidence obligations/design/space-sources.md#space-source-invalid-topology Unmapped part owners, invalid outlines, disconnected openings, or engine validation failures throw with concrete paths.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The site-access-interface parent places exterior zones under ground-storey and the stair connector parent joins entry to upper hall; assembling those records exposed no missing space or passage.
 */
export const buildHouseEnvironment = (house: IHouse = buildHouse()): IAutoMovieBuiltEnvironment & {
  pendingMapGround: { parts: string[]; zones: string[] };
} => {
  const site = boundsOf(house.parts);
  const top = boundsOf(
    house.parts.filter((p) => OWNER_SPACE[p.owner] === "house"),
  ).y[1];
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
        cell("main-stair/lower-flight", { x: [STAIR_OPENING.west, STAIR_OPENING.turnX], y: [STOREYS.groundFloor, STOREYS.upperCeiling], z: [STAIR_OPENING.back, STAIR_STEPS.lowerStartZ] }),
        // Under treads 7-9 the entry coat closet (entry-coat-storage) takes the volume up to its top.
        cell("main-stair/upper-flight", { x: [STAIR_OPENING.turnX, COAT_STORAGE.backWallX], y: [STOREYS.groundFloor, STOREYS.upperCeiling], z: [STAIR_OPENING.back, STAIR_OPENING.turnZ] }),
        cell("main-stair/upper-flight-over-closet", { x: [COAT_STORAGE.backWallX, STAIR_OPENING.east], y: [COAT_STORAGE.top, STOREYS.upperCeiling], z: [STAIR_OPENING.back, STAIR_OPENING.turnZ] }),
        // The floor opening runs on to the front wall (02 stair-floor-opening): above the
        // entry ceiling the void X = [-1.80, -0.65], Z = [-1.45, -0.25] is stair space too.
        cell("main-stair/front-void", { x: [STAIR_OPENING.west, STAIR_OPENING.turnX], y: [STOREYS.groundCeiling, STOREYS.upperCeiling], z: [STAIR_STEPS.lowerStartZ, STAIR_OPENING.front] }),
      ],
    },
  ];
  for (const { room, storage } of house.storages)
    spaces.push({
      id: storage.id,
      kind: "storage",
      parent: room.storey,
      cells: [cell(`${storage.id}/0`, storage)],
    });
  const surfaces: IAutoMovieBuiltSurface[] = [];
  for (const zone of house.zones) {
    const patches: NonNullable<IExteriorZone["patches"]> = zone.patches ?? [{ outline: zone.outline, anchor: zone.anchor, rampTo: zone.rampTo }];
    spaces.push({
      id: zone.id,
      kind: "exterior",
      // Every exterior zone of the route table sits on the ground storey (05, site-access-interface).
      parent: "ground-storey",
      cells: patches.flatMap((patch, j) => {
        const heights = patch.height?.kind === "heightfield"
          ? patch.height.samples
          : patch.rampTo === null ? [patch.anchor.y] : [patch.anchor.y, patch.rampTo.y];
        const y: [number, number] = [Math.min(...heights), Math.max(...heights) + ZONE_HEAD_CLEARANCE];
        return rectangles(zone.owner, patch.outline).map((r, i) => cell(`${zone.id}/${j}/${i}`, { x: r.x, y, z: r.z }));
      }),
    });
    patches.forEach((patch, j) =>
      surfaces.push({
        space: zone.id,
        surface: {
          id: patches.length === 1
            ? `${zone.id}-ground-surface`
            : `${zone.id}-ground-surface-${j}`,
          kind: patch.rampTo === null ? "platform" : "ramp",
          polygon: patch.outline.map((q) => ({ x: q.x, y: 0, z: q.z })),
          ...(patch.height === undefined
            ? { anchor: patch.anchor, rampTo: patch.rampTo }
            : { height: patch.height }),
        },
      }),
    );
  }
  for (const room of house.spaces) {
    const [floor, ceiling] = roomLevels(room);
    spaces.push({
      id: room.id,
      kind: "room",
      parent: room.storey,
      cells: rectangles(room.owner, room.outline).map((r, i) =>
        cell(`${room.id}/${i}`, { x: r.x, y: [floor, ceiling], z: r.z }),
      ),
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
    {
      id: "house-root",
      kind: "building",
      parent: null,
      model: null,
      space: "house",
      transform: IDENTITY,
    },
    ...house.parts.map((p) => ({ id: p.id, kind: p.role, parent: "house-root", model: p.id, space: spaceOfPart(house, p), transform: IDENTITY })),
  ];
  const boundaries: IAutoMovieBuiltBoundary[] = [];
  const openings: IAutoMovieBuiltOpening[] = [];
  // Boundaries separate the building's own spaces. Outside a wall, porch, walk,
  // driveway and terrace zones are all the exterior: such a wall segment encloses
  // its one inside space, which is how the engine reads an envelope face.
  const inner = spaces.filter(
    (s) => s.kind === "room" || s.kind === "stair" || s.kind === "storage",
  );
  const junctionBodies = house.parts.filter((p) => p.role === "partition" || p.role === "floor")
    .map((p) => ({ part: p, box: boundsOf([p]) }));
  for (const p of house.parts) {
    const face = p.wall;
    if (face === undefined) continue;
    const center = (face.across[0] + face.across[1]) / 2;
    const segments = segmentsOf(inner, face);
    const idOf = (k: number): string => `${p.id}/${segments[k]!.sides.join("|")}/${k}`;
    segments.forEach((seg, k) => {
      let kind: string = p.role;
      if (p.role === "partition" && seg.sides.includes("house-site")) {
        const u = (seg.u[0] + seg.u[1]) / 2;
        const y = (seg.y[0] + seg.y[1]) / 2;
        const outward = seg.sides[0] === "house-site" ? -1 : 1;
        const across = (face.across[0] + face.across[1]) / 2 + outward * ((face.across[1] - face.across[0]) / 2 + 0.001);
        const witness = face.axis === "x" ? { x: u, y, z: across } : { x: across, y, z: u };
        const other = junctionBodies.find(({ part, box }) => part.id !== p.id &&
          (part.role === "partition" || (p.id.startsWith("stair-") && part.role === "floor" &&
            witness.y >= STOREYS.upperFloor - INTERSTOREY_FLOOR_FINISH - 1e-6 && witness.y <= STOREYS.upperFloor + 1e-6)) &&
          ["x", "y", "z"].every((axis) => {
            const range = box[axis as keyof IBox];
            const value = witness[axis as keyof typeof witness];
            return value >= range[0] - 1e-6 && value <= range[1] + 1e-6;
          }) && containsMeshPoint(part, witness));
        if (other === undefined) throw new Error(`${p.id}: unowned interior partition gap at ${JSON.stringify(witness)}`);
        kind = other.part.role === "floor" ? "floor-junction" :
          p.id.startsWith("upper-linen-") || other.part.id.startsWith("upper-linen-") ? "storage-enclosure" : "partition-junction";
      }
      boundaries.push({
        id: idOf(k),
        kind,
        spaces: seg.sides.filter((s) => s !== "house-site"),
        elements: [p.id],
        face: {
          origin: face.axis === "x"
            ? { x: 0, y: 0, z: center }
            : { x: center, y: 0, z: 0 },
          rotation: face.axis === "x" ? { x: 0, y: 0, z: 0, w: 1 } : TO_Z_AXIS,
          outline: clipOutline(face.outline, seg.u, seg.y).map((q) => ({
            x: q.u,
            y: q.y,
          })),
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
      const k = segments.findIndex(
        (s) => s.u[0] <= cu && cu <= s.u[1] && s.y[0] <= cy && cy <= s.y[1],
      );
      if (k < 0) throw new Error(
        `${p.owner}: void "${hole.id}" in "${p.id}" lies in no boundary between two spaces`,
      );
      const seg = segments[k]!;
      const u0 = Math.max(hole.from, seg.u[0]);
      const u1 = Math.min(hole.to, seg.u[1]);
      const y0 = Math.max(hole.bottom, seg.y[0]);
      const y1 = Math.min(hole.top, seg.y[1]);
      if (u1 - u0 < 0.3 || y1 - y0 < 0.3) throw new Error(
        `${p.owner}: void "${hole.id}" leaves only [${u0}, ${u1}] × [${y0}, ${y1}] between ${seg.sides.join(" and ")}`,
      );
      openings.push({
        id: hole.id,
        kind: openingKind(p.owner, hole.id),
        boundary: idOf(k),
        fill: null,
        profile: {
          outline: [
            { x: u0, y: y0 },
            { x: u1, y: y0 },
            { x: u1, y: y1 },
            { x: u0, y: y1 },
          ],
        },
      });
    }
  }
  const stair: IAutoMovieBuiltConnector = {
    id: "main-stair-connection",
    kind: "stair",
    from: "front-entry",
    to: "upper-hall",
    bidirectional: true,
    landings: [
      {
        space: "main-stair",
        at: length(STAIR_ROUTE, STAIR_LANDING_STATION) / length(STAIR_ROUTE, STAIR_ROUTE.length - 1),
      },
    ],
    route: [...STAIR_ROUTE],
    width: 1.0,
    clearHeight: 2.0,
    elements: house.parts.filter((p) => p.owner === "stair.ts").map((p) => p.id),
  };
  const environment: IAutoMovieBuiltEnvironment & { pendingMapGround: { parts: string[]; zones: string[] } } = {
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
    pendingMapGround: {
      parts: house.parts.filter((p) => p.pendingMapGround === "map-ground-pending").map(
        (p) => p.id,
      ),
      zones: house.zones.filter((z) => z.pendingMapGround === "map-ground-pending").map(
        (z) => z.id,
      ),
    },
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
