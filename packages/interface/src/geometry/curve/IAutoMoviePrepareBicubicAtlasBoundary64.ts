import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";
import type { IAutoMovieCanonicalBoundaryPhase64 } from "./IAutoMovieCanonicalBoundaryPhase64";
import type { IAutoMoviePrepareBicubicAtlasBoundary64Binding } from "./IAutoMoviePrepareBicubicAtlasBoundary64Binding";

/**
 * Canonical boundary coefficient identities and shared position evaluation
 * state.
 */
export namespace IAutoMoviePrepareBicubicAtlasBoundary64 {
  /**
   * Prepared canonical curves, coefficient identities and complete edge uses.
   * Matching four-ID tuples transport one explicit oriented interval to unbound
   * incident sides. Their legacy render-normal owner remains separate from
   * explicit normal fans. Every constructed coefficient is shared by its
   * declared ID before tessellation; independently evaluated conflicting
   * assignments omit only incident patches. Exact positions validate existing
   * relations and never create identities. Equal restricted nets with different
   * named intervals retain their finite fields; inter-authority tessellation
   * sharing remains an explicit unqualified relation. Inputs must remain
   * immutable until the returned closures are released. Maps and cached tuples
   * are shared implementation state; preserve them until the entire atlas run
   * is complete. Conflicts are reported without a replacement assignment and
   * cause incident patch omission in the planning consumer.
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
     * Equivalence-root keys with nonfinite or exactly disagreeing constructed
     * coefficient assignments; an existing cached value does not clear a
     * conflict.
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
