import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The path frame at one baked keyframe time: where the root sits on the path
 * and which way it faces, the per-time data a later pass (a camera follow, a
 * foot-planting pass) consumes without re-deriving the path math.
 *
 * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-terrain-adaptation Records the terrain-adjusted position and facing derived at one gait sample.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Exposes the resolved path state beside the compact gait output.
 * @author Samchon
 */
export interface IAutoMoviePathFrame {
  /**
   * Seconds into the baked clip.
   *
   * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-gait-table Locates the resolved path frame on the gait cycle's baked clock.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Aligns path state with the corresponding procedural motion sample.
   */
  time: number;
  /**
   * World path point: XZ on the polyline, `y` from the ground source.
   *
   * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-terrain-adaptation Combines route progress with the declared terrain height.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Reports the terrain-adapted root position produced by the gait rule.
   */
  position: IAutoMovieVector3;
  /**
   * Facing about +Y in degrees (0 = +Z, +90 = +X), corner-blended.
   *
   * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-general-procedural-control Makes corner steering an explicit output of the path controller.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Carries the bounded facing derived from the authored route.
   */
  yawDeg: number;
  /**
   * Unit horizontal facing direction (`y` = 0), matching `yawDeg`.
   *
   * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-general-procedural-control Provides the normalized steering result used by downstream motion controls.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Preserves the resolved route direction independently of display angles.
   */
  tangent: IAutoMovieVector3;
}
