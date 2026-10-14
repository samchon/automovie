/**
 * Single input in meters for the site extent, grade, divisions and placement zones.
 * Building datums come from templePlan; this file defines only site lines.
 * It produces no geometry and is consumed by ground, ridge and assembly.
 */
import type { HeightPlane, PlanRectangle } from "../../geometry/planar-domain";
import { templePlan as p } from "../building";
import { templeLevels as y } from "../storey";

const templeSiteOutset = 25;

/**
 * docs/spaces/site.md#site-extent: 25 m beyond each of four outer building faces.
 * @evidence spaces/site.md Extends the site 25 m beyond the four outer building faces.
 * @evidence spaces/site.md#site-extent Derives the rectangular extent from templePlan's outer faces.
 * @evidence principles/core/source-units.md#source-scope-preservation Defines only four extent values.
 * @evidence principles/core/source-units.md#source-substantive-completion Cells, ground and placement zones share one PlanRectangle.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly implements site-extent's 25 m outset.
 */
export const templeSiteExtent: PlanRectangle = {
  west: p.westOuter - templeSiteOutset, east: p.eastOuter + templeSiteOutset,
  north: p.northOuter - templeSiteOutset, south: p.southOuter + templeSiteOutset,
};

/**
 * docs/spaces/site.md#site-extent: lower and upper logical cell limits.
 * @evidence spaces/site.md Sets logical site cell limits at -0.3 m and 6.0 m.
 * @evidence principles/core/source-units.md#source-scope-preservation Contains two limits without a surface closing the sky.
 * @evidence principles/core/source-units.md#source-substantive-completion All four site cells share the constant height range.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents the logical site-extent range.
 */
export const templeSiteVolume = { floor: -0.3, ceiling: 6.0 } as const;

/**
 * docs/spaces/site.md#site-grade: ground height depends only on Z.
 * Y=0 north of yard-front at the service approach; Y=-0.24 south of south-outer
 * at the entry road; the interval is a straight slope. Export both break Z values.
 * @evidence spaces/site.md Defines yard-front and south-outer grade breaks.
 * @evidence spaces/site.md#site-grade Datums divide level north at Y=0, level south at Y=-0.24 and the straight slope between.
 * @evidence principles/core/source-units.md#source-scope-preservation Selects only two Z datums.
 * @evidence principles/core/source-units.md#source-substantive-completion A readonly tuple gives ground planes, curbs and plinth spans the same breaks.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly implements site-grade's breaks.
 */
export const templeSiteGradeBreaks = [p.yardFront, p.southOuter] as const;

/**
 * @evidence spaces/site.md Returns the ground plane (y=ax+bz+c) at Z under the three-span rule.
 * @evidence principles/core/source-units.md#source-scope-preservation Reads storey levels for the Y=0 service contact and Y=-0.24 entry road.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns level 0 in the north, level -0.24 in the south and a Z-sloped plane between.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly implements the site-grade equation.
 */
export const templeSiteGradePlane = (z: number): HeightPlane => {
  const [north, south] = templeSiteGradeBreaks;
  if (z <= north) return { x: 0, z: 0, constant: y.serviceApproach };
  if (z >= south) return { x: 0, z: 0, constant: y.publicRoad };
  const slope = (y.publicRoad - y.serviceApproach) / (south - north);
  return { x: 0, z: slope, constant: y.serviceApproach - slope * north };
};

/**
 * @evidence spaces/site.md Computes ground height in meters at Z from its plane.
 * @evidence principles/core/source-units.md#source-scope-preservation Only evaluates the ground plane.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns one number shared by contact minima and observation eye heights.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly uses the site-grade height equation.
 */
export const templeSiteGrade = (z: number): number => {
  const plane = templeSiteGradePlane(z);
  return plane.z * z + plane.constant;
};

/**
 * Lowest ground along the outer wall contact line, consumed by wall-ground-contact.
 * Grade is monotonic in Z, so take the lower north/south endpoint.
 * @evidence spaces/site.md Returns the minimum ground height along the outer wall contact line.
 * @evidence principles/core/source-units.md#source-scope-preservation Compares only north and south ends because the designed grade is monotonic in Z.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns one number consumed by the storey's outer wall bottom equation.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly implements site-grade and wall-ground-contact rules.
 */
export const templeSiteContactMinimum = (): number =>
  Math.min(templeSiteGrade(p.northOuter), templeSiteGrade(p.southOuter));

/**
 * docs/spaces/site.md#site-paving: curb inner lines, width, height and paving bands.
 * @evidence spaces/site.md Defines curb lines, width, rise and embed, lane width, front street depth, entry width and service apron extent.
 * @evidence spaces/site.md#site-paving Carries curb width 0.3, rise 0.12, embed 0.1 m; lane 3.0 m; street 8.0 m; entry half-width at porch return inner faces; apron Z -7.3 to -5.5.
 * @evidence principles/core/source-units.md#source-scope-preservation Defines site lines while receiving building datums from templePlan.
 * @evidence principles/core/source-units.md#source-substantive-completion Divisions, curbs and placement zones share constant lines.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents the site-paving division values.
 */
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
 * @evidence spaces/site.md Derives outer curb lines from inner lines and width.
 * @evidence principles/core/source-units.md#source-scope-preservation Only adds the two values.
 * @evidence principles/core/source-units.md#source-substantive-completion Paving and lane divisions share one PlanRectangle.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly uses site-paving's outer curb lines.
 */
export const templeSiteCurbOuter: PlanRectangle = {
  west: l.curbWest - l.curbWidth, east: l.curbEast + l.curbWidth,
  north: l.curbNorth - l.curbWidth, south: l.curbSouth + l.curbWidth,
};

/**
 * Outer lane lines and front street south line.
 * @evidence spaces/site.md Derives outer lane and front street south lines from outer curb lines.
 * @evidence principles/core/source-units.md#source-scope-preservation Only adds lane width and street depth.
 * @evidence principles/core/source-units.md#source-substantive-completion Neighboring ground and placement zones share one PlanRectangle.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly uses the site-paving lane and street lines.
 */
export const templeSiteLaneOuter: PlanRectangle = {
  west: templeSiteCurbOuter.west - l.laneWidth, east: templeSiteCurbOuter.east + l.laneWidth,
  north: templeSiteCurbOuter.north - l.laneWidth, south: templeSiteCurbOuter.south + l.streetDepth,
};

/** docs/spaces/site.md#placement-zones: neighboring zones set back 1.5 m from paving. */
const setback = 1.5;
const e = templeSiteExtent;
const lane = templeSiteLaneOuter;
/**
 * @evidence spaces/site.md Sets four neighbor/tree placement zones back 1.5 m from paving edges.
 * @evidence spaces/site.md#placement-zones Uses the designed south, west, east and north extents and allowed neighbour/tree kinds.
 * @evidence principles/core/source-units.md#source-scope-preservation Defines zones without creating instances, which belong to instances.
 * @evidence principles/core/source-units.md#source-substantive-completion A list of IDs, allowed kinds and extents gives later placements shared zones.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly implements four placement-zones and their 1.5 m setback.
 */
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

/**
 * docs/spaces/site.md#placement-zones: grass band width and approach paving clearance.
 * @evidence spaces/site.md Defines a 0.6 m wall-base grass band and 0.5 m clearance beside approach paving.
 * @evidence principles/core/source-units.md#source-scope-preservation Contains only two widths.
 * @evidence principles/core/source-units.md#source-substantive-completion Later grass placements share these constant widths.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents the placement-zones grass band rule.
 */
export const templeSiteGrassBand = { width: 0.6, clearOfAccess: 0.5 } as const;
