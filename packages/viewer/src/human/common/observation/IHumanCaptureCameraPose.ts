import type { IHumanCaptureCamera } from "./IHumanCaptureCamera.js";

/**
 * Recorded view angles with optional perspective framing in displayed metres.
 * The consumer owns defaults for omitted distance, target and field of view.
 *
 * @author Samchon
 */
export interface IHumanCaptureCameraPose
  extends Pick<IHumanCaptureCamera, "yaw" | "pitch" | "fov"> {
  /** Positive eye-to-target distance in displayed metres, when recorded. */
  distance?: number;

  /** Finite target position in the displayed Y-up metre frame, when recorded. */
  target?: [number, number, number];
}
