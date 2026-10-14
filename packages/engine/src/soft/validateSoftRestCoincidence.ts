import { IAutoMovieSoftBodyDomain } from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";

/**
 * Report a structural rest edge whose squared displacement vanishes.
 *
 * @evidence contracts/common.md#principled-implementation The original sum of squared coordinate differences decides zero length for dense admitted particle triples; underflow can also erase tiny nonzero displacement, an unresolved arithmetic limit.
 * @evidence contracts/common.md#clear-and-simple-design Soft-domain validation calls this owner only for right/down structural edges; it does not certify all particle pairs or shear/bend directions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tolerance or fixture exception changes the original squared expression, and the reported pair/path are preserved rather than silently moved apart.
 * @evidence contracts/common.md#meaningful-documentation States flat triple indexing, structural-edge scope, squared arithmetic limitation and append-only type violation.
 * @evidence contracts/performance.md#efficient-algorithms Six coordinate reads and fixed arithmetic take constant time/space for each visited structural edge.
 * @evidence contracts/performance.md#reuse-equivalent-work The domain traversal owns which edges to inspect; this helper stores no repeated displacement or rest-geometry cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The domain array is read and unretained; only the caller collector owns any finding and its particle-index pair.
 */
export const validateSoftRestCoincidence: (
  out: ViolationCollector,
  root: string,
  domain: IAutoMovieSoftBodyDomain,
  a: number,
  b: number,
) => void = (
  out: ViolationCollector,
  root: string,
  domain: IAutoMovieSoftBodyDomain,
  a: number,
  b: number,
): void => {
  const dx: number = domain.rest[b * 3] - domain.rest[a * 3];
  const dy: number = domain.rest[b * 3 + 1] - domain.rest[a * 3 + 1];
  const dz: number = domain.rest[b * 3 + 2] - domain.rest[a * 3 + 2];
  if (dx * dx + dy * dy + dz * dz !== 0) return;
  out.push(
    "type",
    `${root}.rest[${a * 3}]`,
    `rest particles ${a} and ${b} are coincident, so the constraint between them has no direction`,
    [a, b],
  );
};
