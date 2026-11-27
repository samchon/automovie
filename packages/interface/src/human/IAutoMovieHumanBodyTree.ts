import type { IAutoMovieConstructionNode } from "../construction/IAutoMovieConstructionNode";
import type { IAutoMovieLoftChain } from "../construction/IAutoMovieLoftChain";
import type { IAutoMovieSolidBody } from "../construction/IAutoMovieSolidBody";
import type { IAutoMovieViewPart } from "../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanMassSource } from "./IAutoMovieHumanMassSource";

/**
 * Fold declarations, trace limits and published construction subtrees, with
 * named original-source records.
 *
 * The interface package owns these declarations; AutoMovieHumanBodyTree in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanBodyTree {
  /** One fold's join onto the subtree built so far, calibration mm. */
  export interface IFold {
    /** The joined subtree. */
    part: IAutoMovieConstructionNode;

    /** The part's face that meets the host. */
    partFace: string;

    /** The host face the seed meets. */
    hostFace: string;
    /**
     * Actual original-parent exit used to select a mass's host face, before
     * kept-atlas validation.
     */
    sourceSeed?: IAutoMovieHumanMassSource.ISeed;

    /**
     * The seed's search: the part face's phase and the shares of its station
     * range to search between.
     */
    search: IFoldSearch;

    /** The fold's rolling radius, mm. */
    radius: number;

    /** The widest chord either side, mm. */
    cap: number;
  }

  /** The search object of {@link IFold}. */
  export type IFoldSearch = {
    /**
     * Section phase in radians, increasing according to the source curve's
     * orientation.
     */
    phase: number;
    /**
     * Start of the seed-search interval as a dimensionless share of the
     * part's station span.
     */
    from: number;
    /**
     * End of the seed-search interval as a dimensionless share of the part's
     * station span.
     */
    to: number;
  };

  /** The joins' trace limits and sampling, millimetres and radians. */
  export interface ILimits {
    /**
     * Points of each trace per turn and columns of each blend, a multiple of 4
     * of at least 8.
     */
    count: number;

    /** Largest distance between the two surfaces at a traced point, mm. */
    tolerance: number;

    /** Least angle between the two tangent planes, radians. */
    grazing: number;

    /** Widest spacing between a blend's rows and the skin's chord, mm. */
    gap: number;
  }

  /** The realized subtree as the calibration publishes it. */
  export interface IOutput {
    /** Every part's chain, then every blend's. */
    chains: IAutoMovieLoftChain[];

    /**
     * The realized body of trimmed faces sharing their boundaries, as the
     * calibration publishes it (`IAutoMovieHumanBodyCalibration.bodies`).
     */
    body: IAutoMovieSolidBody.IPublished;
  }

  /**
   * The records argument of AutoMovieHumanBodyTree.context. Retain only each
   * builder's last actual original, including failed replacements.
   */
  export type ContextRecords = readonly {
    /**
     * Stable source or geometric-part identity used to join the record to its
     * consumer.
     */
    name: string;
    /**
     * Retained source result; a null part records an unbuilt or refused
     * original.
     */
    result: {
      /**
       * Geometric part with its original axis and section laws; its declared
       * source frame and units apply. Null records an unbuilt or refused part.
       */
      part: IAutoMovieViewPart | null;
    };
  }[];
}
