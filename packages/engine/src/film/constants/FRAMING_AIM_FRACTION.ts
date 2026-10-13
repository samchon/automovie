import { IAutoMovieCameraAction } from "@automovie/interface";

/**
 * Where on the subject the camera aims, as a fraction of its height: a close
 * shot looks at the head, a full shot at the middle of the body.
 */
export const FRAMING_AIM_FRACTION: Record<
  IAutoMovieCameraAction["framing"],
  number
> = { wide: 0.5, full: 0.5, medium: 0.72, close: 0.85 };
