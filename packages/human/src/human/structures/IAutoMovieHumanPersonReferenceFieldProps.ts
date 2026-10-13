import type { IAutoMovieHumanPersonSourcePartitionPlan } from "./IAutoMovieHumanPersonSourcePartitionPlan";
import type { IAutoMovieHumanPersonSourceStarBinding } from "./IAutoMovieHumanPersonSourceStarBinding";

/**
 * Inputs of `createHumanPersonReferenceField`: the admitted partition plan, each used vertex's star binding per side, the binding of any sample under any parent, and the performed parent area vectors.
 *
 * @evidence contracts/common.md#principled-implementation Per-vertex star bindings and performed parent area vectors use one admitted partition tree; undefined bindings explicitly identify unused vertices.
 * @evidence contracts/common.md#clear-and-simple-design The normal-field owner receives ready bindings plus a parent-local binding reader, keeping domain identity decisions in source-normal compilation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Parent areas derive from performed cells rather than a fixed neutral normal field; absent vertex bindings represent genuinely unused geometry.
 * @evidence contracts/common.md#meaningful-documentation Members document head/body ordering, unused bindings, parent-area triples and sample-under-parent lookup.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The parent area vectors and source-star binding operands are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the parent area vectors and source-star binding operands; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring parent area vectors and source-star binding operands acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonReferenceFieldProps {
  /** The admitted partition plan. */
  plan: IAutoMovieHumanPersonSourcePartitionPlan;

  /** Per side (head, body), each vertex's binding, undefined for an unused vertex. */
  bindings: readonly (readonly (
    | IAutoMovieHumanPersonSourceStarBinding
    | undefined
  )[])[];

  /**
   * The binding of a sample under a parent.
   *
   * @evidence contracts/common.md#principled-implementation An incident parent determines the sample's ancestral corner domains, so a canonical geometric sample can retain distinct opposed normal stars.
   * @evidence contracts/common.md#clear-and-simple-design A binding reader serves sparse reference-field queries while precompiled per-vertex bindings serve the dense output.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Parent-local bindings are read from admitted lineage rather than guessed from spatial proximity or selected by consumer name.
   * @evidence contracts/common.md#meaningful-documentation The member documents a canonical sample under a parent and returns the weighted star and chart binding record.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A binding-reader declaration implements no corner lookup or sorting; source-normal compilation owns those steps.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Binding equivalence is represented by the returned weighted identity; reference-field lookup owns normal memoization.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This binding signature acquires no map or handle and leaves the returned record with its implementing owner.
   */
  bindingAt: (
    sample: number,
    parent: number,
  ) => IAutoMovieHumanPersonSourceStarBinding;

  /** Each parent's performed area vector, three numbers per parent triangle, square metres. */
  parentAreas: readonly number[];
}
