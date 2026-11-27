import { AutoMovieEngineDefaultHumanoidRom } from "@automovie/engine";

export namespace AutoMovieMotionHumanFootRelaxData {
  /*
   * The ankle's least roll, degrees: the foot's abduction range's low end
   * (`AutoMovieEngineDefaultHumanoidRom`).
   */
  export const ROLL_LEAST: number = AutoMovieEngineDefaultHumanoidRom.leftFoot!.abduction!.min;

  /*
   * The ankle's greatest roll, degrees: the foot's abduction range's high end
   * (`AutoMovieEngineDefaultHumanoidRom`).
   */
  export const ROLL_MOST: number = AutoMovieEngineDefaultHumanoidRom.leftFoot!.abduction!.max;
}
