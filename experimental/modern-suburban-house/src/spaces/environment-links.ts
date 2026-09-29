/**
 * Assemble the house's boundary faces, wall voids and exterior walking links
 * from the already built parts and convex space cells. The environment owner
 * supplies each junction body's measured mesh bounds; this module tests a
 * physical mesh witness before assigning an apparent interior gap. Every
 * opening keeps the same host wall face used by the viewer. Exterior links
 * consume the site paving and zone anchors without inventing a route endpoint.
 * All coordinates are world metres in a right-handed Y-up frame.
 */
import type {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltOpening,
  IAutoMovieBuiltSpace,
  IAutoMovieVector3,
} from "@automovie/interface";
import { GARAGE } from "./building";
import { clipOutline, segmentsOf } from "./boundaries";
import { boundaryOrientation } from "./boundary-orientation";
import type { IHouse } from "./house";
import type { IHousePart } from "./solid-records";
import { driveTop, DRIVEWAY } from "./site/driveway";
import { FRONT_WALK } from "./site/front-walk";
import { SIDE_WALK } from "./site/side-walk";
import { LOWER_LANDING, TERRACE_EDGE_Z } from "./site/terrace";
import {
  PORCH_STEP_BACK_Z,
  PORCH_STEP_CENTRE_X,
  PORCH_STEP_HALF_WIDTH,
} from "./porch";
import { ZONE_HEAD_CLEARANCE, type IExteriorZone } from "./site/zone";
import { INTERSTOREY_FLOOR_FINISH, STOREYS } from "./storeys";

interface IBox {
  x: readonly [number, number];
  y: readonly [number, number];
  z: readonly [number, number];
}

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

/** Kind of a void from its id: every void id names what it is. */
const openingKind = (owner: string, id: string): "door" | "window" | "opening" => {
  if (id.endsWith("-window")) return "window";
  if (id.endsWith("-door")) return "door";
  if (id.endsWith("-opening")) return "opening";
  throw new Error(`${owner}: void "${id}" names no door, window or opening`);
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
      2 * PORCH_STEP_HALF_WIDTH,
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
      LOWER_LANDING.x[1] - LOWER_LANDING.x[0],
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
 * Build sided wall records, their hosted voids and site crossing connectors.
 * @evidence spaces/04-observations.md The environment handoff carries emitted boundary faces, their openings and exterior route links from the same house.
 * @evidence spaces/04-observations.md#engine-render-handoff Each wall void selects the boundary segment containing its centre, a mesh witness assigns an apparent interior gap to its junction body, and site anchors select the exterior connectors.
 * @evidence principles/core/source-units.md#source-scope-preservation The adapter uses the supplied house, cells and measured junction bodies without moving an authored room or paving endpoint.
 * @evidence principles/core/source-units.md#source-substantive-completion Every wall void receives its containing face and every exterior passage receives a named route and emitting elements.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-junctions assigns cut walls their shared host and room-route-network assigns exterior crossings to the paving zones; both input relations suffice for this assembly.
 */
export const buildEnvironmentLinks = (
  house: IHouse,
  spaces: IAutoMovieBuiltSpace[],
  junctionBodies: { part: IHousePart; box: IBox }[],
): { boundaries: IAutoMovieBuiltBoundary[]; openings: IAutoMovieBuiltOpening[]; externalConnectors: IAutoMovieBuiltConnector[] } => {
  const boundaries: IAutoMovieBuiltBoundary[] = [];
  const openings: IAutoMovieBuiltOpening[] = [];
  // Boundaries separate the building's own spaces. Outside a wall, porch, walk,
  // driveway and terrace zones are all the exterior: such a wall segment encloses
  // its one inside space, which is how the engine reads an envelope face.
  const inner = spaces.filter(
    (s) => s.kind === "room" || s.kind === "stair" || s.kind === "storage",
  );
  for (const p of house.parts) {
    const face = p.wall;
    if (face === undefined) continue;
    const center = (face.across[0] + face.across[1]) / 2;
    const segments = segmentsOf(inner, face);
    const idOf = (k: number): string => `${p.id}/${segments[k]!.sides.join("|")}/${k}`;
    segments.forEach((seg, k) => {
      const orientation=boundaryOrientation(face.axis,seg.sides);
      const outline=clipOutline(face.outline,seg.u,seg.y).map(q=>({x:q.u*orientation.sign,y:q.y}));
      if(orientation.sign===-1)outline.reverse();
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
          rotation: orientation.rotation,
          outline,
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
      const orientation=boundaryOrientation(face.axis,seg.sides);
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
            { x: Math.min(u0*orientation.sign,u1*orientation.sign), y: y0 },
            { x: Math.max(u0*orientation.sign,u1*orientation.sign), y: y0 },
            { x: Math.max(u0*orientation.sign,u1*orientation.sign), y: y1 },
            { x: Math.min(u0*orientation.sign,u1*orientation.sign), y: y1 },
          ],
        },
      });
    }
  }
  return {
    boundaries,
    openings,
    externalConnectors: exteriorConnectors(house),
  };
};
