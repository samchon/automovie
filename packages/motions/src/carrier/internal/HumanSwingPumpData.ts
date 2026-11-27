import type { IAutoMovieVector3 } from "@automovie/interface";

export namespace HumanSwingPumpData {
  /*
   * World vertical.
   */
  export const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

  /*
   * Seconds each change of posture takes, centred on the seat's turning point
   * (provisional staging).
   */
  export const TURN: number = 0.3;

  /*
   * Sampling step that locates the seat's turning points, seconds: finer than any
   * swing's half period.
   */
  export const STEP: number = 1 / 120;

  /*
   * How far past the straightened arm's reach a shoulder may lie from the wrist
   * its chain grip takes at full lean, metres: the 10 mm skin a held site allows
   * its hand.
   */
  export const SLIP: number = 0.01;

  /*
   * Knee flexion of the tucked and of the extended seated posture, degrees
   * (provisional staging).
   */
  export const TUCKED: number = 90;

  /*
   * Knee flexion with the legs extended forward, degrees (provisional staging).
   */
  export const EXTENDED: number = 15;
}
