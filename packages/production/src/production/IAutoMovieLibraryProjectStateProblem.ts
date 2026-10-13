import type { AutoMovieLibraryProjectStateProblemCode } from "./AutoMovieLibraryProjectStateProblemCode";

/**
 * One exact reason a library publication cannot become current state.
 *
 * @evidence contracts/common.md#principled-implementation Stable code, nullable generated path and explanation carry one strict currentness refusal.
 * @evidence contracts/common.md#clear-and-simple-design Library inspection returns all observed problems even when its index is rejected.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type performs no repair or independent filesystem authentication.
 * @evidence contracts/common.md#meaningful-documentation Documents optional address and caller-owned diagnostic text.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased refusal shape selects no validation algorithm; inspectAutoMovieLibraryProjectState owns schema, owner and membership checks.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record coordinates no reuse; an emitted refusal belongs to one inspection rather than an equal-text shared operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires nothing; callers retain diagnostic strings and no artifact bytes or descriptors occur in this problem record.
 * @author Samchon
 */
export interface IAutoMovieLibraryProjectStateProblem {

    /**
     * Stable machine-readable refusal category.
     */
    code: AutoMovieLibraryProjectStateProblemCode;

    /**
     * Affected generated path, when one exists.
     */
    path: string | null;

    /**
     * Actionable refusal explanation.
     */
    message: string;
}
