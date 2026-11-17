import type { IAutoMovieFootfallPattern } from "./IAutoMovieFootfallPattern";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Balance fit anchored at the actual floating-base pose, with separate root intent.
 *
 * @evidence contracts/development/design.md#principled-representation Rebase the selected seed to the measured root for stance fitting while independent authored intent determines the reach-derived lowering request.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Existing profile, footfall and pose contracts feed the shared support-result contract without another result wrapper.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The stance pass uses zero root-drop budget so a virtual lowered root cannot impersonate the actual base; unreachable goals retain residuals.
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish actual pose, optional warm seed, independent intent and world endpoint goals, with metre limits and finite iteration budget.
 */
export namespace IAutoMoviePlanPhysicalBalanceTargets {
  /**
   * Fit world support intent in the measured floating-base frame. Reach-derived lowering remains a separate root motor request; no lowered virtual root is passed off as the actual stance frame.
   */
  export type IInput = {
    /** Actual provider and bounded balance IK policy. */ profile: IAutoMoviePhysicalProfile;
    /** Owned endpoint chains, independent of species. */ pattern: IAutoMovieFootfallPattern;
    /** Coherent motor intent before balance fitting. */ targets: Readonly<
      Record<string, IAutoMoviePhysicalProfile.ITransform>
    >;
    /** Actual simultaneous root pose. */ root: {
      /** Root segment bone used as the rebasing anchor. */
      bone: string;
      /** Measured root world position in metres and rotation, borrowed for this fit. */
      pose: IAutoMoviePhysicalProfile.ITransform;
    };
    /** Previous correction carried through current authored coordinates; original goals and root intent remain authoritative. */ seed?: Readonly<
      Record<string, IAutoMoviePhysicalProfile.ITransform>
    >;
    /** Independent authored/recovery root intent used only to derive its lowering request. */ intent?: IAutoMoviePhysicalProfile.ITransform;
    /** Recovery and planted world endpoint goals. */ goals: Readonly<
      Record<string, IAutoMovieVector3>
    >;
    /** Actual stance owners; swinging/reserved endpoints are omitted. */ planted: readonly string[];
    /** World floor height. */ floor: number;
    /** Root-position intent budget, metres. */ maximumRootDrop: number;
    /** Existing balance update budget. */ iterations: number;
    /** Existing endpoint/floor tolerance, metres. */ tolerance: number;
  };
}
