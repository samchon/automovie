import path from "node:path";
import { productionFileSystem as fileSystem } from "./productionFileSystem";
import { autoMovieProjectSliceFilename } from "./autoMovieProjectSliceFilename";
import { autoMovieProjectSliceKeyFromFilename } from "./autoMovieProjectSliceKeyFromFilename";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 * Scan current directory names for the first differently spelled .json member sharing the target's lowercase encoded filename, then decode its key or return null. This performs no content validation, preserves native directory order and propagates scan/encoding/decoding errors.
 *
 * @evidence contracts/common.md#principled-implementation Encoded target names fold to lowercase while exact spelling is excluded; the first matching sibling is decoded.
 * @evidence contracts/common.md#clear-and-simple-design Prop and actor queries share directory-name discovery.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Iteration chooses the first match without sorting; no semantic admission or write authority follows.
 * @evidence contracts/common.md#meaningful-documentation States first-match order, .json scope and decode/scan failures.
 * @evidence contracts/performance.md#efficient-algorithms Visits up to F names with folding and target encoding costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Current directory names are reobserved without caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a key/null escapes and no descriptor is retained.
 */
export function autoMovieProjectSliceCaseCollision(_project: IAutoMovieProjectState, dir: string, node: string): string | null {
    const target: string = autoMovieProjectSliceFilename(node);
    const lower: string = target.toLowerCase();
    const base: string = path.join(_project.root, dir);
    for (const name of fileSystem.readdirSync(base))
        if (name.endsWith(".json") &&
            name.toLowerCase() === lower &&
            name !== target)
            return autoMovieProjectSliceKeyFromFilename(path.join(base, name), name);
    return null;
}
