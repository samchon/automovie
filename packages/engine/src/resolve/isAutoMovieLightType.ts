import { IAutoMovieLight } from "@automovie/interface";

import { AUTO_MOVIE_LIGHT_TYPES } from "./constants/AUTO_MOVIE_LIGHT_TYPES";

/** Whether an untyped artifact names one of the supported light kinds.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Require a string and test the shared closed set of supported staged light kinds, returning a type predicate without asserting untyped input before checking it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One runtime discriminator guard backs authored-light admission and keeps kind support separate from per-property support.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coercion or default light kind repairs unknown values; this check alone does not validate light fields.
 * @evidence contracts/development/common.md#meaningful-documentation Docs identify the untyped-artifact boundary and the supported-kind result rather than whole-light validity.
 * @evidence contracts/development/implementation.md#efficient-algorithms One scalar type test and fixed-set lookup take O(1) work without collection allocation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Validators reuse the constant supported-kind set; no cross-request result cache or mutable light object is assumed.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only a boolean returns, borrowing the module constant set and retaining no light, native handle or task.
 */
export const isAutoMovieLightType: (
  value: unknown,
) => value is IAutoMovieLight["type"] = (
  value: unknown,
): value is IAutoMovieLight["type"] =>
  typeof value === "string" &&
  AUTO_MOVIE_LIGHT_TYPES.has(value as IAutoMovieLight["type"]);
