import { IAutoMovieClip, IAutoMovieTransform } from "@automovie/interface";
import { sampleClip } from "../resolve/sampleClip";

/**
 * The world transform a baked follow clip writes onto `node` at `t`. A coupled
 * child's world root comes from here (the exact clip {@link performShot} baked
 * through `compileAttach`), so beat-end, per-frame render, and a chained
 * coupling's parent read (#1140) all share the SAME composition (#674). Scale
 * is not baked (rigid couplings never scale), so it stays identity.
 *
 * @evidence requirements/motion/object-motion-and-interaction.md#motion-coupled-objects Samples the baked follow transform shared by rendering, chained couplings, and beat-end continuity for the attached node.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff bakedTransformAt realizes declared attachment and object handoff: The world transform a baked follow clip writes onto `node` at `t`. A coupled child's world root comes from here (the exact clip {@link performShot} baked through `compileAttach`), so beat-end, per-frame render, and a chained coupling's parent read (#1140) all share the SAME composition (#674). Scale is not baked (rigid couplings never scale), so it stays identity.
 * @author Samchon
 */
export const bakedTransformAt = (
  clip: IAutoMovieClip,
  node: string,
  t: number,
): IAutoMovieTransform => {
  const sampled = sampleClip(clip, t);
  const translation = sampled.get(`node:${node}:translation`)!.value;
  const rotation = sampled.get(`node:${node}:rotation`)!.value;
  return {
    translation: {
      x: translation[0]!,
      y: translation[1]!,
      z: translation[2]!,
    },
    rotation: {
      x: rotation[0]!,
      y: rotation[1]!,
      z: rotation[2]!,
      w: rotation[3]!,
    },
    scale: { x: 1, y: 1, z: 1 },
  };
};
