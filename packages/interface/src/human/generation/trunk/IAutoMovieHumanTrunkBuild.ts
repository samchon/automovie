import type { IAutoMovieConstructionView } from "../../../construction/IAutoMovieConstructionView";
import type { IAutoMovieLoftContract } from "../../../construction/IAutoMovieLoftContract";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanBodyTree } from "../IAutoMovieHumanBodyTree";
import type { IAutoMovieHumanMammaryJoin } from "../IAutoMovieHumanMammaryJoin";
import type { IAutoMovieHumanMassPart } from "../limb/IAutoMovieHumanMassPart";
import type { IAutoMovieHumanNamedSource } from "../limb/IAutoMovieHumanNamedSource";
import type { IAutoMovieHumanSourceDefinition } from "../limb/IAutoMovieHumanSourceDefinition";
import type { IAutoMovieHumanTrunkLegs } from "./IAutoMovieHumanTrunkLegs";
import type { IAutoMovieHumanTrunkSectionFamily } from "./IAutoMovieHumanTrunkSectionFamily";
import type { IAutoMovieHumanTrunkViewPart } from "./IAutoMovieHumanTrunkViewPart";
import type { IAutoMovieHumanTrunkViews } from "./IAutoMovieHumanTrunkViews";

/**
 * Type contracts exchanged by AutoMovieHumanTrunkBuild; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanTrunkBuild {
  /** What the build reads. */
  export interface IInput {
    /**
     * Same original leg definitions consumed by production lofts, before either
     * tape pass builds its parent contact.
     */
    legs?: Record<"left" | "right", IAutoMovieHumanSourceDefinition>;
    /**
     * Same regional factory publishes each trial/final leg against that exact
     * parent; no independent hip estimate.
     */
    bindLeg?: IAutoMovieHumanTrunkLegs.IInput["bindLeg"];
    /** The base's views (`AutoMovieHumanTrunkViews.of`). */
    views: IAutoMovieHumanTrunkViews;

    /**
     * Retained upper scalar support on the head axis. The shared-neck part
     * excludes its exterior domain above the regular connection.
     */
    top?: IAutoMovieHumanTrunkViewPart.ITop;

    /**
     * The tapes that wrap the merged skin, mm: the chest over the breasts, the
     * hip over the gluteal masses.
     */
    tapes: {
      /**
       * Closed merged-skin chest tape over the breasts, calibration
       * millimetres.
       */
      chest: number;
      /**
       * Closed merged-skin hip tape over the gluteal masses, calibration
       * millimetres.
       */
      hip: number;
    };

    /** The breasts' law, or null where the amplitude leaves none. */
    breast: IMassLaw | null;

    /** Actual breast landmarks and original arm readers on the production trunk. */
    mammary?: IAutoMovieHumanMammaryJoin.IPlacement;

    /** The gluteal masses' law, or null. */
    gluteal: IMassLaw | null;

    /**
     * Use the native radial pelvis and prepare the rear trunk field when a mass
     * law exists.
     */
    nativeGluteal?: boolean;
  }

  /** A mass's law on the left side, in calibration mm. */
  export interface IMassLaw {
    /**
     * Declared AP skin apex on the left, calibration mm; its height and
     * transverse place must not move during wall placement.
     */
    target: AutoMovieVector3Tuple;

    /** The up direction of its footprint. */
    up: AutoMovieVector3Tuple;

    /** Footprint edges at the base, along up, lateral, down and medial, mm. */
    footprint: [number, number, number, number];

    /**
     * Profile: shares of the amplitude with the shares of the edges left there,
     * as `AutoMovieHumanMassPart`.
     */
    profile: IAutoMovieHumanMassPart.IInput["profile"];

    /** Sourced conic shoulder of its sections. */
    shoulder: number;

    /**
     * Declared geometric join radius, mm; the current interim caller derives
     * operational softness from sampling pitch, not fat thickness.
     */
    fold: number;
  }

  /** What the build publishes. */
  export interface IOutput {
    /**
     * Both legs bound to the published trunk; absent when a final parent is
     * unavailable.
     */
    legs?: IInput["legs"];
    /** Common original measurement planes consumed by both preparation passes. */
    sections: ReadonlyMap<string, IAutoMovieHumanTrunkSectionFamily.IPlane>;
    /** The base's view node, or null when it cannot be lofted. */
    trunk: IAutoMovieConstructionView | null;

    /** Each mass's fold onto the base, for the body's tree. */
    masses: IAutoMovieHumanBodyTree.IFold[];

    /** Every broken premise. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];

    /**
     * Actual builder results in production order, including both tape passes
     * and failed admissions.
     */
    sources: IAutoMovieHumanNamedSource[];
  }

  /**
   * The head argument of AutoMovieHumanTrunkBuild.withHead. Preserve the
   * existing upper scalar support from the canonical head axis; the regular
   * shared connection excludes that support's dome from the loft domain.
   */
  export type IWithHeadHead =
    | {
        /**
         * Geometric part with its original axis and section laws; its declared
         * source frame and units apply.
         */
        part: Pick<IAutoMovieViewPart, "axis" | "stations">;
        /** Head crown in the registered source frame, calibration millimetres. */
        crown: AutoMovieVector3Tuple;
      }
    | undefined;
}
