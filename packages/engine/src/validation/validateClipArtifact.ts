import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { asArray } from "./asArray";
import { isRecord } from "./isRecord";
import { pushViolation } from "./pushViolation";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateNonEmptyId } from "./validateNonEmptyId";
import { validateObjectArtifact } from "./validateObjectArtifact";
import { validateRange } from "./validateRange";
import { validateUniqueBy } from "./validateUniqueBy";
import { clipLoopFault } from "./clipLoopFault";
import { clipTrackShapeFaults } from "./clipTrackShapeFaults";
import { IAutoMovieClipChannelGate } from "./IAutoMovieClipChannelGate";
import { validateHonorableChannel } from "./validateHonorableChannel";

/**
 * One clip's structural contract, to the depth every consumer dereferences it.
 *
 * Exported because the shot artifact is not its only gate: the project store
 * validates stored clips on READ, and a gate that exists to catch a corrupted
 * file must check what its consumers dereference (#1324).
 *
 * The keyframe payload comes from the contract `sampleClip` itself reads
 * ({@link clipTrackShapeFaults}), rather than from a second hand-maintained copy
 * of it. Holding the rule twice is what let this gate learn ONE of the
 * sampler's checks and none of the other seven, so a clip with an uneven value
 * stride, an empty keyframe list, a wrong value width, an unsupported
 * interpolation, a non-triplet `cubicspline` stride, a non-boolean `loop`, or
 * an unknown node channel path validated clean here and threw out of the engine
 * when something played it (#1353).
 *
 * The clip's own `duration` stays stricter here than the sampler's rule: a
 * committed clip must last longer than zero seconds, while the sampler
 * tolerates a zero-length clip by normalizing every query to its start. A gate
 * stricter than its consumer refuses more, never less, so it cannot let a throw
 * escape.
 *
 * Two orthogonal questions, and every clip is asked both. The SHAPE of a track
 * ({@link clipTrackShapeFaults}) is the same for every clip a shot carries,
 * `lightMotions` included, and `channelValueWidth` already reads a pointer
 * channel's width from its `valueType`, so nothing about that contract is
 * node-only. Which channel a track may ADDRESS is the shot FIELD's own rule,
 * because a field admits exactly what its applier writes, and that is what
 * `channelGate` carries.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `validateClipArtifact` locates invalid clip identity, duration, loop flag, track ids, channel addresses, key times, and value strides at their stored members.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `validateClipArtifact` preserves the caller's clip root and each relative track fault while applying the field-specific channel gate.
 */
export const validateClipArtifact = (
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
  const loop = clipLoopFault(clip.loop);
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
  validateUniqueBy(
    asArray(clip.tracks).map((track, index) => ({
      id: isRecord(track)
        ? `${String(isRecord(track.channel) ? track.channel.kind : undefined)}:${JSON.stringify(track.channel)}`
        : undefined,
      path: `${path}.tracks[${index}].channel`,
    })),
    "clip track channel",
    violations,
  );
  asArray(clip.tracks).forEach((track, i) => {
    const trackPath = `${path}.tracks[${i}]`;
    if (!validateObjectArtifact(track, trackPath, "clip track", violations))
      return;
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
  });
};
