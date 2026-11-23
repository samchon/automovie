import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A deterministic atlas of complete bicubic Bernstein patches.
 *
 * Shared coefficient indices, rather than coordinate equality, declare shared
 * corners and complete cubic edges. Reversing an edge reverses its four
 * indices. Optional canonical bindings explicitly construct a side from one
 * saved cubic interval before derivative bounds and tessellation; they define
 * the recipe's field rather than repairing a generated mesh. Producers report
 * any difference from an earlier fitted coefficient field. Hanging endpoints
 * share position identity through these intervals, while analytic normal fans
 * may stay separate. This recipe supplies a field, not its original
 * observations or source mesh. Parameter continuity, injectivity and source
 * fidelity remain independent qualifications. Resource exhaustion retains an
 * explicit partial realization.
 */
export interface IAutoMovieBicubicAtlasGeometry {
  /** Geometry recipe discriminator. */
  type: "bicubic-atlas";

  /**
   * Nonempty physical identity domain; coefficient indices are local to this
   * atlas.
   */
  topologyDomain: string;

  /**
   * Finite Bernstein positions in model metres; these are coefficients, not
   * interpolation samples.
   */
  controls: IAutoMovieVector3[];

  /**
   * Unique patch IDs and sixteen coefficient indices, u varying fastest within
   * each v row.
   */
  patches: {
    /** Unique nonempty patch identity within this atlas. */
    id: string;

    /** Sixteen indices into controls, with u varying fastest in each v row. */
    controlIds: number[];
  }[];

  /**
   * Source-free cubic position owners; each interval uses this complete
   * canonical net.
   */
  boundaryAuthorities?: {
    /** Unique nonempty identity of the complete canonical cubic. */
    id: string;

    /** Four ordered indices into controls defining that cubic's Bernstein net. */
    controlIds: [number, number, number, number];
  }[];

  /**
   * Explicit edge construction from an oriented canonical interval; normal fans
   * remain independent.
   */
  boundaryBindings?: {
    /** Existing patch identity whose side is constructed. */
    patch: string;

    /** Parameter-square side: 0 is v=0, 1 is u=1, 2 is v=1, 3 is u=0. */
    side: 0 | 1 | 2 | 3;

    /** Existing complete cubic identity in boundaryAuthorities. */
    authority: string;

    /** Start parameter on the canonical cubic in [0, 1]. */
    start: number;

    /** Distinct end parameter in [0, 1]; end below start reverses orientation. */
    end: number;

    /**
     * Nonempty identity selecting an independently retained analytic normal
     * fan.
     */
    normalFan: string;
  }[];

  /**
   * Positive analytic-field-to-PL approximation request in metres; not
   * source-surface error.
   */
  tolerance: number;

  /** Positive total retained adaptive-cell work budget for this atlas. */
  maxCells: number;

  /**
   * At cell exhaustion, retain each finite current leaf with an unqualified
   * approximation estimate, or omit it. Omitted means the existing strict
   * policy.
   */
  cellBudgetPolicy?: "retain-coarse" | "omit-unresolved";

  /**
   * Positive emitted-vertex budget; exhaustion preserves only complete earlier
   * chunks.
   */
  maxVertices: number;

  /**
   * Optional observation-fit status; it never controls finite geometry display
   * or realization completeness.
   */
  sourceFit?: {
    /**
     * True means only the producer's declared sample and numerical checks
     * passed.
     */
    qualified: boolean;
    /**
     * Largest declared observation residual in metres; null when no residual
     * was measured.
     */
    maximumResidual: number | null;
    /**
     * Patch IDs whose source fit remains unqualified, independently of
     * structural patch validity.
     */
    unqualifiedPatches: string[];
    /** Source-free numerical, registration and observation-coverage limitations. */
    diagnostics: string[];
  };
}
