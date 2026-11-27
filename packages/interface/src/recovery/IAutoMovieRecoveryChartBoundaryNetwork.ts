import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryChartBoundary,
} from "..";

/**
 * Reconcile private quarter cuts before fitting shared maximal boundary arcs.
 * Physical keys, base-edge ancestry and exact numeric fractions declare
 * sharing; equal positions alone never identify a bank. Inputs remain
 * immutable. Missing base-edge banks are diagnosed without fabricated
 * connections. Ambiguous keys, collapsed observations, invalid incidence or
 * nonrepresentable phases throw. Canonical insertions can change existing
 * binary64 points slightly; diagnostics retain maximum point displacement and
 * actual per-chart source-area changes. This is observation subdivision, not
 * engine geometry or a PL equality proof. Original quarter corners, graph
 * branches and changes of incident chart sets split the physical boundary graph
 * into open arcs. Closed and junction-return chains receive stable-key anchors
 * at existing observations, preserving every edge and introducing no point or
 * shortcut. Each canonical arc invokes owner.get once; reversed banks reuse its
 * coefficients and registration. A side composite concatenates these arcs under
 * physical-polyline-length proportions. Its synthetic identity serves mapping
 * only; assembly must use pieces authority. Source words, triangles and
 * original normals remain private to this operation.
 */

export namespace IAutoMovieRecoveryChartBoundaryNetwork {
  /**
   * Reconcile private quarter cuts before fitting shared maximal boundary arcs.
   * Physical keys, base-edge ancestry and exact numeric fractions declare
   * sharing; equal positions alone never identify a bank. Inputs remain
   * immutable. Missing base-edge banks are diagnosed without fabricated
   * connections. Ambiguous keys, collapsed observations, invalid incidence or
   * nonrepresentable phases throw. Canonical insertions can change existing
   * binary64 points slightly; diagnostics retain maximum point displacement and
   * actual per-chart source-area changes. This is observation subdivision, not
   * engine geometry or a PL equality proof. Original quarter corners, graph
   * branches and changes of incident chart sets split the physical boundary
   * graph into open arcs. Closed and junction-return chains receive stable-key
   * anchors at existing observations, preserving every edge and introducing no
   * point or shortcut. Each canonical arc invokes owner.get once; reversed
   * banks reuse its coefficients and registration. A side composite
   * concatenates these arcs under physical-polyline-length proportions. Its
   * synthetic identity serves mapping only; assembly must use pieces authority.
   * Source words, triangles and original normals remain private to this
   * operation.
   */

  export type Operation = (input: {
    /** Private chart occurrences with original quarter insertion provenance. */
    charts: readonly {
      /**
       * Caller-assigned stable semantic identity retained in generated
       * coefficient and observation records.
       */
      name: string;

      /**
       * Borrowed physical positions in the registered millimetre frame; indices
       * in triangles address this array.
       */
      verticesMm: readonly Readonly<AutoMovieVector3Tuple>[];

      /**
       * Oriented triangle vertex-index triples addressing the paired position
       * array; indices are not control IDs.
       */
      triangles: readonly (readonly [number, number, number])[];

      /**
       * Per-vertex physical incidence identities shared only under declared
       * source equality.
       */
      physicalKeys: readonly string[];

      /**
       * Four ordered chart-boundary vertex paths in the chart owner's fixed
       * side convention; indices address verticesMm.
       */
      sides: readonly [number[], number[], number[], number[]];

      /**
       * Admitted new boundary vertices with original edge identities and
       * explicit interpolation fractions.
       */
      insertions: readonly {
        /**
         * Ordered physical endpoint identities used to orient the interpolation
         * fraction.
         */
        edgeKeys: [string, string];

        /**
         * Dimensionless interior fraction along the declared ordered edgeKeys
         * pair.
         */
        fractionFromFirst: number;

        /**
         * Stable incidence identity used for deterministic registry lookup;
         * matching text does not imply coordinate equality.
         */
        key: string;

        /**
         * Physical position in the registered millimetre frame; no coordinate
         * matching or source repair is implied.
         */
        pointMm: Readonly<AutoMovieVector3Tuple>;
      }[];
    }[];

    /** Shared curve owner under one fixed fitting policy. */
    owner: ReturnType<IAutoMovieRecoveryChartBoundary.Operation>;
  }) => {
    /** Augmented private meshes and composite sides with real shared arc pieces. */
    charts: {
      /**
       * Caller-assigned stable semantic identity retained in generated
       * coefficient and observation records.
       */
      name: string;

      /**
       * Borrowed physical positions in the registered millimetre frame; indices
       * in triangles address this array.
       */
      verticesMm: Readonly<AutoMovieVector3Tuple>[];

      /**
       * Oriented triangle vertex-index triples addressing the paired position
       * array; indices are not control IDs.
       */
      triangles: [number, number, number][];

      /**
       * Per-vertex physical incidence identities shared only under declared
       * source equality.
       */
      physicalKeys: string[];

      /**
       * Four ordered chart-boundary vertex paths in the chart owner's fixed
       * side convention; indices address verticesMm.
       */
      sides: [number[], number[], number[], number[]];

      /**
       * Oriented fitted boundary results used by this chart; each refers back
       * to a shared canonical coefficient authority.
       */
      boundaries: (ReturnType<
        ReturnType<IAutoMovieRecoveryChartBoundary.Operation>["get"]
      > & {
        /**
         * Increasing subintervals of this chart boundary, each bound to one
         * canonical cubic authority and its normalized knots.
         */
        pieces: {
          /**
           * Increasing normalized interval start on the declared shared edge or
           * boundary curve.
           */
          start: number;

          /**
           * Increasing normalized interval end on the declared shared edge or
           * boundary curve.
           */
          end: number;

          /**
           * Increasing normalized span-boundary parameters in this chart's
           * boundary orientation.
           */
          knots: number[];

          /**
           * One oriented fitted boundary and its normalized pointwise
           * correspondence to the canonical curve.
           */
          boundary: ReturnType<
            ReturnType<IAutoMovieRecoveryChartBoundary.Operation>["get"]
          >;
        }[];
      })[];
    }[];

    /** Measured binary64 changes and unrepresented base-edge bank reasons. */
    diagnostics: string[];

    /**
     * Largest measured point displacement against supplied or prior
     * private-bank PL correspondences, millimetres; not a continuous
     * original-source bound.
     */
    maximumPointChangeMm: number;
  };
}
