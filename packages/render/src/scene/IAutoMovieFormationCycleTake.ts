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
 *
 * @evidence contracts/development/design.md#principled-representation Stores a Float32 affine rest-to-posed table with the homogeneous row implied; stride is estimated from the lowest baked part's path and contact-height fraction, while period comes from the declared gait. The contact heuristic is not exact for arbitrary gaits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Timing quantities accompany their baked matrix table so formationCycleCadence and the shader select the same take instead of matching independent gait metadata.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A zero estimated stride selects time-period playback because no ground travel can drive that take; this is a movement distinction rather than a special idle asset name.
 * @evidence contracts/development/common.md#meaningful-documentation Gives stride and period units, table indexing, zero-stride meaning and the contact heuristic's limitation; texture is explicitly the GPU view of the CPU matrix array.
 */
export interface IAutoMovieFormationCycleTake {
  /** Name of the gait this take was baked from. */
  gait: string;

  /**
   * Ground meters one turn of this cycle carries a member.
   *
   * Estimated from the lowest part's closed horizontal path, halved and divided
   * by the fraction of samples in its lower half-height range. This approximates
   * a reciprocating planted foot; arbitrary paths and contact schedules need not
   * satisfy that premise.
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
