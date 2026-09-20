import { IAutoMovieQuaternion, IAutoMovieShot, IAutoMovieVector3 } from "@automovie/interface";
import { channelKey } from "../resolve/channelKey";
import { sampleClip } from "../resolve/sampleClip";
import { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";

/**
 * The camera's world placement at `time`: static (its base transform), or
 * sampled from its `cameraMotion` clip. A move missing a track falls back to
 * the static component.
 *
 * @evidence requirements/camera/scope-and-identity.md#camera-spatial-state-binding Resolves position and rotation tracks for the named camera at the requested time and falls back component-wise to that camera's staged transform when a track is absent.
 * @evidence requirements/camera/scope-and-identity.md#camera-geometric-truth Resolves the addressed camera's actual world transform at the sample time from its motion tracks and staged fallback, independent of framing intent metadata.
 * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-target-sampling Samples the addressed camera-motion clip at the caller's film time, providing camera translation and rotation for the same instant used by moving-target consumers.
 * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-camera-authority-spatial-binding resolveCameraAt realizes explicit camera spatial binding: The camera's world placement at `time`: static (its base transform), or sampled from its `cameraMotion` clip. A move missing a track falls back to the static component.
 * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Provides the camera half of the same-time state pair by sampling translation and rotation at the addressed film instant.
 */
export const resolveCameraAt = (
  base: { translation: IAutoMovieVector3; rotation: IAutoMovieQuaternion },
  cameraMotion: IAutoMovieShot["cameraMotion"],
  cameraId: string,
  time: number,
): IAutoMovieResolvedCamera => {
  if (cameraMotion === null)
    return { position: base.translation, rotation: base.rotation };
  const sampled = sampleClip(cameraMotion, time);
  const position = sampled.get(
    channelKey({ kind: "node", node: cameraId, path: "translation" }),
  )?.value;
  const rotation = sampled.get(
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
};
