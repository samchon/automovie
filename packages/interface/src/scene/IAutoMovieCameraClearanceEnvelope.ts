import { IAutoMovieCameraClearanceSphere } from "./IAutoMovieCameraClearanceSphere";

/**
 * Physical envelopes carried by one authored and resolved camera.
 *
 * The camera body always has an envelope. A parent rig is explicit when the
 * camera rides a dolly, crane, vehicle mount, stabilizer, or other support whose
 * volume can collide even while the camera body itself remains clear.
 *
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clearance Makes camera-body and optional parent-rig clearance independently declarable.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-constraints-refusal Preserves the two physical owners the path evaluator reports separately.
 * @author Samchon
 */
export interface IAutoMovieCameraClearanceEnvelope {
  /** Optical body, lens, cage, and immediately carried camera hardware. */
  body: IAutoMovieCameraClearanceSphere;

  /** Parent support rig, or `null` when the camera has no separate host rig. */
  parentRig: IAutoMovieCameraClearanceSphere | null;
}
