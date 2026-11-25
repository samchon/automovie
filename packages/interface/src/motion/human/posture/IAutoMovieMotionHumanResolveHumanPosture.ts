import type { IAutoMoviePose } from "../../../pose/IAutoMoviePose";
import type { IAutoMovieSwivelNear } from "../../../pose/IAutoMovieSwivelNear";
import type { IAutoMovieSwivelSeed } from "../../../pose/IAutoMovieSwivelSeed";
import type { IAutoMovieSeededChainFit } from "../../IAutoMovieSeededChainFit";
import type { AutoMovieHumanLimb } from "./AutoMovieHumanLimb";

/** Companion helpers of {@link resolveHumanPosture}. */
export namespace IAutoMovieMotionHumanResolveHumanPosture {
  /** Each limb's nearby fit to continue (`IAutoMovieSwivelNear`). */
  export type INear = Readonly<
    Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelNear>>
  >;

  /**
   * A resolved pose with the seed each limb's fit was chosen at; null where a
   * limb's fit has none.
   */
  export interface ISeeded {
    /** The canonical pose. */
    pose: IAutoMoviePose;

    /** Each fitted limb's seed. */
    seeds: Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelSeed | null>>;

    /**
     * Each fitted limb's fit value (`IAutoMovieSeededChainFit.value`), where
     * its fit reports one.
     */
    values: Partial<
      Record<AutoMovieHumanLimb, IAutoMovieSeededChainFit["value"]>
    >;
  }
}
