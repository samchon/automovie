/**
 * One exact-key skin point carried by its represented native triangle.
 * Parent IDs are canonical source samples, but their tuple order is the
 * original triangle corner order. Weights retain the reader's represented
 * values and engine multiply/add order; identity sorting never reorders them.
 * This is existing source correspondence, not a personal coordinate input.
 *
 * @evidence contracts/common.md#principled-implementation Canonical native sample IDs and the reader's exact represented barycentric coefficients identify a material point on an original source triangle; arithmetic preserves its corner order.
 * @evidence contracts/common.md#clear-and-simple-design The record separates owning surface, ordered parent tuple, matching weight tuple and alias identity; registration assigns domain IDs without changing interpolation order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lexical identity sorting does not coordinate-weld samples or renormalize coefficients; correspondence alone supplies no clinical registration or deformation feasibility proof.
 * @evidence contracts/common.md#meaningful-documentation Members identify source ownership, canonical parent identity, original triangle order and exact alias key rather than exposing personal coordinates.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The correspondence record executes no source registration, sorting or barycentric interpolation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Its identity names represented correspondence but implements no replay cache or invalidation policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Parent/weight tuples carry no mesh handle or retained task; source registrars and the consuming build own actual records.
 * @author Samchon
 */
export interface IHumanFaceMaterialAttachment {
  /** Actual native skin surface that owns these parents. */
  surface: string;

  /** Canonical sample IDs in the original native triangle corner order. */
  parents: readonly [number, number, number];

  /** Reader coefficients in that same order, without renormalization. */
  weights: readonly [number, number, number];

  /** Exact source-parent/weight identity that joins all aliases of this point. */
  identity: string;
}
