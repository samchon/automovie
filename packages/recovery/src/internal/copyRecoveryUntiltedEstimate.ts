import type { IAutoMovieRecoveryUntiltedEstimate } from "../structures/internal/IAutoMovieRecoveryUntiltedEstimate";

/**
 * Copy one selected model's borrowed original dual into fit-owned seed storage.
 *
 * @evidence contracts/common.md#principled-implementation A qualified estimate has matching physical width/complete row count, increasing original inequality IDs and finite nonnegative multipliers. Empty qualified arrays remain an observed zero-extended vector; null clears the prior seed.
 * @evidence contracts/common.md#clear-and-simple-design One precommit numerical reaction owns validation/copy, while generic owns only its charged fixed wrapper. The caller replaces its old seed only after this operation returns.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No borrowed wrapper/array escapes, stale seed survives a null update, or scalar last report supplies a missing vector. Malformed identity and original charge errors propagate before commit.
 * @evidence contracts/common.md#meaningful-documentation Row count and width refer to one fixed fit's original physical chart/population. This copy does not certify a current or limiting nonlinear multiplier.
 * @evidence contracts/performance.md#efficient-algorithms Constant length admission precedes64(H+1) charged visits; one H loop validates and copies two scalars per row. Null consumes64 visits for clearing, with no H scan or numerical allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work The current complete-affine certificate is reused without resolving a QP or re-evaluating geometry; unchanged scalar row IDs need no covector chart transport.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Two owned H arrays transfer; the caller admits old/new overlap up to4E entries in S and drops the old reference after success. Null allocates no seed and new fits initialize without one.
 */
export function copyRecoveryUntiltedEstimate(
  estimate: IAutoMovieRecoveryUntiltedEstimate | null,
  width: number,
  rowCount: number,
  charge: (work: number) => void,
): IAutoMovieRecoveryUntiltedEstimate | null {
  const count: number = estimate?.selected.length ?? 0;
  const work: number = 64 * (count + 1);
  if (
    !Number.isSafeInteger(width) ||
    width < 1 ||
    !Number.isSafeInteger(rowCount) ||
    rowCount < 1 ||
    !Number.isSafeInteger(count) ||
    count < 0 ||
    count >= rowCount ||
    !Number.isSafeInteger(work)
  )
    throw new Error(
      "camera-curvature: bounded borrowed selected count required",
    );
  charge(work);
  if (estimate === null) return null;
  if (
    estimate.width !== width ||
    estimate.rowCount !== rowCount ||
    estimate.multipliers.length !== count
  )
    throw new Error(
      "camera-curvature: unchanged original dual identity required",
    );
  const selected: number[] = [],
    multipliers: number[] = [];
  for (let at: number = 0; at < count; at++) {
    const id: number = estimate.selected[at]!,
      multiplier: number = estimate.multipliers[at]!;
    if (
      !Number.isSafeInteger(id) ||
      id < 1 ||
      id >= rowCount ||
      (at > 0 && id <= estimate.selected[at - 1]!) ||
      !(multiplier >= 0) ||
      !Number.isFinite(multiplier)
    )
      throw new Error(
        "camera-curvature: qualified ordered original dual required",
      );
    selected.push(id);
    multipliers.push(multiplier);
  }
  return { width, rowCount, selected, multipliers };
}
