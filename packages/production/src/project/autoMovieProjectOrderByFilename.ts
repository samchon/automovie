import { compareCodeUnits } from "@automovie/engine";
import { autoMovieProjectSliceFilename } from "./autoMovieProjectSliceFilename";

/**
 *
 * @evidence contracts/common.md#principled-implementation Named wrappers sort by encoded filename then project the original item references.
 * @evidence contracts/common.md#clear-and-simple-design Reproduces persisted directory order without disk access.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The original array is unchanged and record objects remain shared.
 * @evidence contracts/common.md#meaningful-documentation States fresh array ownership and suffix-sensitive ordering.
 * @evidence contracts/performance.md#efficient-algorithms N encodings and O(N log N) comparisons retain N wrappers/references and filename text.
 * @evidence contracts/performance.md#reuse-equivalent-work Computed names are reused during comparison rather than reencoded for each comparison.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Output references transfer; wrappers/text expire and no handle opens.
 */
export const autoMovieProjectOrderByFilename: <T>(items: T[], keyOf: (item: T) => string) => T[] = <T>(items: T[], keyOf: (item: T) => string): T[] => {
    const named: {
        item: T;
        name: string;
    }[] = items.map((item: T): {
        item: T;
        name: string;
    } => ({
        item,
        name: autoMovieProjectSliceFilename(keyOf(item)),
    }));
    named.sort((a: {
        item: T;
        name: string;
    }, b: {
        item: T;
        name: string;
    }): number => compareCodeUnits(a.name, b.name));
    return named.map((entry: {
        item: T;
        name: string;
    }): T => entry.item);
};
