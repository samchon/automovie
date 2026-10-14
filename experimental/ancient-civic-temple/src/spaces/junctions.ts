/**
 * Wall junction calculations
 * The four exterior corners butt along vertical diagonal planes joining outer
 * and inner vertices; each facade wall owns only the triangle closer to its
 * exterior plane. At interior T-junctions, branch walls end on the through-wall
 * face. This file emits plan outlines without owning surfaces.
 */
import type { PlanPoint } from "../geometry/planar-domain";
import { templePlan as p } from "./building";

/**
 * Diagonally butted plans of four exterior walls with two south sections, in planar-domain order.
 */
export const templeOuterWallPlans = () => ({
  north: [
    { x: p.westOuter, z: p.northOuter }, { x: p.eastOuter, z: p.northOuter },
    { x: p.eastInner, z: p.northInner }, { x: p.westInner, z: p.northInner },
  ],
  west: [
    { x: p.westOuter, z: p.northOuter }, { x: p.westInner, z: p.northInner },
    { x: p.westInner, z: p.southInner }, { x: p.westOuter, z: p.southOuter },
  ],
  east: [
    { x: p.eastInner, z: p.northInner }, { x: p.eastOuter, z: p.northOuter },
    { x: p.eastOuter, z: p.southOuter }, { x: p.eastInner, z: p.southInner },
  ],
  southWest: [
    { x: p.westInner, z: p.southInner }, { x: p.westPorchOuter, z: p.southInner },
    { x: p.westPorchOuter, z: p.southOuter }, { x: p.westOuter, z: p.southOuter },
  ],
  southEast: [
    { x: p.eastPorchOuter, z: p.southInner }, { x: p.eastInner, z: p.southInner },
    { x: p.eastOuter, z: p.southOuter }, { x: p.eastPorchOuter, z: p.southOuter },
  ],
}) satisfies Record<string, PlanPoint[]>;

/**
 * Exterior stone sections (m)
 * Coping specifies thickness over flat parapet/yard-wall tops and projection
 * along long faces and free ends; plinth specifies projection beyond exterior
 * faces. The south facade (templePlinthRise) owns the plinth upper height.
 */
export const templeWallTrim = { copingThickness: 0.16, copingProjection: 0.06, plinthProjection: 0.04 } as const;

/**
 * Rectangular host plans of interior/entrance walls ending at T-junctions, in planar-domain order.
 */
export const templeWallRect = (west: number, east: number, north: number, south: number): PlanPoint[] => [
  { x: west, z: north }, { x: east, z: north }, { x: east, z: south }, { x: west, z: south },
];

/**
 * Through-wall contact faces where T-junction branches end. West/east spines
 * span north-inner~south-inner, the sanctuary south wall west-ring~east-ring,
 * cross walls east-room~east-inner, the recessed wall between porch-outer
 * datums, and return walls entrance-front~south-outer.
 */
export const templeInteriorWallEnds = () => ({
  spine: { north: p.northInner, south: p.southInner },
  sanctuarySouth: { west: p.westRing, east: p.eastRing },
  crossWall: { west: p.eastRoom, east: p.eastInner },
  entryBack: { west: p.westPorchOuter, east: p.eastPorchOuter },
  porchReturn: { north: p.entranceFront, south: p.southOuter },
});
