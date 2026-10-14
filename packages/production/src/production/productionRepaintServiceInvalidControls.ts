import { IAutoMovieRepaintShot } from "@automovie/interface";

/**
 * Evaluates the original prompt/negative-prompt/seed/strength/scalar-control/prototype/reference-presence refusal predicate without normalization.
 *
 * @evidence contracts/common.md#principled-implementation Evaluates the original prompt/negative-prompt/seed/strength/scalar-control/prototype/reference-presence refusal predicate without normalization.
 * @evidence contracts/common.md#clear-and-simple-design The extracted predicate owns the unchanged control refusal condition; the orchestration retains its exact failure branch and ordering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation Only a transient entries array is allocated; input objects are neither mutated nor cached.
 * @evidence contracts/performance.md#efficient-algorithms Prompt/control text checks and Object.entries scale with controls; strength remains [0,1] and the safe-integer seed contract is unchanged.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a transient entries array is allocated; input objects are neither mutated nor cached.
 */
export function productionRepaintServiceInvalidControls(input: IAutoMovieRepaintShot.IProps): boolean { return typeof input.parameters.prompt !== "string" ||
      input.parameters.prompt.trim().length === 0 ||
      input.parameters.prompt !== input.parameters.prompt.trim() ||
      (input.parameters.negativePrompt !== undefined &&
        (typeof input.parameters.negativePrompt !== "string" ||
          input.parameters.negativePrompt.trim().length === 0 ||
          input.parameters.negativePrompt !==
            input.parameters.negativePrompt.trim())) ||
      Number.isSafeInteger(input.parameters.seed) === false ||
      Number.isFinite(input.parameters.strength) === false ||
      input.parameters.strength < 0 ||
      input.parameters.strength > 1 ||
      Object.entries(input.parameters.controls ?? {}).some(
        ([key, value]: [string, string | number | boolean]): boolean =>
          key.trim().length === 0 ||
          key !== key.trim() ||
          (typeof value === "string" &&
            (value.trim().length === 0 || value !== value.trim())) ||
          (typeof value === "number" && Number.isFinite(value) === false) ||
          (typeof value !== "string" &&
            typeof value !== "number" &&
            typeof value !== "boolean"),
      ) ||
      (input.parameters.controls !== undefined &&
        Object.getPrototypeOf(input.parameters.controls) !== Object.prototype &&
        Object.getPrototypeOf(input.parameters.controls) !== null) ||
      input.references.length === 0; }
