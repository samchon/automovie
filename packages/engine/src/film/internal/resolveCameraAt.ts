import {
  type IAutoMovieResolveCameraAt,
  type IAutoMovieResolvedCamera,
  type IAutoMovieSampledChannel,
  IAutoMovieShot,
} from "@automovie/interface";

import { channelKey } from "../../resolve/internal/channelKey";
import { sampleClip } from "../../resolve/internal/sampleClip";

/**
 * A camera's world placement at shot-local `time`: its staged base transform
 * when the shot has no camera move, else the move's `translation` and
 * `rotation` tracks for the camera node sampled at `time`.
 *
 * A move that lacks one of the two tracks takes that component from the base.
 * Sampling follows {@link sampleClip}: time is clamped to the clip, or wrapped
 * when it loops, and an invalid time or a duplicated track throws. A component
 * taken from the base is the base's own object, not a copy.
 *
 * @param base The staged camera node's translation and rotation.
 * @param cameraMotion The shot's camera clip, or `null` for a static camera.
 * @param cameraId Node id whose tracks are read from the clip.
 * @param time Shot-local seconds.
 * @returns The lens position in metres and its world rotation.
 */
export function resolveCameraAt(
  base: IAutoMovieResolveCameraAt.IBase,
  cameraMotion: IAutoMovieShot["cameraMotion"],
  cameraId: string,
  time: number,
): IAutoMovieResolvedCamera {
  if (cameraMotion === null)
    return { position: base.translation, rotation: base.rotation };
  const sampled: Map<string, IAutoMovieSampledChannel> = sampleClip(
    cameraMotion,
    time,
  );
  const position: number[] | undefined = sampled.get(
    channelKey({ kind: "node", node: cameraId, path: "translation" }),
  )?.value;
  const rotation: number[] | undefined = sampled.get(
    channelKey({ kind: "node", node: cameraId, path: "rotation" }),
  )?.value;
  return {
    position:
      position === undefined
        ? base.translation
        : { x: position[0]!, y: position[1]!, z: position[2]! },
    rotation:
      rotation === undefined
        ? base.rotation
        : {
            x: rotation[0]!,
            y: rotation[1]!,
            z: rotation[2]!,
            w: rotation[3]!,
          },
  };
}
