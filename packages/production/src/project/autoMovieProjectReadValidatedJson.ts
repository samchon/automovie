import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { autoMovieProjectReadJson } from "./autoMovieProjectReadJson";
import { autoMovieProjectValidateProjectValue } from "./autoMovieProjectValidateProjectValue";

/**
 *
 * @evidence contracts/common.md#principled-implementation Unknown optional JSON is admitted by its supplied gate before the generic typed return.
 * @evidence contracts/common.md#clear-and-simple-design Composes byte acquisition and slice semantics without another materialization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent or parsed-null values skip validation; generic T relies on the chosen gate.
 * @evidence contracts/common.md#meaningful-documentation States null short circuit, semantic refusal and returned record ownership.
 * @evidence contracts/performance.md#efficient-algorithms Includes full owned read/parser and callback validation costs.
 * @evidence contracts/performance.md#reuse-equivalent-work The single parsed value serves validation and return.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned trees transfer; reader descriptors close and no retained cache exists.
 */
export const autoMovieProjectReadValidatedJson: <T>(root: string, file: string, validate: (value: unknown, violations: IAutoMovieConstraintViolation[]) => void) => T | null = <T>(root: string, file: string, validate: (value: unknown, violations: IAutoMovieConstraintViolation[]) => void): T | null => {
    const value: unknown = autoMovieProjectReadJson<unknown>(root, file);
    if (value === null)
        return null;
    autoMovieProjectValidateProjectValue(file, value, validate);
    return value as T;
};
