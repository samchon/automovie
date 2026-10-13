import { IAutoMovieCameraAction } from "@automovie/interface";

/** One key per move; the record type rejects a missing or unknown move. */
const MOVES: Record<IAutoMovieCameraAction["move"], true> = {
  static: true,
  follow: true,
  orbit: true,
  "push-in": true,
  truck: true,
  whip: true,
};

/**
 * Every member of the closed camera move union, for gating values that arrive
 * from authored JSON at runtime.
 *
 * Built from a record keyed by the union, so a move added to the interface
 * fails compilation here instead of being silently refused by every gate.
 */
export const CAMERA_MOVES: ReadonlySet<IAutoMovieCameraAction["move"]> =
  new Set(Object.keys(MOVES) as IAutoMovieCameraAction["move"][]);
