import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";
import type { IAutoMovieCanonicalBoundaryPhase64 } from "./IAutoMovieCanonicalBoundaryPhase64";
import type { IAutoMoviePrepareBicubicAtlasBoundary64Binding } from "./IAutoMoviePrepareBicubicAtlasBoundary64Binding";

/**
 * Canonical boundary coefficient identities and shared position evaluation
 * state.
 */
export namespace IAutoMoviePrepareBicubicAtlasBoundary64 {
  /**
   * Canonical curves, coefficient equivalences and complete edge uses. A side
   * without an explicit binding can inherit one oriented interval from a
   * complete-edge peer with the same four control IDs. Its legacy normal fan
   * stays separate from explicitly authored fans.
   *
   * Identity comes from declared IDs and phase keys. Position comparisons
   * qualify those relations. Consistent restricted nets on different named
   * intervals retain their own fields with a conformity diagnostic. Planning
   * omits patches incident on reported coefficient conflicts.
   *
   * Supply finite coefficient tuples. Authority control indices must be safe
   * original ordinals. Keep borrowed controls, bindings and all returned caches
   * stable while the atlas runs.
   */
  export type IResult = {
    /**
     * Authority ID to its four borrowed cubic control IDs in input.controlsMm;
     * the map is new, but control-ID arrays are not cloned.
     */
    authorities: Map<string, readonly number[]>;

    /**
     * PatchID:side keys to explicit borrowed bindings or newly transported
     * legacy bindings. Unbound sides without a declared complete-edge peer have
     * no entry.
     */
    bindings: Map<string, IAutoMoviePrepareBicubicAtlasBoundary64Binding>;

    /**
     * Resolve a control:id or authority:name:phaseKey identity to its
     * equivalence representative, path-compressing the private alias map. An
     * unrelated key returns unchanged; this callback performs no admission.
     */
    root: (key: string) => string;

    /**
     * Return the shared cached millimetre point for an admitted authority and
     * exact canonical phase. Missing authority/key admission is a caller error;
     * evaluation exceptions propagate. The returned tuple aliases positions and
     * must not be mutated.
     */
    canonicalPoint: (
      authority: string,
      phase: IAutoMovieCanonicalBoundaryPhase64,
    ) => AutoMovieVector3Tuple;
    /**
     * Mutable equivalence-root to constructed millimetre point cache, initially
     * populated by coefficient constraints and extended lazily by
     * canonicalPoint.
     */
    positions: Map<string, AutoMovieVector3Tuple>;

    /**
     * Equivalence-root keys whose constructed coefficient assignments disagree.
     * A cached representative remains available, but its conflict persists.
     */
    conflicts: Set<string>;

    /**
     * Patch ID to canonical-relation qualification messages when complete-edge
     * ID peers declare different authoritative intervals. Finite consistent
     * fields remain available, without inter-authority conformity assurance.
     */
    diagnostics: Map<string, string[]>;
  };
}
