import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionHumanTouchDrink,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanDrinkingPool } from "../compose/AutoMovieMotionHumanDrinkingPool";
import { AutoMovieMotionHumanTouchDrink } from "../compose/AutoMovieMotionHumanTouchDrink";
import { AutoMovieMotionHumanTouchStance } from "../compose/AutoMovieMotionHumanTouchStance";
import { AutoMovieMotionHumanTouchUpright } from "../compose/AutoMovieMotionHumanTouchUpright";

/** The alternatives of `OfPlace`'s site. */
type OfPlace = "point" | "normal";

/**
 * The first side whose drink is admitted.
 *
 * @param body The body.
 * @param posture The posture the arm is solved on at the region.
 * @param side The hand.
 * @param sides The effectors of the rim's sides, in the order tried
 *   (`HumanHeld.sides`).
 * @param place The region.
 * @param hint The elbow's hint each candidate starts from, world.
 * @param after Where the vessel is held while the drinker drinks.
 * @returns The side and its drink.
 * @throws {HumanRefusal} When no side admits a drink: the first side's reach
 *   refusal, naming every other side's after it; any other refusal at once.
 */
export function handToFaceVessel(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
  sides: readonly IAutoMovieMotionHumanTouchEffector.IEffector[],
  place: Pick<IAutoMovieMotionHumanTarget.IPlace, OfPlace>,
  hint: IAutoMovieVector3,
  after: IAutoMovieMotionHumanTouchDrink.IAfter,
): handToFaceVessel.IVessel {
  // The hand's turn at the lips is the facing less the side, so with the
  // sides spaced evenly round the rim (`HumanHeld.SIDES`) the facings need
  // cover only half the turn between two neighbouring sides, rounded up to
  // the facings' step; head on stays the first tried.
  const span: number =
    AutoMovieMotionHumanTouchUpright.STEP *
    Math.ceil(
      180 / sides.length / AutoMovieMotionHumanTouchUpright.STEP - 1e-9,
    );
  const pool: AutoMovieMotionHumanDrinkingPool.IPool =
    AutoMovieMotionHumanDrinkingPool(
      body,
      posture,
      side,
      sides.length,
      Math.min(span, AutoMovieMotionHumanTouchUpright.SPAN),
    );
  // The rim's sides are the law's candidates in their order; the first one
  // the drinking arm reaches is drunk from
  // (`AutoMovieMotionHumanTouchStance.choose`).
  return AutoMovieMotionHumanTouchStance.choose<
    IAutoMovieMotionHumanTouchEffector.IEffector,
    handToFaceVessel.IVessel
  >({
    candidates: sides,
    reach: (
      effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    ): handToFaceVessel.IVessel => ({
      effector,
      drink: AutoMovieMotionHumanTouchDrink.drinking(
        body,
        posture,
        side,
        effector,
        place,
        hint,
        after,
        pool,
      ),
    }),
  });
}

/**
 * The side of a held vessel's rim a drink is taken from, found by the drink's
 * own admission (`AutoMovieMotionHumanTouchDrink.drinking`): the first side, in
 * the order the held prop lists them (`HumanHeld.sides`, the act's own side
 * first, then alternately either way), at which a lean and a facing let the arm
 * hold the vessel as a person drinks.
 *
 * The side and the facing both turn the hand about the vessel's axis: the
 * facing turns the vessel about the mouth, the side turns which point of the
 * rim meets the mouth, so the hand's turn at the lips is the facing less the
 * side. Choosing the side first by how upright the arm holds the vessel without
 * leaning it (`HumanHeld.steadiest`), and only then searching the lean and the
 * facing, confined the hand's turn to that one side's span of facings: a drink
 * whose forearm needed a turn beyond it was refused at the span's edge (facing
 * 90 degrees off head on, the forearm at its twist's end), though another side
 * holds it. With the side free, the sides carry the hand's turn round the whole
 * rim and the facings need cover only the turn between two neighbouring sides,
 * so each side tries the facings within that turn of head on: the rim meets the
 * lips from before the face, as a drinker brings it, rather than from beside
 * the mouth.
 */
export namespace handToFaceVessel {
  /** The side found and its drink. */
  export interface IVessel {
    /** The effector of the admitted side. */
    effector: IAutoMovieMotionHumanTouchEffector.IEffector;

    /** The facing, lean, tilt and elbow hint its arm was admitted with. */
    drink: IAutoMovieMotionHumanTouchDrink.IDrink;
  }
}
