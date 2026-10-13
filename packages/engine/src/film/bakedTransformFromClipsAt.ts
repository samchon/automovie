import {
  IAutoMovieClip,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieSampledChannel } from "../resolve/IAutoMovieSampledChannel";
import { sampleClipSequence } from "../resolve/sampleClipSequence";

/** The scale a node keeps when no clip writes its scale channel. */
const UNIT_SCALE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

/**
 * Resolve a node's baked world transform from a sequence of object-motion
 * clips at one shot-local instant, the way playback reads them.
 *
 * Channels are selected by {@link sampleClipSequence}: per channel, the track
 * whose first key started latest by `t` wins, ties going to the later clip, and
 * a track that has not started writes nothing. Translation and rotation are
 * therefore chosen independently, so disjoint producer clips compose and a
 * later coupling hands off from an earlier one.
 *
 * Returns `null` while no clip has started writing both the node's translation
 * and its rotation; the node then stands where its staged placement and pose
 * put it, which the caller supplies. Scale comes from an authorized scale
 * track, else it is unit: the engine's attach and launch bakers write no scale,
 * and the staged scale of a set piece is not known here, so a caller that needs
 * it reads it from the scene node.
 */
export const bakedTransformFromClipsAt = (
  clips: readonly IAutoMovieClip[],
  node: string,
  t: number,
): IAutoMovieTransform | null => {
  const sampled: Map<string, IAutoMovieSampledChannel> = sampleClipSequence(
    clips,
    t,
  );
  const translation: number[] | undefined = sampled.get(
    `node:${node}:translation`,
  )?.value;
  const rotation: number[] | undefined = sampled.get(
    `node:${node}:rotation`,
  )?.value;
  if (translation === undefined || rotation === undefined) return null;
  const scale: number[] | undefined = sampled.get(`node:${node}:scale`)?.value;
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
    scale:
      scale === undefined
        ? UNIT_SCALE
        : { x: scale[0]!, y: scale[1]!, z: scale[2]! },
  };
};
