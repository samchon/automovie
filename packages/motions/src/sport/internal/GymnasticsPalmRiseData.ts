import { AutoMovieEngineDefaultHumanoidRom } from "@automovie/engine";

export namespace GymnasticsPalmRiseData {
  /*
   * The wrist's extension limit, degrees: the hand's flexion range's far end
   * (`AutoMovieEngineDefaultHumanoidRom`, flexion negative toward the back of the hand).
   */
  export const WRIST: number = -AutoMovieEngineDefaultHumanoidRom.leftHand!.flexion!.min;

  /*
   * The knuckles' hyperextension limit, degrees (`AutoMovieEngineDefaultHumanoidRom`, the
   * fingers' proximal joints).
   */
  export const KNUCKLE: number = -AutoMovieEngineDefaultHumanoidRom.leftIndexProximal!.flexion!.min;

  /*
   * The thumb's interphalangeal extension limit, degrees
   * (`AutoMovieEngineDefaultHumanoidRom`).
   */
  export const THUMB_IP: number = -AutoMovieEngineDefaultHumanoidRom.leftThumbDistal!.flexion!.min;

  /*
   * Degrees the wrist is kept inside its limit.
   */
  export const MARGIN: number = 5;

  /*
   * The fingers' proximal joints, whose extension keeps the fingers flat as the
   * palm rises.
   */
  export const FINGERS: readonly string[] = ["Index", "Middle", "Ring", "Little"];
}
