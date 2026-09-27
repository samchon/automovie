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
 * @evidenceReview spaces/00-building.md MAIN exports the shared two-storey outer X/Z rectangle and the corresponding finished inner limits, letting both floor and envelope owners consume one building extent.
 * @evidence spaces/00-building.md#main-building-extent The outer X/Z pairs and 0.25 m wall inset give consumers one 11.50 by 10.70 m envelope.
 * @evidenceReview spaces/00-building.md#main-building-extent MAIN.outer gives X = [-5.75, 5.75] and Z = [-10.7, 0], while MAIN.inner follows the target's 0.25 m wall inset on all four sides.
 * @evidence principles/core/source-units.md#source-scope-preservation MAIN holds building bounds and wall reservations, leaving room divisions and garage geometry to their owners.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation MAIN contains the main exterior and interior limits plus wall and partition reservations; it creates neither room divisions nor GARAGE's separate attached outline.
 * @evidence principles/core/source-units.md#source-substantive-completion The fixed tuples and wall/partition widths are usable coordinates for envelope, roof, floor, and room builders.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion Roof junctions read MAIN.outer, floor bases read MAIN.inner, and envelope and room builders read the wall and partition widths, so the exported record supplies usable shared coordinates.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Main-building-extent fixes outer X=[-5.75, 5.75]/Z=[-10.70, 0] m and 0.25 m outer walls, with finished inner limits stated there; MAIN carries those authored coordinates.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Main-building-extent fixes the main outer rectangle, 0.25 m wall, finished inner limits and 0.15 m partitions; MAIN carries those values without exposing a missing boundary rule.
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
 * @evidenceReview spaces/00-building.md GARAGE derives its shared west wall faces from MAIN.inner.x[1] and MAIN.outer.x[1], and fixes the other outer faces and inner offsets for the attached single-storey volume.
 * @evidence spaces/00-building.md#attached-garage-extent Its outer X begins at 5.50 and inner X at 5.75, preserving the one wall shared with the main body.
 * @evidenceReview spaces/00-building.md#attached-garage-extent GARAGE.outer begins at the main wall's inner X = 5.50 and GARAGE.inner begins at its outer X = 5.75, so both volumes refer to the same 0.25 m wall instead of separate overlapping walls.
 * @evidence principles/core/source-units.md#source-scope-preservation GARAGE supplies only garage bounds and its wall reserve; it does not create a second main-building wall.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation GARAGE exports bounds and a free-wall reserve only; its west faces read MAIN and the record emits no second main-wall mesh or vehicle.
 * @evidence principles/core/source-units.md#source-substantive-completion The shared-wall inner face follows MAIN while the three free inner faces derive from the garage outer bounds and 0.25 m reserve.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion GARAGE computes the three free inner faces by applying its 0.25 m wall reserve to its outer bounds, and garage interior and envelope builders consume the resulting inner coordinates.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Attached-garage-extent shares MAIN's east wall and sets free outer faces at X=11.70, Z=-6.70/-0.30 m; GARAGE derives its three free inner faces with the 0.25 m reserve.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Attached-garage-extent assigns one shared wall with MAIN and 0.25 m reserves on the three free sides; GARAGE derives exactly those inner faces from the authored outer bounds, so no new parent extent was needed.
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
 * @evidenceReview spaces/10-ground-floor.md EXTERIOR_WALL_BOTTOM aliases STOREYS.frontWalk for the provisional exposed wall cut, and the front, left, rear, right and garage wall builders use it as their lower bound.
 * @evidence spaces/10-ground-floor.md#ground-support-handoff The -0.45 m temporary wall bottom matches the front walk while actual buried support awaits map ground input.
 * @evidenceReview spaces/10-ground-floor.md#ground-support-handoff Ground-support-handoff authorizes a temporary wall display cut at the front-walk top while map ground remains absent; EXTERIOR_WALL_BOTTOM reads that exact STOREYS.frontWalk datum.
 * @evidence principles/core/source-units.md#source-scope-preservation EXTERIOR_WALL_BOTTOM is elevation closure, not foundation depth or a map-ground substitute.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation EXTERIOR_WALL_BOTTOM is a single elevation alias for exposed wall faces; it contains no map ground, fill depth, plinth or footing geometry that would overstate the parent handoff.
 * @evidence principles/core/source-units.md#source-substantive-completion The numeric bound lets exterior wall solids close to the known paving level in the current build.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion The front, side, rear and garage wall outlines close to EXTERIOR_WALL_BOTTOM, and house assembly marks walls reaching that provisional cut as map-ground-pending.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work The source exposed an undecided wall bottom; ground-support-handoff now authorizes only a marked temporary display cut.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work The need for a wall display cut before map ground is the source case answered by ground-support-handoff; EXTERIOR_WALL_BOTTOM uses its front-walk datum and house assembly marks the affected walls map-ground-pending.
 */
export const EXTERIOR_WALL_BOTTOM = STOREYS.frontWalk;
