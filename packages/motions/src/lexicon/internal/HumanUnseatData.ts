import type { IAutoMovieMotionHumanUnseat, IAutoMovieVector3 } from "@automovie/interface";

export namespace HumanUnseatData {
  /*
   * Each fall's push, in the carrier's frame with `+X` toward the falling side
   * (provisional stage readings).
   */
  export const PUSHES: Readonly<Record<IAutoMovieMotionHumanUnseat.Fall, IPush>> = {
    back: { direction: { x: 0, y: 0.3, z: -1 }, speed: 1.5 },
    side: { direction: { x: 1, y: 0.4, z: 0 }, speed: 1.5 },
    forward: { direction: { x: 0, y: 0.6, z: 1 }, speed: 2 },
    pullDown: { direction: { x: 1, y: -0.3, z: 0 }, speed: 2 },
    drag: { direction: { x: 1, y: 0.2, z: -0.3 }, speed: 1 },
    clear: { direction: { x: 1, y: 0.5, z: 0 }, speed: 1.5 },
    slump: { direction: { x: 1, y: 0, z: 0 }, speed: 0.5 },
  };

  /*
   * Seconds either side the release velocity is read over.
   */
  export const STEP: number = 1 / 240;

  /*
   * A fall's push away from the saddle.
   */
  export interface IPush {
    /*
     * Its direction in the carrier's frame, `+X` toward the falling side.
     */
    direction: IAutoMovieVector3;

    /*
     * Its speed, metres per second.
     */
    speed: number;
  }
}
