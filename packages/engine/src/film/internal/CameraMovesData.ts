import type { IAutoMovieCameraAction } from "@automovie/interface";

/*
 * One key per move; the record type rejects a missing or unknown move.
 */
export const MOVES: Record<IAutoMovieCameraAction["move"], true> = {
  static: true,
  follow: true,
  orbit: true,
  "push-in": true,
  truck: true,
  whip: true,
};
