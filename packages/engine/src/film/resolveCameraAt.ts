import {
  IAutoMovieQuaternion,
  IAutoMovieShot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieSampledChannel } from "../resolve/IAutoMovieSampledChannel";
import { channelKey } from "../resolve/channelKey";
import { sampleClip } from "../resolve/sampleClip";
import { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";

/**
 * A camera's world placement at shot-local `time`: its staged base transform when the shot has no camera move, else the move's `translation` and `rotation` tracks for the camera node sampled at `time`.
 *
 * A move that lacks one of the two tracks takes that component from the base. Sampling follows {@link sampleClip}: time is clamped to the clip, or wrapped when it loops, and an invalid time or a duplicated track throws. A component taken from the base is the base's own object, not a copy.
 *
 * @param base The staged camera node's translation and rotation.
 * @param cameraMotion The shot's camera clip, or `null` for a static camera.
 * @param cameraId Node id whose tracks are read from the clip.
 * @param time Shot-local seconds.
 * @returns The lens position in metres and its world rotation.
 *
 * @evidence contracts/common.md#principled-implementation Evaluates the shot's camera clip through sampleClip and addresses node translation/rotation through channelKey; an unanimated component keeps its staged base. Agreement with a renderer requires the same clip, clock, interpolation and transform conventions, and this numerical read alone observes no rendered frame.
 * @evidence contracts/common.md#clear-and-simple-design The one camera-placement resolver shared by keypoint projection, visual-read review, contract realization, clearance reports, geometry measurement and sound planning, so none of them restates the static-or-moving choice.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No camera id or move is special-cased; the fallback is the authored base, not an identity or a previous frame.
 * @evidence contracts/common.md#meaningful-documentation States both sources, the per-track fallback, the time handling and failures inherited from `sampleClip`, the aliasing of a base component, and each parameter's role and unit.
 * @evidence contracts/performance.md#efficient-algorithms One sampleClip call evaluates every supplied track with its key search and sampled component width, then two map reads select the camera channels; cost includes all tracks even when this reader uses only two.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Resolves one instant per call and keeps no cache, because the inputs are plain values with no identity to key one on; a caller that reads the same instant for several measurements, such as `reviewVisualRead` across its metrics, resolves it once and shares the result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The sampled channel map is released on return; the result references either the base's objects or two fresh vectors and retains nothing else.
 */
export function resolveCameraAt(
  base: { translation: IAutoMovieVector3; rotation: IAutoMovieQuaternion },
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
