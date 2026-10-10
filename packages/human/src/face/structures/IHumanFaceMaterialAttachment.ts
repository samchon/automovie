/**
 * One exact-key skin point carried by its represented native triangle.
 * Parent IDs are canonical source samples, but their tuple order is the
 * original triangle corner order. Weights retain the reader's represented
 * values and engine multiply/add order; identity sorting never reorders them.
 * This is existing source correspondence, not a personal coordinate input.
 *
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
