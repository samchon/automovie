import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDrinkingArm,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { AutoMovieMotionHumanDrinkingArm } from "./AutoMovieMotionHumanDrinkingArm";
import { AutoMovieMotionHumanDrinkingSwivel } from "./AutoMovieMotionHumanDrinkingSwivel";
import { AutoMovieMotionHumanTouchUpright } from "./AutoMovieMotionHumanTouchUpright";

/**
 * A pool for one search.
 *
 * @param body The body.
 * @param posture The posture the arm is solved on.
 * @param side The hand.
 * @param sides How many sides of the vessel's rim the search tries; 1 when
 *   absent.
 * @param span The facings' turn either way of head on, degrees;
 *   `AutoMovieMotionHumanTouchUpright.SPAN` when absent.
 * @returns The pool, its bound not yet prepared.
 */
export function AutoMovieMotionHumanDrinkingPool(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
  sides: number = 1,
  span: number = AutoMovieMotionHumanTouchUpright.SPAN,
): AutoMovieMotionHumanDrinkingPool.IPool {
  let range: AutoMovieMotionHumanDrinkingSwivel.IRanged | undefined;
  const ranged: () => AutoMovieMotionHumanDrinkingSwivel.IRanged =
    (): AutoMovieMotionHumanDrinkingSwivel.IRanged =>
      (range ??= AutoMovieMotionHumanDrinkingSwivel.ranged(
        body,
        posture,
        side,
      ));
  return {
    read: AutoMovieMotionHumanDrinkingArm.prepareRead(body, side),
    bounds: (): ReturnType<typeof AutoMovieMotionHumanDrinkingSwivel.bounded> =>
      ranged().hint,
    admits: (): AutoMovieMotionHumanDrinkingSwivel.IRanged["admits"] =>
      ranged().admits,
    sides,
    span,
  };
}

/**
 * What every candidate of one drinking search shares while the body, the hand
 * and the posture the arm is solved on stay fixed: the fitted-arm reader, the
 * drinking range's swivel bound and the nearest arm tried, so a search over
 * several sides of a vessel's rim (`handToFaceVessel`) prepares them once and
 * its refusal reports the nearest arm of every side.
 */
export namespace AutoMovieMotionHumanDrinkingPool {
  /** One search's shared preparation and its nearest arm so far. */
  export interface IPool {
    /**
     * The fitted-arm reader of the fixed body and hand
     * (`AutoMovieMotionHumanDrinkingArm.prepareRead`); every call still fits
     * its own goal.
     */
    read: ReturnType<typeof AutoMovieMotionHumanDrinkingArm.prepareRead>;

    /**
     * The drinking range's swivel bound on the fixed posture
     * (`AutoMovieMotionHumanDrinkingSwivel.bounded`), prepared at its first
     * use.
     */
    bounds: () => ReturnType<typeof AutoMovieMotionHumanDrinkingSwivel.bounded>;

    /**
     * Whether a wrist's place, world metres, leaves any reaching elbow inside
     * the drinking range on the fixed posture
     * (`AutoMovieMotionHumanDrinkingSwivel.IRanged.admits`), the screen a
     * candidate passes before its fit.
     */
    admits: () => AutoMovieMotionHumanDrinkingSwivel.IRanged["admits"];

    /**
     * The arm tried so far that lies least past the drinking range
     * (`AutoMovieMotionHumanDrinkingArm.nearer`); absent before the first.
     */
    nearest?: IAutoMovieMotionHumanDrinkingArm.INearest;

    /**
     * How many sides of the vessel's rim the search tries, 1 for a vessel whose
     * side is fixed.
     */
    sides: number;

    /**
     * The turn either way of head on the facings are tried within, degrees
     * (`AutoMovieMotionHumanTouchUpright.facings`).
     */
    span: number;
  }
}
