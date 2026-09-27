/**
 * Main building outline: the rectangle both storeys share.
 *
 * Design owner: `docs/spaces/00-building.md#main-building-extent`. The outer
 * wall line is X = [-5.75, 5.75], Z = [-10.70, 0] m; the 0.25 m exterior wall
 * reservation leaves the finished inner limit X = [-5.50, 5.50],
 * Z = [-10.45, -0.25] m; interior partitions reserve 0.15 m. The area
 * arithmetic (123.05 m² per storey, 246.10 m² in total) is authoring input, not
 * a measurement of the built result.
 *
 * Consumers: envelope, roof, floors, rooms and site owners. This module owns
 * coordinates only and emits no surface.
 */
import { STOREYS } from "./storeys";

/** Outer wall faces of the main building, world metres. */
/**
 * @evidence spaces/00-building.md MAIN carries the main building's shared rectangle and finished inner limits.
 * @evidenceReview spaces/00-building.md #2a82783 v-141 building.ts:25-26 outer X[-5.75,5.75] Z[-10.7,0] shared by both storeys and inner X[-5.5,5.5] Z[-10.45,-0.25]; 00-building.md:29 (same rectangle both storeys), :31 inner limits.
 * @evidence spaces/00-building.md#main-building-extent The outer X/Z pairs and 0.25 m wall inset give consumers one 11.50 by 10.70 m envelope.
 * @evidenceReview spaces/00-building.md#main-building-extent #a8dea6d v-141 L25 outer pairs span 11.50 x 10.70; L28 wall 0.25; 00-building.md:29 X=[-5.75,5.75] Z=[-10.70,0] 11.50 m x 10.70 m, :31 0.25 m reservation.
 * @evidence principles/core/source-units.md#source-scope-preservation MAIN holds building bounds and wall reservations, leaving room divisions and garage geometry to their owners.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 MAIN L24-31 holds only outer/inner/wall/partition; room outlines live in rooms/*.ts, garage coordinates in GARAGE and garage.ts.
 * @evidence principles/core/source-units.md#source-substantive-completion The fixed tuples and wall/partition widths are usable coordinates for envelope, roof, floor, and room builders.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f MAIN.wall reaches front and rear envelopes, MAIN.outer reaches roof junctions, MAIN.inner reaches both floor bases, and MAIN.partition reaches upper-hall and stair wall builders.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Main-building-extent fixes outer X=[-5.75, 5.75]/Z=[-10.70, 0] m and 0.25 m outer walls, with finished inner limits stated there; MAIN carries those authored coordinates.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 00-building.md:29 outer X=[-5.75,5.75], Z=[-10.70,0]; :31 wall 0.25, finished inner X=[-5.50,5.50], Z=[-10.45,-0.25], partition 0.15. building.ts:25-30 MAIN carries exactly these authored values.
 */
export const MAIN = {
  outer: { x: [-5.75, 5.75] as const, z: [-10.7, 0] as const },
  inner: { x: [-5.5, 5.5] as const, z: [-10.45, -0.25] as const },
  /** Exterior wall reservation. */
  wall: 0.25,
  /** Interior partition reservation. */
  partition: 0.15,
} as const;

/**
 * Attached garage outline (attached-garage-extent), world metres: the outer
 * line includes the one shared wall X = [5.50, 5.75]; the other three walls
 * reserve 0.25 m and leave the inner limit X = [5.75, 11.45],
 * Z = [-6.45, -0.55] (5.70 m × 5.90 m).
 */
/**
 * @evidence spaces/00-building.md GARAGE stores the attached garage's shared-wall and free-wall coordinates.
 * @evidenceReview spaces/00-building.md #2a82783 building.ts:46-58 GARAGE holds outer, inner and wall: shared-wall faces outer.x[0]=MAIN.inner.x[1] (5.50) and inner.x[0]=MAIN.outer.x[1] (5.75), free-wall faces outer.x[1]=11.7, z=[-6.7,-0.3] and derived inner. Matches 00-building.md:59,61.
 * @evidence spaces/00-building.md#attached-garage-extent Its outer X begins at 5.50 and inner X at 5.75, preserving the one wall shared with the main body.
 * @evidenceReview spaces/00-building.md#attached-garage-extent #7073ffa building.ts:48 outer.x[0]=MAIN.inner.x[1]=5.50; :52 inner.x[0]=MAIN.outer.x[1]=5.75. 00-building.md:59 shared wall X=[5.50,5.75] is one 0.25 m wall, outer X=[5.50,11.70]; :61 inner X=[5.75,11.45].
 * @evidence principles/core/source-units.md#source-scope-preservation GARAGE supplies only garage bounds and its wall reserve; it does not create a second main-building wall.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 GARAGE (building.ts:46-58) returns only outer/inner tuples and wall, emits no geometry, and takes its west faces from MAIN's east wall instead of a second wall (00-building.md:59: the overlap is one shared wall).
 * @evidence principles/core/source-units.md#source-substantive-completion The shared-wall inner face follows MAIN while the three free inner faces derive from the garage outer bounds and 0.25 m reserve.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f building.ts:52 inner.x[0]=MAIN.outer.x[1]; :52-53 inner.x[1]=outer.x[1]-wall, inner.z=[outer.z[0]+wall, outer.z[1]-wall], wall=0.25 (:47). GARAGE.inner feeds garage-interior.ts:32, garage.ts:83-90,113, envelope front.ts:111-116, rear.ts:124-129, right.ts:137-143, house.ts:236, so the reserve now reaches built output (exported GARAGE.wall still has no outside reader). v141 defect fixed.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Attached-garage-extent shares MAIN's east wall and sets free outer faces at X=11.70, Z=-6.70/-0.30 m; GARAGE derives its three free inner faces with the 0.25 m reserve.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 00-building.md:59 shared wall X=[5.50,5.75] (MAIN's east wall), outer X=[5.50,11.70], Z=[-6.70,-0.30]; :61 other walls 0.25 m, inner X=[5.75,11.45], Z=[-6.45,-0.55]. building.ts:47-54 derives the three free inner faces. df38963f changed only the shared wall's height split, not these coordinates (no HIST).
 */
export const GARAGE = (() => {
  const wall = 0.25;
  const outer = { x: [MAIN.inner.x[1], 11.7] as const, z: [-6.7, -0.3] as const };
  return {
    outer,
    inner: {
      x: [MAIN.outer.x[1], outer.x[1] - wall] as const,
      z: [outer.z[0] + wall, outer.z[1] - wall] as const,
    },
    /** Exterior wall reservation of the three garage-only walls. */
    wall,
  } as const;
})();

/**
 * Provisional bottom of exterior wall faces: the front walk datum −0.45 m, the
 * lowest authored exterior surface. The real support bottom waits for the maps
 * ground input (`10-ground-floor.md#ground-support-handoff`); this value only
 * keeps the elevation closed down to the authored paving and is not a
 * foundation depth.
 */
/**
 * @evidence spaces/10-ground-floor.md This value bounds exposed wall faces down to the authored front-walk level.
 * @evidenceReview spaces/10-ground-floor.md #9f27f8e v-141 L67 = STOREYS.frontWalk. It is the wall bottom B in envelope/front.ts:42, left.ts:33, rear.ts:32, right.ts:48 and garage.ts:54-55. 10-ground-floor.md:120 sets the temporary wall bottom at the front-walk top.
 * @evidence spaces/10-ground-floor.md#ground-support-handoff The -0.45 m temporary wall bottom matches the front walk while actual buried support awaits map ground input.
 * @evidenceReview spaces/10-ground-floor.md#ground-support-handoff #e70bb49 v-141 storeys.ts:42 frontWalk = porchFloor - 0.45 = -0.45 (import chain building.ts:14,67). 10-ground-floor.md:120 temporary bottom Y=-0.45 = front walk top; real support waits for maps (:118,124).
 * @evidence principles/core/source-units.md#source-scope-preservation EXTERIOR_WALL_BOTTOM is elevation closure, not foundation depth or a map-ground substitute.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 10-ground-floor.md:120 says the value is only a display cut line, not ground g, fill support, plinth or footing bottom. The host is a bare elevation constant.
 * @evidence principles/core/source-units.md#source-substantive-completion The numeric bound lets exterior wall solids close to the known paving level in the current build.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Exterior wall outlines close at B (envelope/*.ts, garage.ts:54-55); house.ts:177-178 marks walls touching EXTERIOR_WALL_BOTTOM map-ground-pending.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work The source exposed an undecided wall bottom; ground-support-handoff now authorizes only a marked temporary display cut.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 v-141 04df855f added 10-ground-floor.md:120 (temporary -0.45 display cut marked map-ground-pending). Before that, building.ts:67 was a bare -0.45 with an exclude, which 0fae5e8d turned into this row. Marking is in house.ts:177-178. The row names the target and the case.
 */
export const EXTERIOR_WALL_BOTTOM = STOREYS.frontWalk;
