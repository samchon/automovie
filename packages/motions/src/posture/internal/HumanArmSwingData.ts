import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import type { AutoMovieHumanSide } from "@automovie/interface";
import type { IAutoMovieMotionHumanArmClearance } from "@automovie/interface";

/*
 * Quiet-arm tolerances are invariant for the same prepared body geometry.
 */
export const STANDING_ROOM: WeakMap<
  IAutoMovieMotionHumanBody,
  Partial<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmClearance.IBaseline>
  >
> = new WeakMap();
