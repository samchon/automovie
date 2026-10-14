/**
 * Emits the public and service circulation of docs/spaces/circulation.md as public connectors.
 * Only actual door passages between distinct spaces and the single south
 * courtyard step become connectors; the colonnade loop stays within one volume
 * and makes no self-connector. The exterior space is temple-site from
 * docs/spaces/site.md#site-connections. The exterior service passage and two-step
 * main entrance stair are the only connectors joining the site and building.
 */
import type { IAutoMovieBuiltConnector, IAutoMovieBuiltSpace, IAutoMovieVector3 } from "@automovie/interface";
import { edgeInside, planeHeight, type RoofPatch } from "../geometry/planar-domain";
import { templePlan as p } from "./building";
import { templeDoorPassages } from "./openings";
import { templeEntranceSteps } from "./rooms/entrance";
import { templeSiteIds } from "./site/assembly";
import { templeLevels as y } from "./storey";

/**
 * Passage connectors join points 0.3m inside each side of a door wall; courtyard
 * step and main entrance stair connectors complete the routes.
 * @evidence spaces/circulation.md Emits the eight door passages, one south courtyard step and two-step main entrance stair as public connectors.
 * @evidence spaces/circulation.md#public-route Joins the entrance stair, entrance, colonnade and doors to the courtyard, sanctuary, offering room and three work rooms; movement around the colonnade stays within one volume and makes no self-connector.
 * @evidence spaces/circulation.md#service-route Door connectors join the exterior service door (temple-site→service-yard) and yard door (service-yard→colonnade), giving the carrying route its two thresholds.
 * @evidence spaces/site.md#site-connections Uses temple-site as the exterior endpoint so only the main stair and service door join the site and building.
 * @evidence principles/core/source-units.md#source-scope-preservation Reads route width and clear height from the door table and actual roof undersides, inventing no route or passage rule.
 * @evidence principles/core/source-units.md#source-substantive-completion Checks that both connector endpoints lie in actual spaces and stops with a door-ID error otherwise; stairs emit step count, rise and tread together.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the public/service routes of circulation.md and two contacts of site.md#site-connections as written. Endpoint and roof-underside clearance checks passed, exposing no parent-route defect to repair.
 */
export const templeConnectors = (
  spaces: readonly IAutoMovieBuiltSpace[], roof: readonly RoofPatch[],
): IAutoMovieBuiltConnector[] => [
  ...templeDoorPassages.map((door) => {
    const [a, b] = [door.wallLow - 0.3, door.wallHigh + 0.3].map((offset): IAutoMovieVector3 =>
      door.axis === "x" ? { x: door.center, y: y.floor, z: offset } : { x: offset, y: y.floor, z: door.center });
    const adjacent = door.adjacent === "exterior" ? templeSiteIds.space : door.adjacent;
    const roomFirst = spaceContains(spaces, door.room, a!);
    const roomSecond = spaceContains(spaces, door.room, b!);
    const adjacentFirst = spaceContains(spaces, adjacent, a!);
    const adjacentSecond = spaceContains(spaces, adjacent, b!);
    if (!(roomFirst && adjacentSecond) && !(roomSecond && adjacentFirst)) {
      throw new Error(`temple/circulation: ${door.id} endpoints do not reach ${door.room} and ${adjacent}, respectively.`);
    }
    return {
      id: `connector.${door.id}`, kind: "passage" as const, from: door.room,
      to: adjacent,
      bidirectional: true, route: roomFirst ? [a!, b!] : [b!, a!],
      width: door.width, clearHeight: door.height, elements: [],
    };
  }),
  courtyardStep(spaces, roof),
  entranceStair(spaces, roof),
];

/**
 * Two-step main entrance stair from one tread before the site foot to the upper landing.
 * Reads clearance from porch roof undersides over the route; sections beyond the roof are open sky.
 */
const entranceStair = (
  spaces: readonly IAutoMovieBuiltSpace[], roof: readonly RoofPatch[],
): IAutoMovieBuiltConnector => {
  const s = templeEntranceSteps;
  const route = [
    { x: 0, y: y.publicRoad, z: p.southOuter + s.tread },
    { x: 0, y: y.floor, z: p.southOuter - s.tread },
  ];
  if (!spaceContains(spaces, templeSiteIds.space, route[0]!) || !spaceContains(spaces, "entrance", route[1]!)) {
    throw new Error("temple/circulation: main stair endpoints are not inside the site and entrance.");
  }
  const clear = route.flatMap((point) => roof
    .filter((patch) => patch.tier === "porch" && patch.polygon.every((q, i) =>
      planeHeight(edgeInside(q, patch.polygon[(i + 1) % patch.polygon.length]!), point) >= 0))
    .map((patch) => planeHeight(patch.height, point) - patch.thickness - point.y));
  if (clear.length === 0 || Math.min(...clear) <= 0) throw new Error("temple/circulation: no passage clearance below the porch roof over the main stair.");
  return {
    id: "connector.site-entrance-stair", kind: "stair", from: templeSiteIds.space, to: "entrance",
    bidirectional: true, width: s.width, clearHeight: Math.min(...clear), elements: [], route,
    steps: { count: Math.round((y.floor - y.publicRoad) / s.rise), rise: s.rise, run: s.tread },
  };
};

/**
 * South-axis courtyard contact descending one step over a 1.8m-wide tread.
 * Reads clearance from actual wing-roof undersides over the route, excluding open sky.
 */
const courtyardStep = (spaces: readonly IAutoMovieBuiltSpace[], roof: readonly RoofPatch[]): IAutoMovieBuiltConnector => {
  const route = [{ x: 0, y: y.floor, z: p.courtFront + 0.4 }, { x: 0, y: y.courtyard, z: p.courtFront - 0.4 }];
  if (!spaceContains(spaces, "colonnade", route[0]!) || !spaceContains(spaces, "courtyard", route[1]!)) {
    throw new Error("temple/circulation: courtyard step endpoints do not reach the colonnade and courtyard, respectively.");
  }
  const clear = route.flatMap((point) => roof
    .filter((patch) => patch.tier === "wing" && patch.polygon.every((q, i) =>
      planeHeight(edgeInside(q, patch.polygon[(i + 1) % patch.polygon.length]!), point) >= 0))
    .map((patch) => planeHeight(patch.height, point) - patch.thickness - point.y));
  if (clear.length === 0 || Math.min(...clear) <= 0) throw new Error("temple/circulation: no passage clearance below the roof over the courtyard step.");
  return {
    id: "connector.courtyard-south-step", kind: "passage", from: "colonnade", to: "courtyard",
    bidirectional: true, width: 1.8, clearHeight: Math.min(...clear), elements: [], route,
  };
};

/** Containment from the public cell half-planes unchanged, 1cm above the floor with 1e-9 m tolerance. */
const spaceContains = (spaces: readonly IAutoMovieBuiltSpace[], id: string, point: IAutoMovieVector3): boolean =>
  spaces.find((s) => s.id === id)?.cells.some((cell) => cell.planes.every((plane) =>
    plane.normal.x * point.x + plane.normal.y * (point.y + 0.01) + plane.normal.z * point.z <= plane.offset + 1e-9)) ?? false;
