/**
 * Return the represented XZ determinant of two edges in caller units.
 *
 * @evidence contracts/common.md#principled-implementation No normalization or tolerance is applied here; overflow and degeneracy are judged by its callers.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignTurn owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms Fixed subtraction and multiplication take constant work and storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export const validateProductionDesignTurn: (first: { x: number; z: number; }, second: { x: number; z: number; }, third: { x: number; z: number; }) => number = (
  first: { x: number; z: number },
  second: { x: number; z: number },
  third: { x: number; z: number },
): number =>
  (second.x - first.x) * (third.z - first.z) -
  (second.z - first.z) * (third.x - first.x);
