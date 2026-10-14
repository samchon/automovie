/**
 * Main building outline: the rectangle both storeys share.
 *
 * The outer
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
 * ground input ; this value only
 * keeps the elevation closed down to the authored paving and is not a
 * foundation depth.
 */
export const EXTERIOR_WALL_BOTTOM = STOREYS.frontWalk;
