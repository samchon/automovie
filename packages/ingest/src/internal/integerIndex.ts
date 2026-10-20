import { validNodeIndex } from "./validNodeIndex";

/**
 * Admit an optional or required index into an already declared inventory.
 *
 * @evidence contracts/common.md#principled-implementation Safe integer identity and the half-open zero-to-length range establish resolvable references; omission is accepted only when optional.
 * @evidence contracts/common.md#clear-and-simple-design One gate owns reference existence semantics while callers supply the appropriate inventory and field path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Undefined required values, negatives, fractions and out-of-range indices throw instead of selecting a nearby element.
 * @evidence contracts/common.md#meaningful-documentation Prose defines required omission, zero-based range, safe precision and path-named failure.
 * @evidence contracts/performance.md#efficient-algorithms The helper performs constant-time predicates independent of the inventory population.
 * @evidence contracts/performance.md#reuse-equivalent-work All reference-array validation delegates this same gate without a separate range implementation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No inventory is copied or retained, and no resource is acquired by index admission.
 */
export const integerIndex: (
  value: unknown,
  length: number,
  path: string,
  required?: boolean,
) => void = (
  value: unknown,
  length: number,
  path: string,
  required: boolean = false,
): void => {
  if (value === undefined && required === false) return;
  if (validNodeIndex(value, length) === false)
    throw new Error(`${path} does not resolve inside its declared inventory.`);
};
