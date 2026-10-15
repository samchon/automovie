
import type { IAutoMovieBuiltConnector, IAutoMovieBuiltSpace, IAutoMovieVector3 } from "@automovie/interface";
import { edgeInside } from "../geometry/edgeInside";
import { planeHeight } from "../geometry/planeHeight";
import { type RoofPatch } from "../geometry/RoofPatch";
import { templePlan as p } from "./templePlan";
import { templeDoorPassages } from "./templeDoorPassages";
import { templeEntranceSteps } from "./rooms/templeEntranceSteps";
import { templeSiteIds } from "./site/templeSiteIds";
import { templeLevels as y } from "./templeLevels";

/**
 * Passage connectors join points 0.3m inside each side of a door wall; courtyard
 * step and main entrance stair connectors complete the routes.
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
