import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A deterministic atlas of complete bicubic Bernstein patches.
 *
 * Shared coefficient indices, rather than coordinate equality, declare shared
 * corners and complete cubic edges. Reversing an edge reverses its four indices.
 * Optional canonical bindings explicitly construct a side from one saved cubic
 * interval before derivative bounds and tessellation; they define the recipe's
 * field rather than repairing a generated mesh. Producers report any difference
 * from an earlier fitted coefficient field. Hanging endpoints share position
 * identity through these intervals, while analytic normal fans may stay separate.
 * This recipe supplies a field, not its original observations or source mesh.
 * Parameter continuity, injectivity and source fidelity remain independent
 * qualifications. Resource exhaustion retains an explicit partial realization.
 *
 * @evidence contracts/common.md#principled-implementation Sixteen shared Bernstein coefficient indices define each tensor patch; a named identity domain keeps independent coincident sheets distinct.
 * @evidence contracts/common.md#clear-and-simple-design One coefficient registry owns all patch boundaries and interiors, and explicit tessellation budgets belong to the recipe.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No original source vertices, triangle topology, normals or external mesh reference are accepted as generation data.
 * @evidence contracts/common.md#meaningful-documentation States metres, row order, shared-boundary identity, approximation scope and partial resource semantics.
 */
export interface IAutoMovieBicubicAtlasGeometry {
  /** Geometry recipe discriminator. */
  type: "bicubic-atlas";

  /** Nonempty physical identity domain; coefficient indices are local to this atlas. */
  topologyDomain: string;

  /** Finite Bernstein positions in model metres; these are coefficients, not interpolation samples. */
  controls: IAutoMovieVector3[];

  /** Unique patch IDs and sixteen coefficient indices, u varying fastest within each v row. */
  patches: { id: string; controlIds: number[] }[];

  /** Source-free cubic position owners; each interval uses this complete canonical net. */
  boundaryAuthorities?: {
    id: string;
    controlIds: [number, number, number, number];
  }[];

  /** Explicit edge construction from an oriented canonical interval; normal fans remain independent. */
  boundaryBindings?: {
    patch: string;
    side: 0 | 1 | 2 | 3;
    authority: string;
    start: number;
    end: number;
    normalFan: string;
  }[];

  /** Positive analytic-field-to-PL approximation request in metres; not source-surface error. */
  tolerance: number;

  /** Positive total retained adaptive-cell work budget for this atlas. */
  maxCells: number;

  /** At cell exhaustion, retain each finite current leaf with an unqualified approximation estimate, or omit it. Omitted means the existing strict policy. */
  cellBudgetPolicy?: "retain-coarse" | "omit-unresolved";

  /** Positive emitted-vertex budget; exhaustion preserves only complete earlier chunks. */
  maxVertices: number;

  /** Optional observation-fit status; it never controls finite geometry display or realization completeness. */
  sourceFit?: {
    /** True means only the producer's declared sample and numerical checks passed. */
    qualified: boolean;
    /** Largest declared observation residual in metres; null when no residual was measured. */
    maximumResidual: number | null;
    /** Patch IDs whose source fit remains unqualified, independently of structural patch validity. */
    unqualifiedPatches: string[];
    /** Source-free numerical, registration and observation-coverage limitations. */
    diagnostics: string[];
  };
}
