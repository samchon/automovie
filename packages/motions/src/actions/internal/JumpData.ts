import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";

export namespace JumpData {
  /*
   * Offset decay time of a cut out of the settled jump, seconds (a deliberate
   * change of the whole body's action,
   * `AutoMovieMotionHumanInterrupt.BLENDS.deliberate`).
   */
  export const BLEND: number = AutoMovieMotionHumanInterrupt.BLENDS.deliberate;
}
