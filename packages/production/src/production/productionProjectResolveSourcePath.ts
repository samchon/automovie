import { isAutoMovieProductionProjectPathInside as isInside } from "./isAutoMovieProductionProjectPathInside";
import { AutoMovieProductionSourcePathError } from "./AutoMovieProductionSourcePathError";
import path from "node:path";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectIsInSourceRoot } from "./productionProjectIsInSourceRoot";
import { productionProjectAssertProjectRootIdentity } from "./productionProjectAssertProjectRootIdentity";

/**
 * Resolve a project-relative source module address under configured roots and the four supported TypeScript suffixes.
 *
 * @evidence contracts/common.md#principled-implementation Project-root identity is checked before absolute-path and native lexical escape refusal; configured-root containment precedes exact .ts/.tsx/.mts/.cts suffix membership and returns the resolved address without reading a target.
 * @evidence contracts/common.md#clear-and-simple-design This operation owns source address and suffix policy, while readSource separately observes target presence/realpath and guarded bytes and build owners execute admitted modules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported suffixes and outside-root addresses have no fallback; configured-root resolution does not itself prove final root directory kind, target existence or absence of a later alias/race.
 * @evidence contracts/common.md#meaningful-documentation Defines relative-only addressing, root-inclusive native containment, supported case-sensitive suffixes and typed outside-root versus generic suffix refusal; the result is an absolute path, not admitted source bytes.
 * @evidence contracts/performance.md#efficient-algorithms Native path work scales with address text and up to S configured-root resolution/realpath checks, including each delegated project-root observation; the fixed four-suffix membership performs no filesystem inventory.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each requested address obtains current root observations and no previous resolved path is retained as proof of target ownership or byte equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the resolved pathname escapes; path/stat temporaries expire locally and no file descriptor, module, payload buffer or running task is acquired.
 */
export function productionProjectResolveSourcePath(state: AutoMovieProductionProjectState, relativePath: string): string {
    productionProjectAssertProjectRootIdentity(state);
    if (path.isAbsolute(relativePath))
        throw new AutoMovieProductionSourcePathError("outside-root", `Source path "${relativePath}" is absolute. Use a project-relative module path.`);
    const resolved: string = path.resolve(state.root, relativePath);
    if (isInside(state.root, resolved) === false)
        throw new AutoMovieProductionSourcePathError("outside-root", `Source path "${relativePath}" escapes project root "${state.root}". Use a project-relative path inside the repository.`);
    if (productionProjectIsInSourceRoot(state, resolved) === false)
        throw new AutoMovieProductionSourcePathError("outside-root", `Source path "${relativePath}" is outside configured source roots. Move it under ${state.manifest_.sourceRoots.join(", ")}.`);
    if (![".ts", ".tsx", ".mts", ".cts"].includes(path.extname(resolved)))
        throw new Error(`Source path "${relativePath}" is not TypeScript. Bind a .ts, .tsx, .mts, or .cts module.`);
    return resolved;
}
