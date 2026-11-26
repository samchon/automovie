import {
  IAutoMovieClip,
  type IAutoMovieSampledChannel,
  IAutoMovieTransform,
} from "@automovie/interface";

import { sampleClipSequence } from "../../resolve/sampleClipSequence";
import { bakedTransformFromChannels } from "./bakedTransformFromChannels";

/**
 * Resolve a node's baked world transform from a sequence of object-motion clips
 * at one shot-local instant, the way playback reads them.
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
export function bakedTransformFromClipsAt(
  clips: readonly IAutoMovieClip[],
  node: string,
  t: number,
): IAutoMovieTransform | null {
  const sampled: Map<string, IAutoMovieSampledChannel> = sampleClipSequence(
    clips,
    t,
  );
  return bakedTransformFromChannels(sampled, node);
}
