import { IAutoMovieMotion } from "@automovie/interface";
import { IAutoMoviePathFrame } from "./IAutoMoviePathFrame";

/**
 * A gait baked along a path, plus the per-keyframe path frames, mirroring how
 * the ground-IK pass returns its plants (#596).
 *
 * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-terrain-adaptation Returns the terrain-adjusted gait together with the route samples that produced it.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Couples a compact gait bake to its deterministic path-resolution record.
 * @author Samchon
 */
export interface IAutoMoviePathLocomotion {
  /**
   * The baked non-looping clip.
   *
   * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-gait-table Preserves the declared limb cycle while carrying it along the route.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Materializes the compact gait as a finite path performance.
   */
  motion: IAutoMovieMotion;
  /**
   * One path frame per output keyframe, in time order.
   *
   * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-terrain-adaptation Retains each terrain and steering decision at the output key time.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Makes the gait bake's resolved route samples inspectable.
   */
  frames: IAutoMoviePathFrame[];
  /**
   * Total horizontal (XZ) arc length of the path, meters.
   *
   * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-general-procedural-control Measures the authored route that bounds the procedural controller.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Records the distance used to size the gait bake.
   */
  length: number;
  /**
   * Effective speed after cycle snapping, m/s (`length / duration`).
   *
   * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-gait-table Reports the pace resulting from whole-cycle gait quantization.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Makes the compact gait rule's resolved timing explicit.
   */
  speed: number;
  /**
   * Whole gait cycles baked.
   *
   * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-gait-table Counts the complete gait periods used to preserve phase continuity.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Records how the compact cycle was expanded along the route.
   */
  cycles: number;
}

/** One straight XZ stretch of the polyline, arc-length addressed. */
interface ISegment {
  /** Start of the stretch on the ground plan. */
  x: number;
  z: number;
  /** Unit XZ direction. */
  dirX: number;
  dirZ: number;
  /** Facing of this stretch, degrees about +Y. */
  yawDeg: number;
  /** Stretch length, meters. */
  length: number;
  /** Cumulative arc length at the stretch start. */
  from: number;
}
