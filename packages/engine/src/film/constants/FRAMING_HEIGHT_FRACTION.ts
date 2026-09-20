import { IAutoMovieCameraAction } from "@automovie/interface";

/**
 * The framing grammar: how much vertical world-space the frame shows, as a
 * multiple of the subject's height. `close` fills the frame with head and
 * shoulders; `wide` shows the subject small in its surroundings.
 *
 * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing FRAMING_HEIGHT_FRACTION drives required-landmark framing: The framing grammar: how much vertical world-space the frame shows, as a multiple of the subject's height. `close` fills the frame with head and shoulders; `wide` shows the subject small in its surroundings.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations FRAMING_HEIGHT_FRACTION realizes landmark-based framing: The framing grammar: how much vertical world-space the frame shows, as a multiple of the subject's height. `close` fills the frame with head and shoulders; `wide` shows the subject small in its surroundings.
 */
export const FRAMING_HEIGHT_FRACTION: Record<
  IAutoMovieCameraAction["framing"],
  number
> = { wide: 4, full: 1.15, medium: 0.62, close: 0.28 };
