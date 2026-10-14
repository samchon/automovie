import {
  IAutoMovieClip,
  IAutoMovieTransform,
} from "@automovie/interface";

import { IAutoMovieSampledChannel } from "../resolve/IAutoMovieSampledChannel";
import { sampleClipSequence } from "../resolve/sampleClipSequence";
import { bakedTransformFromChannels } from "./bakedTransformFromChannels";

/**
 * Resolve a node's baked world transform from a sequence of object-motion clips at one shot-local instant, the way playback reads them.
 *
 * Channels are selected by {@link sampleClipSequence}: per channel, the track whose first key started latest by `t` wins, ties going to the later clip, and a track that has not started writes nothing. Translation and rotation are therefore chosen independently, so disjoint producer clips compose and a later coupling hands off from an earlier one.
 *
 * Returns `null` while no clip has started writing both the node's translation and its rotation; the node then stands where its staged placement and pose put it, which the caller supplies. Scale comes from an authorized scale track, else it is unit: the engine's attach and launch bakers write no scale, and the staged scale of a set piece is not known here, so a caller that needs it reads it from the scene node.
 *
 * @evidence contracts/common.md#principled-implementation Delegates per-channel latest-start authority and interpolation to sampleClipSequence, the playback sampler; requires admitted clips with complete channel values and finite shot time, and only constructs a frame after both translation and rotation have started.
 * @evidence contracts/common.md#clear-and-simple-design Adapts playback's sampled channel map into the world-frame shape coupling, beat snapshots and camera following consume; missing-channel fallback remains with those callers because their staged placements differ.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Chooses channels by node identity and path, without reading producer ids or coupling suffixes; unit scale follows the attach and launch producers' scale-free output rather than guessing the staged model scale.
 * @evidence contracts/common.md#meaningful-documentation Documents independent channel authority, null before both required channels begin, shot-local time and the scale fallback limitation for staged set pieces.
 * @evidence contracts/performance.md#efficient-algorithms Sampling visits every input clip track and interpolates its keys through sampleClipSequence, then performs three map lookups and a constant-size transform assembly; callers supply the relevant object's baked clips where available.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reads mutable caller-owned clips at one instant and coordinates no requests; reusing a previous map would require clip identity, content and time equivalence that this function does not own.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The sampled map lives only for this call; the returned frame contains scalar copies except the shared unit-scale fallback, which consumers read without modifying.
 */
export function bakedTransformFromClipsAt (
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
