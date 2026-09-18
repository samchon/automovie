import { IAutoMovieMotion, IAutoMovieSceneNode, IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";
import { Matrix4 } from "../math/Matrix4";
import { Vector3 } from "../math/Vector3";
import { sampleMotion } from "../motion/sampleMotion";

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

/** The clip's root at `t`, folded through the node's staged placement. */
const worldRootAt = (
  node: IAutoMovieSceneNode,
  clip: IAutoMovieMotion,
  t: number,
): IAutoMovieVector3 => {
  const root = sampleMotion(clip, t).pose.root;
  return foldRoot(node.transform, root).translation;
};

/**
 * Finite-difference world root velocity of `clip` over `[t0, t1]`, folded
 * through the node's staged placement; zero for an empty window.
 */
const velocityOver = (
  node: IAutoMovieSceneNode,
  clip: IAutoMovieMotion,
  t0: number,
  t1: number,
): IAutoMovieVector3 => {
  const span = t1 - t0;
  if (span <= 0) return { x: 0, y: 0, z: 0 };
  const p0 = worldRootAt(node, clip, t0);
  const p1 = worldRootAt(node, clip, t1);
  return Vector3.scale(Vector3.subtract(p1, p0), 1 / span);
};

/** The clip's root at `t`, folded through the node's staged placement. */
const worldRootAt = (
  node: IAutoMovieSceneNode,
  clip: IAutoMovieMotion,
  t: number,
): IAutoMovieVector3 => {
  const root = sampleMotion(clip, t).pose.root;
  return foldRoot(node.transform, root).translation;
};
