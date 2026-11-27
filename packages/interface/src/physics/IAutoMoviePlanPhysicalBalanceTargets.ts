import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFootfallPattern } from "./IAutoMovieFootfallPattern";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/**
 * Balance fit anchored at the actual floating-base pose, with separate root
 * intent.
 */
export namespace IAutoMoviePlanPhysicalBalanceTargets {
  /**
   * Fit world support intent in the measured floating-base frame. Reach-derived
   * lowering remains a separate root motor request; no lowered virtual root is
   * passed off as the actual stance frame.
   */
  export type IInput = {
    /** Actual provider and bounded balance IK policy. */ profile: IAutoMoviePhysicalProfile;
    /** Owned endpoint chains, independent of species. */ pattern: IAutoMovieFootfallPattern;
    /** Coherent motor intent before balance fitting. */ targets: Readonly<
      Record<string, IAutoMovieRigidTransform>
    >;
    /** Actual simultaneous root pose. */ root: IInputRoot;
    /**
     * Previous correction carried through current authored coordinates;
     * original goals and root intent remain authoritative.
     */ seed?: Readonly<Record<string, IAutoMovieRigidTransform>>;
    /**
     * Independent authored/recovery root intent used only to derive its
     * lowering request.
     */ intent?: IAutoMovieRigidTransform;
    /** Recovery and planted world endpoint goals. */ goals: Readonly<
      Record<string, IAutoMovieVector3>
    >;
    /** Actual stance owners; swinging/reserved endpoints are omitted. */ planted: readonly string[];
    /** World floor height. */ floor: number;
    /** Root-position intent budget, metres. */ maximumRootDrop: number;
    /** Existing balance update budget. */ iterations: number;
    /** Existing endpoint/floor tolerance, metres. */ tolerance: number;
  };

  /** The root object of {@link IInput}. */
  export type IInputRoot = {
    /** Root segment bone used as the rebasing anchor. */
    bone: string;
    /**
     * Measured root world position in metres and rotation, borrowed for this
     * fit.
     */
    pose: IAutoMovieRigidTransform;
  };
}
