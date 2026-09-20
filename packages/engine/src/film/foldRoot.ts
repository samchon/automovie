import { IAutoMovieTransform } from "@automovie/interface";
import { Matrix4 } from "../math/Matrix4";

const toMatrix = (transform: IAutoMovieTransform): number[] =>
  Matrix4.compose(transform.translation, transform.rotation, transform.scale);

/**
 * Fold a sampled pose root into a staged base placement, in world space.
 *
 * @evidence requirements/motion/validation-and-determinism.md#motion-fixed-step-baked-state foldRoot makes sampled motion replay deterministic: Fold a sampled pose root into a staged base placement, in world space.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-deterministic-sampling-validation foldRoot realizes deterministic motion sampling: Fold a sampled pose root into a staged base placement, in world space.
 */
export const foldRoot = (
  base: IAutoMovieTransform,
  root: IAutoMovieTransform | null,
): IAutoMovieTransform => {
  if (root === null) return base;
  const world = Matrix4.multiply(toMatrix(base), toMatrix(root));
  const decomposed = Matrix4.decompose(world);
  return {
    translation: decomposed.position,
    rotation: decomposed.rotation,
    scale: decomposed.scale,
  };
};
