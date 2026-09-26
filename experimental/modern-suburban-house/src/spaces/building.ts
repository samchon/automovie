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

/** Outer wall faces of the main building, world metres. */
/**
 * @evidence spaces/00-building.md MAIN carries the main building's shared rectangle and finished inner limits.
 * @evidence spaces/00-building.md#main-building-extent The outer X/Z pairs and 0.25 m wall inset give consumers one 11.50 by 10.70 m envelope.
 * @evidence principles/core/source-units.md#source-scope-preservation MAIN holds building bounds and wall reservations, leaving room divisions and garage geometry to their owners.
 * @evidence principles/core/source-units.md#source-substantive-completion The fixed tuples and wall/partition widths are usable coordinates for envelope, roof, floor, and room builders.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The main-building parent fixes outer and inner bounds and wall widths; recording them exposed no missing footprint decision.
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
 * @evidence spaces/00-building.md#attached-garage-extent Its outer X begins at 5.50 and inner X at 5.75, preserving the one wall shared with the main body.
 * @evidence principles/core/source-units.md#source-scope-preservation GARAGE supplies only garage bounds and its wall reserve; it does not create a second main-building wall.
 * @evidence principles/core/source-units.md#source-substantive-completion The outer/inner coordinate tuples and 0.25 m reserve are consumed by garage and roof builders.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The attached-garage parent specifies the shared edge and three outer walls, so the record needed no new contact rule.
 */
export const GARAGE = {
  outer: { x: [5.5, 11.7] as const, z: [-6.7, -0.3] as const },
  inner: { x: [5.75, 11.45] as const, z: [-6.45, -0.55] as const },
  /** Exterior wall reservation of the three garage-only walls. */
  wall: 0.25,
} as const;

/**
 * Provisional bottom of exterior wall faces: the front walk datum −0.45 m, the
 * lowest authored exterior surface. The real support bottom waits for the maps
 * ground input (`10-ground-floor.md#ground-support-handoff`); this value only
 * keeps the elevation closed down to the authored paving and is not a
 * foundation depth.
 */
/**
 * @evidence spaces/10-ground-floor.md This value bounds exposed wall faces down to the authored front-walk level.
 * @evidence spaces/10-ground-floor.md#ground-support-handoff The -0.45 m temporary wall bottom matches the front walk while actual buried support awaits map ground input.
 * @evidence principles/core/source-units.md#source-scope-preservation EXTERIOR_WALL_BOTTOM is elevation closure, not foundation depth or a map-ground substitute.
 * @evidence principles/core/source-units.md#source-substantive-completion The numeric bound lets exterior wall solids close to the known paving level in the current build.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The ground-support parent distinguishes provisional wall closure from future map support; this bound needed no new support design.
 */
export const EXTERIOR_WALL_BOTTOM = -0.45;
