import type { IHumanCaptureCamera } from "./IHumanCaptureCamera.js";

/**
 * Recorded view angles with optional perspective framing in displayed metres.
 * The consumer owns defaults for omitted distance, target and field of view.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Carries a recorded display camera independently of numerical facial parameters.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Keeps measured view angles and optional framing under the camera owner.
 * @author Samchon
 */
export interface IHumanCaptureCameraPose
  extends Pick<IHumanCaptureCamera, "yaw" | "pitch" | "fov"> {
  /** Positive eye-to-target distance in displayed metres, when recorded. */
  distance?: number;

  /** Finite target position in the displayed Y-up metre frame, when recorded. */
  target?: [number, number, number];
}
