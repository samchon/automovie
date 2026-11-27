import type * as THREE from "three";

/**
 * One gait of a figure's repertoire, baked into a rigid part-matrix table.
 *
 * A take carries the two numbers that decide how fast it is played as well as
 * the table that says what it looks like, because those numbers are properties
 * of the cycle itself: how far one turn of it carries a body, and how long one
 * turn of it lasts when nothing carries the body at all.
 *
 * Stride is a bake-derived estimate: the lowest part's closed horizontal path
 * and lower-half-height occupancy approximate contact, rather than proving
 * no-slip contact for arbitrary authored gaits.
 */
export interface IAutoMovieRenderFormationCycleTake {
  /** Name of the gait this take was baked from. */
  gait: string;

  /**
   * Ground meters one turn of this cycle carries a member.
   *
   * Estimated from the lowest part's closed horizontal path, halved and divided
   * by the fraction of samples in its lower half-height range. This
   * approximates a reciprocating planted foot; arbitrary paths and contact
   * schedules need not satisfy that premise.
   *
   * Zero when the cycle carries a body nowhere: an idle, a salute, a figure
   * with nothing to plant. Such a take is played on {@link periodSeconds}
   * instead, which is the only honest reading of a cycle no ground drives.
   */
  strideMeters: number;

  /** Seconds one turn takes when no ground drives it: the gait's own period. */
  periodSeconds: number;

  /**
   * Part matrices exactly as the texture stores them.
   *
   * `((part * 3 + row) * samples + sample) * 4 + column` reads one element of
   * the rest-to-posed matrix of `part` at `sample`. The bottom row is implied
   * rather than stored: a rigid part never shears the homogeneous coordinate.
   */
  matrices: Float32Array;

  /** GPU-side view of {@link matrices}. */
  texture: THREE.DataTexture;
}
