import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryIndexedCrease,
} from "../../index";

/**
 * Materialize declared feature cuts as private manifold observation charts.
 * Ordinals and unique occurrence keys own topology; repeated physical keys must
 * name exactly equal millimetre coordinates. Source-face pairs admit features,
 * independently of a supplied angle's classification, which belongs to the
 * caller. Incident-face fans are split across every feature. A cut whose banks
 * otherwise share both endpoint ordinals first receives one conforming midpoint
 * observation. Ideal midpoint subdivision preserves PL geometry in real
 * arithmetic; diagnostics separately report upward coordinate-rounding bounds
 * and measured area changes. observationDisplacementUpperMm is the largest
 * midpoint displacement bound only; later quarter/chord subdivision and fitting
 * errors require separate accounting. Positive areas, coherent winding, links
 * and actual cut-bank incidence are checked. Outputs can be disks, annuli,
 * slits or closed surfaces; no UV map is certified. Both banks follow
 * physicalPath; their coherent boundary directions are opposite. Chains stop at
 * physical boundaries as well as feature junctions; isolated interior
 * degree-two cycles repeat their first path vertex. Source topology, physical
 * words, midpoint witnesses and all outputs stay private to observation. Public
 * fitted curves, compactness, boundary authority and normals belong elsewhere.
 */

export namespace IAutoMovieRecoveryFeatureChartCuts {
  /**
   * Materialize declared feature cuts as private manifold observation charts.
   * Ordinals and unique occurrence keys own topology; repeated physical keys
   * must name exactly equal millimetre coordinates. Source-face pairs admit
   * features, independently of a supplied angle's classification, which belongs
   * to the caller. Incident-face fans are split across every feature. A cut
   * whose banks otherwise share both endpoint ordinals first receives one
   * conforming midpoint observation. Ideal midpoint subdivision preserves PL
   * geometry in real arithmetic; diagnostics separately report upward
   * coordinate-rounding bounds and measured area changes.
   * observationDisplacementUpperMm is the largest midpoint displacement bound
   * only; later quarter/chord subdivision and fitting errors require separate
   * accounting. Positive areas, coherent winding, links and actual cut-bank
   * incidence are checked. Outputs can be disks, annuli, slits or closed
   * surfaces; no UV map is certified. Both banks follow physicalPath; their
   * coherent boundary directions are opposite. Chains stop at physical
   * boundaries as well as feature junctions; isolated interior degree-two
   * cycles repeat their first path vertex. Source topology, physical words,
   * midpoint witnesses and all outputs stay private to observation. Public
   * fitted curves, compactness, boundary authority and normals belong
   * elsewhere.
   */

  export type Operation = (input: {
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
     * Per-vertex sheet-occurrence identities; coincident occurrences may retain
     * distinct entries.
     */
    occurrenceKeys: readonly string[];

    /**
     * One original source-face ordinal per current chart triangle, preserving
     * subdivision provenance.
     */
    triangleSourceFaces: readonly number[];

    /**
     * Original source crease edges admitted by the declared angular policy,
     * retaining both incident face owners.
     */
    featureEdges: readonly IAutoMovieRecoveryIndexedCrease[];
  }) => {
    /**
     * Prepared or fitted source charts in deterministic observation order,
     * including each independently retained feature piece.
     */
    charts: {
      /**
       * Stable identity within the owning chart, boundary or occurrence
       * registry; equal coordinates do not create identity.
       */
      id: string;

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
       * Per-vertex sheet-occurrence identities; coincident occurrences may
       * retain distinct entries.
       */
      occurrenceKeys: string[];

      /**
       * One original source-face ordinal per current chart triangle, preserving
       * subdivision provenance.
       */
      triangleSourceFaces: number[];

      /**
       * Admitted boundary cycles in deterministic traversal order; each entry
       * retains its own incidence rather than coordinate welding.
       */
      cycles: number[][];
    }[];

    /**
     * Declared crease paths and their two chart banks; these retain physical
     * incidence across the split.
     */
    seams: {
      /**
       * Stable identity within the owning chart, boundary or occurrence
       * registry; equal coordinates do not create identity.
       */
      id: string;

      /**
       * Closed representation discriminator selecting the corresponding
       * observation or result arm.
       */
      kind: "crease";

      /**
       * Whether the observed path's actual incidence returns to its first
       * endpoint; no artificial closing segment is inferred.
       */
      closed: boolean;

      /**
       * Ordered physical incidence identities along the crease, independent of
       * chart-local vertex numbering.
       */
      physicalPath: string[];

      /**
       * The two incident chart sides of the same physical crease, each with its
       * local vertex path.
       */
      banks: [
        {
          /** Zero-based ordinal of the emitted chart containing this bank. */
          chart: number;
          /**
           * Ordered chart-local vertex indices along this side of a declared
           * crease.
           */
          path: number[];
        },
        {
          /** Zero-based ordinal of the emitted chart containing this bank. */
          chart: number;
          /**
           * Ordered chart-local vertex indices along this side of a declared
           * crease.
           */
          path: number[];
        },
      ];
    }[];

    /**
     * Admitted new boundary vertices with original edge identities and explicit
     * interpolation fractions.
     */
    insertions: {
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

    /**
     * Reported upper displacement introduced by admitted source-chart
     * subdivision, in millimetres.
     */
    observationDisplacementUpperMm: number;

    /**
     * Observed admission failures and qualification limits in production order;
     * an empty array adds no extra certificate.
     */
    diagnostics: string[];
  };
}
