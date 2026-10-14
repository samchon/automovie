import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { AutoMovieProjectShapeError } from "./AutoMovieProjectShapeError";
import { autoMovieProjectDescribeViolations } from "./autoMovieProjectDescribeViolations";

/**
 *
 * @evidence contracts/common.md#principled-implementation A fresh violation array collects the supplied gate's findings and throws a shape error when nonempty.
 * @evidence contracts/common.md#clear-and-simple-design Gives keyed and optional slice readers one semantic refusal boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Warnings appended by gates also count under this established nonempty collector rule; no finding is silently dropped.
 * @evidence contracts/common.md#meaningful-documentation States validator effects and five-finding explanation projection.
 * @evidence contracts/performance.md#efficient-algorithms Includes full callback work and finding allocation plus first-five explanation formatting.
 * @evidence contracts/performance.md#reuse-equivalent-work One collector serves the current value; no cross-value verdict reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller errors retain explanation; local findings expire unless otherwise captured by the callback.
 */
export const autoMovieProjectValidateProjectValue: <T>(file: string, value: T, validate: (value: T, violations: IAutoMovieConstraintViolation[]) => void) => void = <T>(file: string, value: T, validate: (value: T, violations: IAutoMovieConstraintViolation[]) => void): void => {
    const violations: IAutoMovieConstraintViolation[] = [];
    validate(value, violations);
    if (violations.length > 0)
        throw new AutoMovieProjectShapeError(file, autoMovieProjectDescribeViolations(violations));
};
