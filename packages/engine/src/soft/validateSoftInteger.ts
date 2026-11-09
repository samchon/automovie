import { ViolationCollector } from "../validation/ViolationCollector";

/**
 * Append a type violation for a value outside a safe-integer interval.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Number.isSafeInteger establishes an exactly representable whole number before inclusive bounds decide admission; internal Infinity may express an unbounded upper limit.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The caller owns lattice, depth or particle-index limits, while this shared owner keeps safe-integer admission and diagnostic wording identical.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Fractional and unsafe values are not rounded or clipped into the supported range.
 * @evidence contracts/development/common.md#meaningful-documentation Documents inclusive endpoints, type-kind diagnostics and append-only mutation of the supplied collector.
 * @evidence contracts/development/implementation.md#efficient-algorithms Safe-integer and endpoint tests take constant work, plus one violation/message allocation only on failure.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Planting and soft-domain validators share the same admission expression instead of maintaining duplicate integer helpers.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Any finding remains in the caller-owned collector; this operation retains neither input records nor a task.
 */
export const validateSoftInteger: (
  out: ViolationCollector,
  path: string,
  label: string,
  value: number,
  min: number,
  max: number,
) => void = (
  out: ViolationCollector,
  path: string,
  label: string,
  value: number,
  min: number,
  max: number,
): void => {
  if (!Number.isSafeInteger(value) || value < min || value > max)
    out.push(
      "type",
      path,
      `${label} must be an integer within [${min}, ${max}]`,
      value,
    );
};
