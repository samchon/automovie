import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { validateNonEmptyId } from "../validators/primitives";

/**
 * Accept null or append the shared nonempty-id findings at the supplied path. Undefined remains an invalid id rather than becoming the absent relation; the borrowed value is never changed.
 *
 * @evidence contracts/common.md#principled-implementation Null is accepted; every other value uses nonempty-id admission at the supplied path.
 * @evidence contracts/common.md#clear-and-simple-design Shares optional predecessor/parent checking in tree shape admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Undefined is not silently changed to null.
 * @evidence contracts/common.md#meaningful-documentation States null semantics and located id refusal.
 * @evidence contracts/performance.md#efficient-algorithms Includes supplied text validation with constant wrapper work.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the common current-value gate without caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The existing collector owns any finding and offending value.
 */
export const autoMovieProjectValidateNullableId: (value: unknown, path: string, label: string, violations: IAutoMovieConstraintViolation[]) => void = (value: unknown, path: string, label: string, violations: IAutoMovieConstraintViolation[]): void => {
    if (value === null)
        return;
    validateNonEmptyId(value, path, label, violations);
};
