import { IAutoMovieCameraAction } from "@automovie/interface";

/**
 * The framing grammar: how much vertical world-space the frame shows, as a
 * multiple of the subject's height. `close` fills the frame with head and
 * shoulders; `wide` shows the subject small in its surroundings.
 */
export const FRAMING_HEIGHT_FRACTION: Record<
  IAutoMovieCameraAction["framing"],
  number
> = { wide: 4, full: 1.15, medium: 0.62, close: 0.28 };
