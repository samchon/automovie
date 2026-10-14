import type { IAutoMovieClipShapeFault } from "./IAutoMovieClipShapeFault";
import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { IAutoMovieClipChannelGate } from "./IAutoMovieClipChannelGate";
import { asArray } from "./asArray";
import { clipLoopFault } from "./clipLoopFault";
import { clipTrackShapeFaults } from "./clipTrackShapeFaults";
import { isRecord } from "./isRecord";
import { pushViolation } from "./pushViolation";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateHonorableChannel } from "./validateHonorableChannel";
import { validateNonEmptyId } from "./validateNonEmptyId";
import { validateObjectArtifact } from "./validateObjectArtifact";
import { validateRange } from "./validateRange";
import { validateUniqueBy } from "./validateUniqueBy";

/**
 * Admit clip id/duration/loop, track uniqueness, channel shape and shared sampler track-shape faults.
 *
 * @evidence contracts/common.md#principled-implementation Admit clip id/duration/loop, track uniqueness, channel shape and shared sampler track-shape faults.
 * @evidence contracts/common.md#clear-and-simple-design clipTrackShapeFaults owns keyframe stride/interpolation rules and the supplied channelGate owns addressability.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Committed duration stays strictly positive while the sampler permits zero; indexed track admission reports holes instead of skipping them, and channel-key serialization assumes JSON-representable artifact values.
 * @evidence contracts/common.md#meaningful-documentation Default node channel gate versus light gate is explicit, and faults remain attached to exact track fields.
 * @evidence contracts/performance.md#efficient-algorithms T tracks plus their keyframe buffers require proportional traversal; serialized channel keys also cost channel text length.
 * @evidence contracts/performance.md#reuse-equivalent-work Sampler predicates are reused instead of maintaining another stride/menu specification.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns violation rows; clip buffers are borrowed and no playback task or decoder is created.
 */
export const validateClipArtifact: (clip: unknown, path: string, violations: IAutoMovieConstraintViolation[], channelGate?: IAutoMovieClipChannelGate) => void = (
  clip: unknown,
  path: string,
  violations: IAutoMovieConstraintViolation[],
  /**
   * Which channels this clip's tracks may address. Defaults to the node gate
   * every transform clip (`cameraMotion`, `objectMotions`, a coverage take, a
   * stored slice) is held to; `lightMotions` passes its own.
   */
  channelGate: IAutoMovieClipChannelGate = validateHonorableChannel,
): void => {
  if (!validateObjectArtifact(clip, path, "clip", violations)) return;
  validateNonEmptyId(clip.id, `${path}.id`, "clip id", violations);
  validateRange(
    clip.duration,
    `${path}.duration`,
    0,
    Infinity,
    "clip duration",
    violations,
    false,
  );
  const loop: IAutoMovieClipShapeFault | null = clipLoopFault(clip.loop);
  if (loop !== null)
    pushViolation(
      violations,
      loop.kind,
      `${path}.${loop.field}`,
      `clip ${loop.message}`,
      loop.value,
    );
  validateArrayArtifact(
    clip.tracks,
    `${path}.tracks`,
    "clip tracks",
    violations,
  );
  const tracks: unknown[] = asArray(clip.tracks);
  validateUniqueBy(
    Array.from(tracks, (track: unknown, index: number): { id: string | undefined; path: string; } => ({
      id: isRecord(track)
        ? `${String(isRecord(track.channel) ? track.channel.kind : undefined)}:${JSON.stringify(track.channel)}`
        : undefined,
      path: `${path}.tracks[${index}].channel`,
    })),
    "clip track channel",
    violations,
  );
  for (let i: number = 0; i < tracks.length; ++i) {
    const track: unknown = tracks[i];
    const trackPath: string = `${path}.tracks[${i}]`;
    if (!validateObjectArtifact(track, trackPath, "clip track", violations))
      continue;
    const channel: unknown = track.channel;
    if (
      validateObjectArtifact(
        channel,
        `${trackPath}.channel`,
        "clip track channel",
        violations,
      )
    )
      channelGate(channel, `${trackPath}.channel`, violations);
    validateArrayArtifact(
      track.times,
      `${trackPath}.times`,
      "clip track times",
      violations,
    );
    validateArrayArtifact(
      track.values,
      `${trackPath}.values`,
      "clip track values",
      violations,
    );
    for (const fault of clipTrackShapeFaults(track, clip.duration))
      pushViolation(
        violations,
        fault.kind,
        `${trackPath}.${fault.field}`,
        `track ${fault.message}`,
        fault.value,
      );
  }
};
