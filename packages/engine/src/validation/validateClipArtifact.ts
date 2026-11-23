import {
  type IAutoMovieClipChannelGate,
  type IAutoMovieClipShapeFault,
  IAutoMovieConstraintViolation,
} from "@automovie/interface";

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
 * Admit clip id/duration/loop, track uniqueness, channel shape and shared
 * sampler track-shape faults.
 */
export const validateClipArtifact: (
  clip: unknown,
  path: string,
  violations: IAutoMovieConstraintViolation[],
  channelGate?: IAutoMovieClipChannelGate,
) => void = (
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
    Array.from(
      tracks,
      (
        track: unknown,
        index: number,
      ): { id: string | undefined; path: string } => ({
        id: isRecord(track)
          ? `${String(isRecord(track.channel) ? track.channel.kind : undefined)}:${JSON.stringify(track.channel)}`
          : undefined,
        path: `${path}.tracks[${index}].channel`,
      }),
    ),
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
