import type { IAutoMovieFluidDomain } from "./IAutoMovieFluidDomain";

/** Typed fluid-domain admission request for the engine validator. */
export namespace IAutoMovieValidateFluidDomain {
  /**
   * Domain whose lattice, budgets, reference-depth Courant condition and
   * declared flows are to be inspected.
   *
   * For a structurally typed domain, checks schema/id, safe positive grid
   * counts, finite authored scalars, count budgets, per-cell array
   * lengths/values, boundary vocabulary, nonsolid source/drain/spray sites,
   * activity windows and sibling identities. Initial depths must lie in [0,
   * referenceDepth], and solid cells must start dry. Violations retain field
   * paths and authored values; inputs are not modified.
   *
   * The Courant comparison runs only when its five authored inputs are finite
   * and positive. A computed value above one, including Infinity, is refused;
   * derived NaN is missed by that comparison. Admission also does not bound
   * finite area, damping, clock, flow accumulation or spray-index products, and
   * later water depth may exceed referenceDepth. It does not certify every
   * derived solver/surface/spray result or perform general unknown-object shape
   * admission.
   */
  export type IProps = {
    /**
     * Structurally present domain to inspect without mutation; malformed
     * containers can throw, while semantic defects become path-addressed
     * violations.
     */
    domain: IAutoMovieFluidDomain;
  };
}
