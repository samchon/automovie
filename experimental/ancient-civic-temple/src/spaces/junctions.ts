/**
 * Wall junction calculations from docs/spaces/junctions.md#wall-junctions.
 * The four exterior corners butt along vertical diagonal planes joining outer
 * and inner vertices; each facade wall owns only the triangle closer to its
 * exterior plane. At interior T-junctions, branch walls end on the through-wall
 * face. This file emits plan outlines without owning surfaces.
 */
import type { PlanPoint } from "../geometry/planar-domain";
import { templePlan as p } from "./building";

/**
 * Diagonally butted plans of four exterior walls with two south sections, in planar-domain order.
 * @evidence spaces/junctions.md Emits the diagonal-butt plans of four exterior walls and two south sections.
 * @evidence spaces/junctions.md#wall-junctions Divides each exterior corner along the diagonal joining outer and inner vertices, assigning each facade only the side nearer its outer face.
 * @evidence principles/core/source-units.md#source-scope-preservation Emits plan outlines only, without owning surfaces or heights.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns five wall plans as trapezoids in planar-domain order; facade sources use them directly as prism hosts.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the diagonal-butt rule of junctions.md#wall-junctions as written; the envelope overlap scan on a 1cm grid produced 0 corner overlaps.
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
 * Exterior stone sections (m) from docs/spaces/junctions.md#plinth-coping.
 * Coping specifies thickness over flat parapet/yard-wall tops and projection
 * along long faces and free ends; plinth specifies projection beyond exterior
 * faces. The south facade (templePlinthRise) owns the plinth upper height.
 * @evidence spaces/junctions.md Holds the stone-section values: coping thickness 0.16m, projection 0.06m and plinth projection 0.04m.
 * @evidence spaces/junctions.md#plinth-coping Supplies coping/plinth thickness and projection to wall-trim unchanged from the design.
 * @evidence principles/core/source-units.md#source-scope-preservation Holds only section dimensions; the south facade owns coping height (4.85m) and plinth top.
 * @evidence principles/core/source-units.md#source-substantive-completion The as const values give wall-trim coping/plinth cells and wall bearing-face heights the same thickness.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Transfers 0.16·0.06·0.04m from junctions.md#plinth-coping unchanged; coping and plinth models account as closed solids.
 */
export const templeWallTrim = { copingThickness: 0.16, copingProjection: 0.06, plinthProjection: 0.04 } as const;

/**
 * Rectangular host plans of interior/entrance walls ending at T-junctions, in planar-domain order.
 * @evidence spaces/junctions.md Makes rectangular host plans for interior and entrance walls ending at T-junctions.
 * @evidence principles/core/source-units.md#source-scope-preservation Only converts four values into a planar-domain rectangle; callers obtain end positions from templeInteriorWallEnds.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns four vertices in consistent west→east, north→south order so prism side normals face outward.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Uses rectangles made from the T-junction ends of junctions.md#wall-junctions unchanged, exposing no parent defect.
 */
export const templeWallRect = (west: number, east: number, north: number, south: number): PlanPoint[] => [
  { x: west, z: north }, { x: east, z: north }, { x: east, z: south }, { x: west, z: south },
];

/**
 * Through-wall contact faces where T-junction branches end. West/east spines
 * span north-inner~south-inner, the sanctuary south wall west-ring~east-ring,
 * cross walls east-room~east-inner, the recessed wall between porch-outer
 * datums, and return walls entrance-front~south-outer.
 * @evidence spaces/junctions.md Emits through-wall contact coordinates where interior T-junction branch walls end.
 * @evidence principles/core/source-units.md#source-scope-preservation Selects only spine, sanctuary south, cross, recessed and return-wall ends from the datums.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns named end coordinates for five wall groups, shared by boundaries and the south facade.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the junctions.md#wall-junctions T-junction ends unchanged: north-inner~south-inner, west-ring~east-ring, east-room~east-inner, porch-outer and entrance-front~south-outer.
 */
export const templeInteriorWallEnds = () => ({
  spine: { north: p.northInner, south: p.southInner },
  sanctuarySouth: { west: p.westRing, east: p.eastRing },
  crossWall: { west: p.eastRoom, east: p.eastInner },
  entryBack: { west: p.westPorchOuter, east: p.eastPorchOuter },
  porchReturn: { north: p.entranceFront, south: p.southOuter },
});
