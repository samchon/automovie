import type { IAutoMovieConstructionView } from "../../../construction/IAutoMovieConstructionView";
import type { IAutoMovieLoftContract } from "../../../construction/IAutoMovieLoftContract";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanBodyTree } from "../IAutoMovieHumanBodyTree";
import type { IAutoMovieHumanMassPart } from "../limb/IAutoMovieHumanMassPart";
import type { IAutoMovieHumanSiteViewPart } from "../limb/IAutoMovieHumanSiteViewPart";
import type { IAutoMovieHumanTrunkLegs } from "./IAutoMovieHumanTrunkLegs";
import type { IAutoMovieHumanTrunkSectionFamily } from "./IAutoMovieHumanTrunkSectionFamily";
import type { IAutoMovieHumanTrunkViewPart } from "./IAutoMovieHumanTrunkViewPart";
import type { IAutoMovieHumanTrunkViews } from "./IAutoMovieHumanTrunkViews";

/** Type contracts exchanged by AutoMovieHumanTrunkBuild; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanTrunkBuild {
  /** What the build reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the build reads.
   * @evidence contracts/development/design.md#principled-representation `legs`: Same original leg definitions consumed by production lofts, before either tape pass builds its parent contact. `bindLeg`: Same regional factory publishes each trial/final leg against that exact parent; no independent hip estimate. `views`: The base's views (`AutoMovieHumanTrunkViews.of`).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanTrunkBuild.withHead. Read by AutoMovieHumanTrunkBuild.withHead, AutoMovieHumanTrunkBuild.create, AutoMovieHumanTrunkBuild.define. Also types AutoMovieHumanBodyPreparation.original, AutoMovieHumanTrunkBuild.firstInput.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `legs`: Same original leg definitions consumed by production lofts, before either tape pass builds its parent contact. `bindLeg`: Same regional factory publishes each trial/final leg against that exact parent; no independent hip estimate. `top`: Retained upper scalar support on the head axis.
   */
  export interface IInput {
    /** Same original leg definitions consumed by production lofts, before either tape pass builds its parent contact. */
    legs?: Record<"left" | "right", IAutoMovieHumanSiteViewPart.IDefinition>;
    /** Same regional factory publishes each trial/final leg against that exact parent; no independent hip estimate. */
    bindLeg?: IAutoMovieHumanTrunkLegs.IInput["bindLeg"];
    /** The base's views (`AutoMovieHumanTrunkViews.of`). */
    views: IAutoMovieHumanTrunkViews;

    /** Retained upper scalar support on the head axis. The shared-neck part excludes its exterior domain above the regular connection. */
    top?: IAutoMovieHumanTrunkViewPart.ITop;

    /** The tapes that wrap the merged skin, mm: the chest over the breasts, the hip over the gluteal masses. */
    tapes: {
      /** Closed merged-skin chest tape over the breasts, calibration millimetres. */
      chest: number;
      /** Closed merged-skin hip tape over the gluteal masses, calibration millimetres. */
      hip: number;
    };

    /** The breasts' law, or null where the amplitude leaves none. */
    breast: IMassLaw | null;

    /** The gluteal masses' law, or null. */
    gluteal: IMassLaw | null;
  }

  /** A mass's law on the left side, in calibration mm.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A mass's law on the left side, in calibration mm.
   * @evidence contracts/development/design.md#principled-representation `target`: Declared AP skin apex on the left, calibration mm; its height and transverse place must not move during wall placement. `up`: The up direction of its footprint. `footprint`: Footprint edges at the base, along up, lateral, down and medial, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanMassInterim.breast, AutoMovieHumanMassInterim.gluteal, AutoMovieHumanTrunkBuild.mirror. Read by AutoMovieHumanTrunkBuild.mirror. Also types AutoMovieHumanMassInterim.DOME, AutoMovieHumanTrunkBuild.pairs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `target`, `up`, `footprint`, `profile`, `shoulder`, `fold`; callers supply the complete record.
   */
  export interface IMassLaw {
    /** Declared AP skin apex on the left, calibration mm; its height and transverse place must not move during wall placement. */
    target: AutoMovieVector3Tuple;

    /** The up direction of its footprint. */
    up: AutoMovieVector3Tuple;

    /** Footprint edges at the base, along up, lateral, down and medial, mm. */
    footprint: [number, number, number, number];

    /** Profile: shares of the amplitude with the shares of the edges left there, as `AutoMovieHumanMassPart`. */
    profile: IAutoMovieHumanMassPart.IInput["profile"];

    /** Sourced conic shoulder of its sections. */
    shoulder: number;

    /** Declared geometric join radius, mm; the current interim caller derives operational softness from sampling pitch, not fat thickness. */
    fold: number;
  }

  /** What the build publishes.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the build publishes.
   * @evidence contracts/development/design.md#principled-representation `sections`: Common original measurement planes consumed by both preparation passes. `trunk`: The base's view node, or null when it cannot be lofted. `masses`: Each mass's fold onto the base, for the body's tree.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodyLaw.trunkSource, AutoMovieHumanBodyPreparation.trunkSource, AutoMovieHumanTrunkBuild.create. Read by AutoMovieHumanTrunkBuild.create. Also types AutoMovieHumanBodyLane.trunk, AutoMovieHumanBodyPreparation.result.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `sections`, `trunk`, `masses`, `diagnostics`, `sources`; callers supply the complete record.
   */
  export interface IOutput {
    /** Common original measurement planes consumed by both preparation passes. */
    sections: ReadonlyMap<string, IAutoMovieHumanTrunkSectionFamily.IPlane>;
    /** The base's view node, or null when it cannot be lofted. */
    trunk: IAutoMovieConstructionView | null;

    /** Each mass's fold onto the base, for the body's tree. */
    masses: IAutoMovieHumanBodyTree.IFold[];

    /** Every broken premise. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];

    /** Actual builder results in production order, including both tape passes and failed admissions. */
    sources: IAutoMovieHumanSiteViewPart.ISource[];
  }

  /** The head argument of AutoMovieHumanTrunkBuild.withHead. Preserve the existing upper scalar support from the canonical head axis; the regular shared connection excludes that support's dome from the loft domain.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Preserve the existing upper scalar support from the canonical head axis; the regular shared connection excludes that support's dome from the loft domain.
   * @evidence contracts/development/design.md#principled-representation Preserve the existing upper scalar support from the canonical head axis; the regular shared connection excludes that support's dome from the loft domain. Alternatives are a record with part, crown; undefined.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkBuild.IWithHeadHead is the canonical exchange used by AutoMovieHumanTrunkBuild.withHead.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkBuild.withHead for preserve the existing upper scalar support from the canonical head axis; the regular shared connection excludes that support's dome from the loft domain.
   */
  export type IWithHeadHead =
    | {
        /** Geometric part with its original axis and section laws; its declared source frame and units apply. */
        part: Pick<IAutoMovieViewPart, "axis" | "stations">;
        /** Head crown in the registered source frame, calibration millimetres. */
        crown: AutoMovieVector3Tuple;
      }
    | undefined;
}
