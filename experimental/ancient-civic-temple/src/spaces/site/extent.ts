/**
 * Single input in meters for the site extent, grade, divisions and placement zones.
 * Building datums come from templePlan; this file defines only site lines.
 * It produces no geometry and is consumed by ground, ridge and assembly.
 */
import type { HeightPlane, PlanRectangle } from "../../geometry/planar-domain";
import { templePlan as p } from "../building";
import { templeLevels as y } from "../storey";

const templeSiteOutset = 25;


export const templeSiteExtent: PlanRectangle = {
  west: p.westOuter - templeSiteOutset, east: p.eastOuter + templeSiteOutset,
  north: p.northOuter - templeSiteOutset, south: p.southOuter + templeSiteOutset,
};


export const templeSiteVolume = { floor: -0.3, ceiling: 6.0 } as const;


export const templeSiteGradeBreaks = [p.yardFront, p.southOuter] as const;
export const templeSiteGradePlane = (z: number): HeightPlane => {
  const [north, south] = templeSiteGradeBreaks;
  if (z <= north) return { x: 0, z: 0, constant: y.serviceApproach };
  if (z >= south) return { x: 0, z: 0, constant: y.publicRoad };
  const slope = (y.publicRoad - y.serviceApproach) / (south - north);
  return { x: 0, z: slope, constant: y.serviceApproach - slope * north };
};
export const templeSiteGrade = (z: number): number => {
  const plane = templeSiteGradePlane(z);
  return plane.z * z + plane.constant;
};

/**
 * Lowest ground along the outer wall contact line, consumed by wall-ground-contact.
 * Grade is monotonic in Z, so take the lower north/south endpoint.
 */
export const templeSiteContactMinimum = (): number =>
  Math.min(templeSiteGrade(p.northOuter), templeSiteGrade(p.southOuter));


export const templeSiteLines = {
  curbWest: -11.5, curbEast: 11.5, curbNorth: -11.25, curbSouth: 13.25,
  curbWidth: 0.3, curbRise: 0.12, curbEmbed: 0.1,
  laneWidth: 3.0, streetDepth: 8.0,
  entryHalfWidth: p.eastPorchInner,
  serviceApron: { north: -7.3, south: -5.5 },
} as const;

const l = templeSiteLines;

/**
 * Curb outer lines.
 */
export const templeSiteCurbOuter: PlanRectangle = {
  west: l.curbWest - l.curbWidth, east: l.curbEast + l.curbWidth,
  north: l.curbNorth - l.curbWidth, south: l.curbSouth + l.curbWidth,
};

/**
 * Outer lane lines and front street south line.
 */
export const templeSiteLaneOuter: PlanRectangle = {
  west: templeSiteCurbOuter.west - l.laneWidth, east: templeSiteCurbOuter.east + l.laneWidth,
  north: templeSiteCurbOuter.north - l.laneWidth, south: templeSiteCurbOuter.south + l.streetDepth,
};


const setback = 1.5;
const e = templeSiteExtent;
const lane = templeSiteLaneOuter;
export const templeSitePlacementZones: readonly { id: string; allows: readonly string[]; rect: PlanRectangle }[] = [
  { id: "zone.neighbour-south", allows: ["neighbour", "tree"],
    rect: { west: e.west, east: e.east, north: lane.south + setback, south: e.south } },
  { id: "zone.neighbour-west", allows: ["neighbour", "tree"],
    rect: { west: e.west, east: lane.west - setback, north: e.north, south: templeSiteCurbOuter.south - setback } },
  { id: "zone.neighbour-east", allows: ["neighbour", "tree"],
    rect: { west: lane.east + setback, east: e.east, north: e.north, south: templeSiteCurbOuter.south - setback } },
  { id: "zone.neighbour-north", allows: ["neighbour", "tree"],
    rect: { west: lane.west - setback, east: lane.east + setback, north: e.north, south: lane.north - setback } },
];


export const templeSiteGrassBand = { width: 0.6, clearOfAccess: 0.5 } as const;
