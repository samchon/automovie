import { IAutoMovieCameraAction } from "@automovie/interface";

/**
 * Where on the subject the camera aims, as a fraction of its height: a close
 * shot looks at the head, a full shot at the middle of the body.
 *
 * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing FRAMING_AIM_FRACTION drives required-landmark framing: Where on the subject the camera aims, as a fraction of its height: a close shot looks at the head, a full shot at the middle of the body.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations FRAMING_AIM_FRACTION realizes landmark-based framing: Where on the subject the camera aims, as a fraction of its height: a close shot looks at the head, a full shot at the middle of the body.
 */
export const FRAMING_AIM_FRACTION: Record<
  IAutoMovieCameraAction["framing"],
  number
> = { wide: 0.5, full: 0.5, medium: 0.72, close: 0.85 };
