import { autoMovieProjectSliceFilename } from "./autoMovieProjectSliceFilename";
import { autoMovieProjectSerializeJson } from "./autoMovieProjectSerializeJson";

/**
 *
 * @evidence contracts/common.md#principled-implementation Encoded keys and the common JSON renderer materialize a filename-to-text map before resident mutation.
 * @evidence contracts/common.md#clear-and-simple-design Owns the throw-prone keyed staging half; case-collision admission is separate in saveSlate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate encoded keys overwrite inside this map under its already unique map-input premise.
 * @evidence contracts/common.md#meaningful-documentation States staged text ownership and key encoding failures.
 * @evidence contracts/performance.md#efficient-algorithms Visits N entries and serializes B bytes with O(N+B) staging storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Rendered text is reused throughout the subsequent flush.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The cycle caller owns staging until completion; no file opens.
 */
export const autoMovieProjectStageBeatSlices: (byBeat: ReadonlyMap<string, unknown>) => Map<string, string> = (byBeat: ReadonlyMap<string, unknown>): Map<string, string> => {
    const staged: Map<string, string> = new Map<string, string>();
    for (const [beat, value] of byBeat)
        staged.set(autoMovieProjectSliceFilename(beat), autoMovieProjectSerializeJson(value));
    return staged;
};
