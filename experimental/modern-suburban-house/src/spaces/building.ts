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
export const MAIN = {
  outer: { x: [-5.75, 5.75] as const, z: [-10.7, 0] as const },
  inner: { x: [-5.5, 5.5] as const, z: [-10.45, -0.25] as const },
  /** Exterior wall reservation. */
  wall: 0.25,
  /** Interior partition reservation. */
  partition: 0.15,
} as const;

/** Mid-plane of the front and rear walls, where the common ridges run (roof-mass-allocation). */
export const MAIN_RIDGE_Z = (MAIN.outer.z[0] + MAIN.outer.z[1]) / 2;

/**
 * Provisional bottom of exterior wall faces: the front walk datum −0.45 m, the
 * lowest authored exterior surface. The real support bottom waits for the maps
 * ground input (`10-ground-floor.md#ground-support-handoff`); this value only
 * keeps the elevation closed down to the authored paving and is not a
 * foundation depth.
 */
export const EXTERIOR_WALL_BOTTOM = -0.45;
