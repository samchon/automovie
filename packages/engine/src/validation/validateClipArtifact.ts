import type {
  IAutoMovieClip,
  IAutoMovieClipChannelGate,
  IAutoMovieConstraintViolation,
  IAutoMovieTrack,
} from "@automovie/interface";

import { clipTrackShapeFaults } from "./clipTrackShapeFaults";
import { pushViolation } from "./pushViolation";
import { validateHonorableChannel } from "./validateHonorableChannel";
import { validateRange } from "./validateRange";
import { validateUniqueBy } from "./validateUniqueBy";

/**
 * Admit clip duration, track uniqueness, channel addressing and shared sampler
 * track-shape faults.
 */
export const validateClipArtifact: (
  clip: IAutoMovieClip,
  path: string,
  violations: IAutoMovieConstraintViolation[],
  channelGate?: IAutoMovieClipChannelGate,
) => void = (
  clip: IAutoMovieClip,
  path: string,
  violations: IAutoMovieConstraintViolation[],
  /**
   * Which channels this clip's tracks may address. Defaults to the node gate
   * every transform clip (`cameraMotion`, `objectMotions`, a coverage take, a
   * stored slice) is held to; `lightMotions` passes its own.
   */
  channelGate: IAutoMovieClipChannelGate = validateHonorableChannel,
): void => {
  validateRange(
    clip.duration,
    `${path}.duration`,
    0,
    Infinity,
    "clip duration",
    violations,
    false,
  );
  validateUniqueBy(
    clip.tracks.map(
      (
        track: IAutoMovieTrack,
        index: number,
      ): { id: string; path: string } => ({
        id: `${track.channel.kind}:${JSON.stringify(track.channel)}`,
        path: `${path}.tracks[${index}].channel`,
      }),
    ),
    "clip track channel",
    violations,
  );
  clip.tracks.forEach((track: IAutoMovieTrack, i: number): void => {
    const trackPath: string = `${path}.tracks[${i}]`;
    channelGate(track.channel, `${trackPath}.channel`, violations);
    for (const fault of clipTrackShapeFaults(track, clip.duration))
      pushViolation(
        violations,
        fault.kind,
        `${trackPath}.${fault.field}`,
        `track ${fault.message}`,
        fault.value,
      );
  });
};
