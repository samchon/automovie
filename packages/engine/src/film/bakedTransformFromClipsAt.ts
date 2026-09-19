import { IAutoMovieClip, IAutoMovieTransform } from "@automovie/interface";
import { sampleClipSequence } from "../resolve/sampleClipSequence";

/**
 * Resolve a node's baked world transform from every object-motion authority at
 * one shot-local instant. Translation and rotation are selected independently,
 * so disjoint producer clips compose while later duplicate channels hand off.
 *
 * @evidence requirements/motion/object-motion-and-interaction.md#motion-coupled-objects bakedTransformFromClipsAt preserves declared attachment handoff: Resolve a node's baked world transform from every object-motion authority at one shot-local instant. Translation and rotation are selected independently, so disjoint producer clips compose while later duplicate channels hand off.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff bakedTransformFromClipsAt realizes declared attachment and object handoff: Resolve a node's baked world transform from every object-motion authority at one shot-local instant. Translation and rotation are selected independently, so disjoint producer clips compose while later duplicate channels hand off.
 */
export const bakedTransformFromClipsAt = (
  clips: readonly IAutoMovieClip[],
  node: string,
  t: number,
): IAutoMovieTransform | null => {
  const sampled = sampleClipSequence(clips, t);
  const translation = sampled.get(`node:${node}:translation`)?.value;
  const rotation = sampled.get(`node:${node}:rotation`)?.value;
  if (translation === undefined || rotation === undefined) return null;
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
