import { IAutoMovieExpression, IAutoMoviePose, IAutoMovieTransform } from "@automovie/interface";

/**
 * A pose plus optional expression sampled at one instant of a clip.
 *
 * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-interpolation Returns the body and expression state produced by the clip's declared segment law.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Couples every sampled channel at the same resolved clip time.
 * @author Samchon
 */
export interface IAutoMovieMotionSample {
  /**
   * Interpolated body pose at the sampled instant.
   *
   * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-interpolation Interpolates root transforms and clinical joint axes with their typed laws.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Exposes the articulated state resolved between the surrounding keys.
   */
  pose: IAutoMoviePose;
  /**
   * Interpolated expression, or `null` when the motion has none.
   *
   * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-sparse-channel-default Blends an authored expression against explicit neutral while preserving an entirely absent channel as null.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Resolves expression retention and interpolation on the same segment progress as the pose.
   */
  expression: IAutoMovieExpression | null;
}

const IDENTITY_TRANSFORM: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};
