import typia from "typia";
import { IAutoMovieRepaintShot } from "@automovie/interface";

/**
 * Requires exact typia request shape then clones it, returning null if schema access or structured cloning fails.
 *
 * @evidence contracts/common.md#principled-implementation Requires exact typia request shape then clones it, returning null if schema access or structured cloning fails.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original service value/admission operation; project lookup, dispatch and publication sequencing remain with the service coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation The returned clone owns plain request metadata and isolates later service work from mutable caller input.
 * @evidence contracts/performance.md#efficient-algorithms Admission and cloning scale with request metadata; unknown fields are not silently dropped.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned clone owns plain request metadata and isolates later service work from mutable caller input.
 */
export const productionRepaintServiceValidatedRepaintRequest: (input: unknown) => IAutoMovieRepaintShot.IProps | null = (
  input: unknown,
): IAutoMovieRepaintShot.IProps | null => {
  try {
    const validation: typia.IValidation<IAutoMovieRepaintShot.IProps> =
      typia.validateEquals<IAutoMovieRepaintShot.IProps>(input);
    return validation.success ? structuredClone(validation.data) : null;
  } catch {
    return null;
  }
};
