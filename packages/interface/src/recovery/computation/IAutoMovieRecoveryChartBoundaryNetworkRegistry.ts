import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieRecoveryBoundaryCut } from "./IAutoMovieRecoveryBoundaryCut";
import type { IAutoMovieRecoveryChartBoundaryNetwork } from "./IAutoMovieRecoveryChartBoundaryNetwork";

/**
 * Register immutable boundary ancestry and copied chart observations before
 * augmentation.
 */

export namespace IAutoMovieRecoveryChartBoundaryNetworkRegistry {
  /**
   * Register immutable boundary ancestry and copied chart observations before
   * augmentation.
   */

  export type Operation = (
    input: Parameters<IAutoMovieRecoveryChartBoundaryNetwork.Operation>[0],
  ) => {
    /**
     * Canonical original edge registry with ordered endpoint identities and
     * fraction-indexed physical cut records.
     */
    cuts: Map<
      string,
      {
        /** Canonical ordered endpoint identities of the original boundary edge. */
        endpoints: [string, string];
        /** Fraction-indexed boundary-cut records for one original edge. */
        values: Map<number, IAutoMovieRecoveryBoundaryCut>;
      }
    >;

    /**
     * Registry from inserted identity to its original edge base and
     * dimensionless interpolation fraction.
     */
    insertionKeys: Map<
      string,
      {
        /**
         * Canonical original edge identity shared by its inserted fractional
         * points.
         */
        base: string;
        /**
         * Dimensionless position along the original canonical edge, in
         * increasing endpoint order.
         */
        fraction: number;
      }
    >;

    /**
     * Caller-supplied physical point aliases grouped by boundary identity
     * before consistency admission.
     */
    declaredPoints: Map<string, Readonly<AutoMovieVector3Tuple>[]>;

    /**
     * Canonical boundary identity to its admitted registered millimetre
     * position.
     */
    points: Map<string, Readonly<AutoMovieVector3Tuple>>;

    /**
     * Prepared or fitted source charts in deterministic observation order,
     * including each independently retained feature piece.
     */
    charts: ReturnType<IAutoMovieRecoveryChartBoundaryNetwork.Operation>["charts"];

    /**
     * Explicit original-to-canonical incidence aliases; no proximity matching
     * is inferred.
     */
    aliases: Map<string, string>;

    /**
     * Per-edge cut records ordered by increasing fraction from its canonical
     * first endpoint.
     */
    orderedCuts: Map<string, IAutoMovieRecoveryBoundaryCut[]>;

    /**
     * Declared shared break identities retained across every incident chart
     * boundary.
     */
    canonicalBreaks: Set<string>;

    /**
     * Observed admission failures and qualification limits in production order;
     * an empty array adds no extra certificate.
     */
    diagnostics: string[];

    /**
     * Largest boundary-network point displacement in the registered millimetre
     * frame.
     */
    maximumPointChange: number;

    /**
     * Canonical deterministic key for an undirected pair of incidence
     * identities.
     */
    pair: (a: string, b: string) => string;

    /**
     * Canonical deterministic key for an undirected pair of numeric vertex
     * indices.
     */
    indexed: (a: number, b: number) => string;

    /**
     * Deterministic identity ordering used to orient shared edges; it does not
     * compare physical coordinates.
     */
    compare: (a: string, b: string) => number;

    /** Checks finite Cartesian coordinates without repairing or clamping values. */
    finite: (p: readonly number[]) => boolean;

    /**
     * Interpolates the two supplied millimetre points at a dimensionless edge
     * fraction without changing their identities.
     */
    blend: (
      a: Readonly<AutoMovieVector3Tuple>,
      b: Readonly<AutoMovieVector3Tuple>,
      t: number,
    ) => Readonly<AutoMovieVector3Tuple>;

    /**
     * Returns the unnormalized right-handed cross product (b-a) × (c-a) of
     * registered millimetre positions. The vector is in mm² and its magnitude
     * is twice the triangle area; consumers require that magnitude and must not
     * receive a unit normal.
     */
    normal: (
      a: Readonly<AutoMovieVector3Tuple>,
      b: Readonly<AutoMovieVector3Tuple>,
      c: Readonly<AutoMovieVector3Tuple>,
    ) => Readonly<AutoMovieVector3Tuple>;
  };
}
