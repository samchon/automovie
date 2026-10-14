import { autoMovieProjectSerializeJson } from "./autoMovieProjectSerializeJson";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 *
 * @evidence contracts/common.md#principled-implementation Current root and fixed slice name identify the destination; null stages removal and other values use the shared JSON renderer.
 * @evidence contracts/common.md#clear-and-simple-design Keeps serialization before the guarded mutation phase.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Serialization errors propagate before this helper touches files.
 * @evidence contracts/common.md#meaningful-documentation States absolute destination, null sentinel and owned rendered text.
 * @evidence contracts/performance.md#efficient-algorithms Path construction and full serialization scale with input/output text.
 * @evidence contracts/performance.md#reuse-equivalent-work One rendered string is reused during flush.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains the staged record; no resource is acquired.
 */
export function autoMovieProjectStageSlice(_project: IAutoMovieProjectState, name: string, value: unknown): {
    file: string;
    content: string | null;
} {
    return {
        file: _project.slicePath(name),
        content: value === null ? null : autoMovieProjectSerializeJson(value),
    };
}
