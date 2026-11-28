import type { AutoMovieVector3Tuple, IAutoMovieRecoveryTerminalSeed } from "..";

/**
 * Observed positive-axis terminal neighborhood traced from one saved closed
 * source loop.
 */
export interface IAutoMovieRecoverySourceTerminal {
  /** Original closed-loop address and that publication's curve name. */
  seed: IAutoMovieRecoveryTerminalSeed & {
    /** Saved curve name of the seed's published closed loop. */
    curveName: string;
  };

  /** Whether the traced source component supports one isolated qualifying tip. */
  singleTipQualified: boolean;

  /**
   * Largest traced scalar coordinate and the original source vertices attaining
   * it, or null.
   */
  maximum: {
    /**
     * Largest observed scalar height in the traced distal component, in
     * millimetres.
     */
    coordinateMm: number;

    /** All registered source points at this maximum height, in millimetres. */
    pointsMm: Readonly<AutoMovieVector3Tuple>[];
  } | null;

  /**
   * Original critical events reached on the traced component, with available
   * physical brackets.
   */
  events: Array<{
    /** Terminal-observation-local critical record name. */
    name: string;

    /** Exact signed observation height of the critical vertex in millimetres. */
    coordinateMm: number;

    /** Original registered Cartesian point of the source event. */
    pointMm: Readonly<AutoMovieVector3Tuple>;

    /** Observed count of lower components in the critical vertex link. */
    lowerComponents: number;

    /** Observed count of upper components in the critical vertex link. */
    upperComponents: number;

    /** Whether the source critical link qualifies as a manifold cycle. */
    manifold: boolean;

    /** Whether an incident source neighbor shares the same scalar level. */
    flat: boolean;

    /**
     * Whether the event's source link and critical bracket pass the regularity
     * checks.
     */
    regular: boolean;

    /** Measured lower physical bracket coordinate, or null when unavailable. */
    beforeMm: number | null;

    /** Measured upper physical bracket coordinate, or null when unavailable. */
    afterMm: number | null;
  }>;

  /** Additional observed critical coordinates and physical bracket planes. */
  coordinatesMm: number[];

  /**
   * Source terminal limitations from tracing, event qualification or bracket
   * admission.
   */
  diagnostics: string[];
}
