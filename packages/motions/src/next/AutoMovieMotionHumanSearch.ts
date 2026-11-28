import { RUMMAGE as RUMMAGESource } from "../search/internal/RUMMAGE";
import { searchBag as searchBagLaw } from "../search/internal/searchBag";

/** Compose fingertip searches through the opening of a bag. */
export namespace AutoMovieMotionHumanSearch {
  /**
   * Rub the bag's `inside` affordance with the chosen hand's fingertips. A
   * found-item request then picks up the named item by its grip and lifts it
   * the supplied bag depth in metres. Select `type: "no-find"` to end the
   * attempt after rummaging. Append a search of another bag to stage a retry.
   *
   * @param chain The searcher's chain. Place the searcher within reach of the
   *   opening and supply an open bag with an `inside` affordance.
   * @param params The bag, hand and authored outcome. The hand defaults to
   *   right.
   * @returns The chain with the search appended.
   */
  export const searchBag: typeof searchBagLaw = searchBagLaw;

  /** Number of fingertip rubbing strokes during a bag search. */
  export const RUMMAGE: typeof RUMMAGESource = RUMMAGESource;
}
