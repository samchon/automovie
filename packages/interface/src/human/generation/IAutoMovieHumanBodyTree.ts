import type { IAutoMovieConstructionNode } from "../../construction/IAutoMovieConstructionNode";
import type { IAutoMovieLoftChain } from "../../construction/IAutoMovieLoftChain";
import type { IAutoMovieSolidBody } from "../../construction/IAutoMovieSolidBody";
import type { IAutoMovieViewPart } from "../../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanMassSource } from "./limb/IAutoMovieHumanMassSource";

/**
 * Fold declarations, trace limits and published construction subtrees, with named original-source records.
 *
 * The interface package owns these declarations; AutoMovieHumanBodyTree in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Fold declarations, trace limits and published construction subtrees, with named original-source records. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IFold, ILimits, IOutput, ContextRecords declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IFold, ILimits, IOutput, ContextRecords separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanBodyTree exchanges the named IFold, ILimits, IOutput, ContextRecords contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanBodyTree {
  /** One fold's join onto the subtree built so far, calibration mm.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One fold's join onto the subtree built so far, calibration mm.
   * @evidence contracts/development/design.md#principled-representation `part`: The joined subtree. `partFace`: The part's face that meets the host. `hostFace`: The host face the seed meets.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodyTree.massFold. Read by AutoMovieHumanBodyTree.join, AutoMovieHumanBodyTree.massFold. Also types AutoMovieHumanBodyLane.fold, AutoMovieHumanTrunkBuild.out.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `sourceSeed`: Actual original-parent exit used to select a mass's host face, before kept-atlas validation.
   */
  export interface IFold {
    /** The joined subtree. */
    part: IAutoMovieConstructionNode;

    /** The part's face that meets the host. */
    partFace: string;

    /** The host face the seed meets. */
    hostFace: string;
    /** Actual original-parent exit used to select a mass's host face, before kept-atlas validation. */
    sourceSeed?: IAutoMovieHumanMassSource.ISeed;

    /** The seed's search: the part face's phase and the shares of its station range to search between. */
    search: {
      /** Section phase in radians, increasing according to the source curve's orientation. */
      phase: number;
      /** Start of the seed-search interval as a dimensionless share of the part's station span. */
      from: number;
      /** End of the seed-search interval as a dimensionless share of the part's station span. */
      to: number;
    };

    /** The fold's rolling radius, mm. */
    radius: number;

    /** The widest chord either side, mm. */
    cap: number;
  }

  /** The joins' trace limits and sampling, millimetres and radians.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The joins' trace limits and sampling, millimetres and radians.
   * @evidence contracts/development/design.md#principled-representation `count`: Points of each trace per turn and columns of each blend, a multiple of 4 of at least 8. `tolerance`: Largest distance between the two surfaces at a traced point, mm. `grazing`: Least angle between the two tangent planes, radians.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanBodyTree.join, AutoMovieHumanBodyTree.realize. Also types AutoMovieHumanBodyLane.LIMITS, AutoMovieHumanBodyLane.limits.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `count`, `tolerance`, `grazing`, `gap`; callers supply the complete record.
   */
  export interface ILimits {
    /** Points of each trace per turn and columns of each blend, a multiple of 4 of at least 8. */
    count: number;

    /** Largest distance between the two surfaces at a traced point, mm. */
    tolerance: number;

    /** Least angle between the two tangent planes, radians. */
    grazing: number;

    /** Widest spacing between a blend's rows and the skin's chord, mm. */
    gap: number;
  }

  /** The realized subtree as the calibration publishes it.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The realized subtree as the calibration publishes it.
   * @evidence contracts/development/design.md#principled-representation `chains`: Every part's chain, then every blend's. `body`: The realized body of trimmed faces sharing their boundaries, as the calibration publishes it (`IAutoMovieHumanBodyCalibration.bodies`).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodyTree.realize. Also types AutoMovieHumanBodyLane.realized.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `chains`, `body`; callers supply the complete record.
   */
  export interface IOutput {
    /** Every part's chain, then every blend's. */
    chains: IAutoMovieLoftChain[];

    /** The realized body of trimmed faces sharing their boundaries, as the calibration publishes it (`IAutoMovieHumanBodyCalibration.bodies`). */
    body: IAutoMovieSolidBody.IPublished;
  }

  /** The records argument of AutoMovieHumanBodyTree.context. Retain only each builder's last actual original, including failed replacements.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Retain only each builder's last actual original, including failed replacements.
   * @evidence contracts/development/design.md#principled-representation Retain only each builder's last actual original, including failed replacements. The outer tuple/array is readonly; nested element types determine whether their contents can change.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanBodyTree.ContextRecords is the canonical exchange used by AutoMovieHumanBodyTree.context.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanBodyTree.context for retain only each builder's last actual original, including failed replacements.
   */
  export type ContextRecords = readonly {
    /** Stable source or geometric-part identity used to join the record to its consumer. */
    name: string;
    /** Retained source result; a null part records an unbuilt or refused original. */
    result: {
      /** Geometric part with its original axis and section laws; its declared source frame and units apply. Null records an unbuilt or refused part. */
      part: IAutoMovieViewPart | null;
    };
  }[];
}
