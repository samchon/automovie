import type * as THREE from "three";

/**
 * One gait of a figure's repertoire, baked into a rigid part-matrix table.
 *
 * A take carries the two numbers that decide how fast it is played as well as
 * the table that says what it looks like, because those numbers are properties
 * of the cycle itself: how far one turn of it carries a body, and how long one
 * turn of it lasts when nothing carries the body at all.
 *
 * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Pairs a declared gait matrix table with its measured stride and idle period so cadence uses that take own distance-to-phase conversion.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Pairs a declared gait matrix table with its measured stride and idle period so cadence uses that take own distance-to-phase conversion.
 * @author Samchon
 */
export interface IAutoMovieFormationCycleTake {
  /**
   * Name of the gait this take was baked from.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Keeps the declared gait identity used by cue repertoire selection.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Keeps the declared gait identity used by cue repertoire selection.
   */
  gait: string;

  /**
   * Ground meters one turn of this cycle carries a member.
   *
   * Measured from the bake rather than authored, so no field can drift out of
   * step with the motion it describes: the part that reaches lowest through the
   * cycle is the one that meets the ground, and the ground moves under it at
   * exactly the speed the body travels. Its horizontal path over one closed
   * cycle is twice the sweep it makes, and the fraction of the cycle it spends
   * in the lower half of its own rise is the fraction of the cycle it is
   * planted for, so the sweep divided by that fraction is what one whole cycle
   * carries the body.
   *
   * Zero when the cycle carries a body nowhere: an idle, a salute, a figure
   * with nothing to plant. Such a take is played on {@link periodSeconds}
   * instead, which is the only honest reading of a cycle no ground drives.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Supplies the measured ground travel per cycle used to convert translation and arc distance into phase.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Supplies the measured ground travel per cycle used to convert translation and arc distance into phase.
   */
  strideMeters: number;

  /**
   * Seconds one turn takes when no ground drives it: the gait's own period.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Supplies time-driven cycle advance when the take has no ground-travel stride.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Supplies time-driven cycle advance when the take has no ground-travel stride.
   */
  periodSeconds: number;

  /**
   * Part matrices exactly as the texture stores them.
   *
   * `((part * 3 + row) * samples + sample) * 4 + column` reads one element of
   * the rest-to-posed matrix of `part` at `sample`. The bottom row is implied
   * rather than stored: a rigid part never shears the homogeneous coordinate.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Retains the rest-to-posed rows used by the CPU reader for the same cycle motion.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Retains the rest-to-posed rows used by the CPU reader for the same cycle motion.
   */
  matrices: Float32Array;

  /**
   * GPU-side view of {@link matrices}.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Supplies the GPU view of those same rows for member-phase replay.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Supplies the GPU view of those same rows for member-phase replay.
   */
  texture: THREE.DataTexture;
}
