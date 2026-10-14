import { validateProductionDesignTurn } from "./validateProductionDesignTurn";

/**
 * Read four planar orientation values and overlapping XZ bounds under the retained 1e-9 policy.
 *
 * @evidence contracts/common.md#principled-implementation This is the polygon gate's inclusive represented-coordinate test, not an exact adaptive predicate.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignSegmentsIntersect owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms Four fixed orientations and scalar bounds take constant work and storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export const validateProductionDesignSegmentsIntersect: (a: { x: number; z: number; }, b: { x: number; z: number; }, c: { x: number; z: number; }, d: { x: number; z: number; }) => boolean = (
  a: { x: number; z: number },
  b: { x: number; z: number },
  c: { x: number; z: number },
  d: { x: number; z: number },
): boolean => {
  const abC: number = validateProductionDesignTurn(a, b, c);
  const abD: number = validateProductionDesignTurn(a, b, d);
  const cdA: number = validateProductionDesignTurn(c, d, a);
  const cdB: number = validateProductionDesignTurn(c, d, b);
  return (
    [abC, abD, cdA, cdB].every(Number.isFinite) &&
    Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)) <=
      Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) + 1e-9 &&
    Math.max(Math.min(a.z, b.z), Math.min(c.z, d.z)) <=
      Math.min(Math.max(a.z, b.z), Math.max(c.z, d.z)) + 1e-9 &&
    abC * abD <= 1e-9 &&
    cdA * cdB <= 1e-9
  );
};
