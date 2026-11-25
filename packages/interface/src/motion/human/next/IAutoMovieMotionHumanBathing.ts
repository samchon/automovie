import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanCrossing } from "./IAutoMovieMotionHumanCrossing";

/**
 * Bathing composed from shipped actions: getting into and out of a bathtub,
 * washing under a shower and drying with a towel. Each method appends shipped
 * step-over, sit, rise, operate, touch and pickup actions, so they are fitted,
 * refused and checked as those actions are.
 *
 * - Into the tub: step over its apron onto its floor, turn along the tub and sit
 *   on its floor with the legs long; out by stepping over the apron from inside
 *   onto the floor outside.
 * - Shower: turn the tap's knob on, scrub the scalp with both hands, the face and
 *   each forearm with the other hand, then turn it off.
 * - Towel: take the towel and rub it over the scalp with both hands.
 *
 * Each region is rubbed in 4 strokes, the tap knob turns a quarter turn (90
 * degrees) and the bather soaks 3 s in the tub (all provisional); the owning
 * constants are `AutoMovieMotionHumanBathing.SCRUBS`, `TAP_TURN` and `SOAK`.
 *
 * Each method is a helper over a chain: it takes the chain first and returns it
 * with the actions appended, as the runtime namespace takes it.
 *
 * @template Chain The chain every method takes and returns.
 */
export interface IAutoMovieMotionHumanBathing<Chain> {
  /**
   * Step over the tub's apron onto its floor, turn along the tub with a few
   * steps on that floor, and sit down on it with the legs long, as one sits in
   * a bath.
   *
   * @param chain The chain the helper appends to; it is returned with the
   *   actions added.
   * @param params The `tub`, `floor`, `at` and `face` of
   *   `IAutoMovieMotionHumanBathing.IIntoTub`; the bather stands before the
   *   tub's apron.
   * @returns The chain with the entry appended.
   */
  intoTub(chain: Chain, params: IAutoMovieMotionHumanBathing.IIntoTub): Chain;

  /**
   * Step out of the tub over its apron, from standing on its floor facing the
   * apron, onto the floor outside, such as a bath mat.
   *
   * @param chain The chain the helper appends to; it is returned with the
   *   actions added.
   * @param params The `tub` and `onto` of
   *   `IAutoMovieMotionHumanBathing.IOutOfTub`.
   * @returns The chain with the exit appended.
   */
  outOfTub(chain: Chain, params: IAutoMovieMotionHumanBathing.IOutOfTub): Chain;

  /**
   * Shower: open the tap, wash the scalp, the face and both forearms, close the
   * tap.
   *
   * @param chain The chain the helper appends to; it is returned with the
   *   actions added.
   * @param params The `tap` of `IAutoMovieMotionHumanBathing.IShower`.
   * @returns The chain with the wash appended.
   */
  shower(chain: Chain, params: IAutoMovieMotionHumanBathing.IShower): Chain;

  /**
   * Take the towel and dry the scalp with it in both hands.
   *
   * @param chain The chain the helper appends to; it is returned with the
   *   actions added.
   * @param params The `towel` and `handle` of
   *   `IAutoMovieMotionHumanBathing.ITowelDry`.
   * @returns The chain with the drying appended.
   */
  towelDry(chain: Chain, params: IAutoMovieMotionHumanBathing.ITowelDry): Chain;
}

/** The parameter types of the Bathing methods. */
export namespace IAutoMovieMotionHumanBathing {
  /** A region one hand scrubs with the other. */
  export type IWashed = "face" | "forearmLeft" | "forearmRight";

  /** The parameters of `intoTub`. */
  export interface IIntoTub {
    /** The tub's subject, the obstacle stepped over and the floor walked on. */
    tub: string;

    /** The tub's floor surface inside the apron, where both feet land. */
    floor: string;

    /** Where on the tub's floor the bather sits, world metres. */
    at: IAutoMovieVector3;

    /** The heading the bather sits facing, degrees about +Y: along the tub. */
    face: number;
  }

  /** The parameters of `outOfTub`. */
  export interface IOutOfTub {
    /** The tub's subject, the obstacle stepped over from inside. */
    tub: string;

    /** The level surface outside the tub both feet land on. */
    onto: IAutoMovieMotionHumanCrossing.ISurface;
  }

  /** The parameters of `shower`. */
  export interface IShower {
    /** The tap knob. */
    tap: IAutoMovieMotionTarget;
  }

  /** The parameters of `towelDry`. */
  export interface ITowelDry {
    /** The towel's subject. */
    towel: string;

    /** The towel's grip. */
    handle: string;
  }
}
