import type { IAutoMovieMotionHumanBody, AutoMovieHumanSide, IAutoMovieMotionHumanArmClearance } from "@automovie/interface";

export namespace HumanArmSwingData {
  /*
   * Quiet-arm tolerances are invariant for the same prepared body geometry.
   */
  export const STANDING_ROOM: WeakMap<
    IAutoMovieMotionHumanBody,
    Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmClearance.IBaseline>
    >
  > = new WeakMap();
}
