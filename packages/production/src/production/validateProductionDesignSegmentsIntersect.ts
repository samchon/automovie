import { validateProductionDesignTurn } from "./validateProductionDesignTurn";

/**
 * Read four planar orientation values and overlapping XZ bounds under the retained 1e-9 policy.
 *
 * @evidence contracts/common.md#principled-implementation Four orientation determinants must be finite, X/Z intervals must overlap within 1e-9 and both paired determinant products must be at most 1e-9. The polygon caller supplies finite metre coordinates; collinear contact and near-contact are inclusive under this represented-coordinate policy, whose determinant-product tolerance is not a scale-independent geometric distance.
 * @evidence contracts/common.md#clear-and-simple-design Segment contact combines the shared orientation helper with axis bounds; polygon topology and finding construction remain with their respective callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation States inclusive contact, finite-orientation prerequisite and fixed arithmetic tolerance; it returns a boolean without changing endpoints or providing an exact adaptive geometry verdict.
 * @evidence contracts/performance.md#efficient-algorithms Four fixed orientations and scalar bounds take constant work and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Four orientation scalars are computed once and reused for finiteness and paired-product tests; no earlier endpoint verdict is retained.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Four scalars and one fixed four-value array are temporary; only a boolean escapes and no endpoint, diagnostic population, handle or task is retained.
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
