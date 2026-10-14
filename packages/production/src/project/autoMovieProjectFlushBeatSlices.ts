import path from "node:path";
import { productionFileSystem as fileSystem } from "./productionFileSystem";
import { autoMovieProjectWriteAtomic } from "./autoMovieProjectWriteAtomic";
import { autoMovieProjectRemoveAtomic } from "./autoMovieProjectRemoveAtomic";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 *
 * @evidence contracts/common.md#principled-implementation A fenced directory scan removes .json names absent from staging before writing every staged member and reasserting ownership.
 * @evidence contracts/common.md#clear-and-simple-design One reconciler serves scenes, shots and beat ends in prescribed order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unrelated entries remain; partial failures are not batch rollback.
 * @evidence contracts/common.md#meaningful-documentation States removal-before-write ordering and staged-map ownership.
 * @evidence contracts/performance.md#efficient-algorithms Lists F resident names and performs N writes over B bytes plus atomic-helper costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Pre-rendered map values are reused; directory membership is freshly observed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Leaf helpers own temporaries; already completed mutations persist and no cache is retained here.
 */
export function autoMovieProjectFlushBeatSlices(_project: IAutoMovieProjectState, dir: string, staged: ReadonlyMap<string, string>, assertNamespace: () => void): void {
    const base: string = path.join(_project.root, dir);
    assertNamespace();
    for (const name of fileSystem.readdirSync(base))
        if (name.endsWith(".json") && !staged.has(name))
            autoMovieProjectRemoveAtomic(path.join(base, name), assertNamespace);
    for (const [name, content] of staged)
        autoMovieProjectWriteAtomic(path.join(base, name), content, assertNamespace);
    assertNamespace();
}
