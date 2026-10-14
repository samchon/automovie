import { AutoMovieProductionSourcePathError } from "./AutoMovieProductionSourcePathError";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { readAutoMovieProductionOwnedFile } from "./productionRenderJob";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectResolveSourcePath } from "./productionProjectResolveSourcePath";
import { productionProjectIsInSourceRoot } from "./productionProjectIsInSourceRoot";

/**
 * Read a configured TypeScript source module through its resolved physical in-project address.
 *
 * @evidence contracts/common.md#principled-implementation Lexical source resolution and supported suffix admission precede exists/realpath observations; configured-root membership is checked again for the real target before the owned reader admits its physical ancestry, regular file and descriptor identity.
 * @evidence contracts/common.md#clear-and-simple-design Source addressing owns path/suffix policy and the shared owned-file reader owns bytes; this read does not execute a module or assign builder ownership to authored source.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing and outside-root sources refuse with typed source errors; realpath can admit an alias whose resolved target remains inside configured roots, so the original lexical spelling is not claimed to be link-free.
 * @evidence contracts/common.md#meaningful-documentation Defines source-module bytes, configured lexical and physical containment, alias semantics and native/read refusal; a successful byte read does not validate module exports or establish continuing source currentness.
 * @evidence contracts/performance.md#efficient-algorithms Includes project-root identity, up to two S-source-root membership passes with native path observations, then B-byte reading and ancestry/descriptor rechecks; no source-directory inventory or module evaluation occurs here.
 * @evidence contracts/performance.md#reuse-equivalent-work The resolved physical address feeds the one guarded byte read, while root membership and bytes are reobserved per call; prior path success or module-cache residency cannot replace those observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Path and ancestry/stat data is local; the owned reader attempts primary/recheck descriptor cleanup and surfaces failure, then bytes transfer to the caller without a retained source buffer, loader or task.
 */
export function productionProjectReadSource(state: AutoMovieProductionProjectState, relativePath: string): Uint8Array {
    const file: string = productionProjectResolveSourcePath(state, relativePath);
    if (fileSystem.existsSync(file) === false)
        throw new AutoMovieProductionSourcePathError("missing", `Source "${relativePath}" does not exist. Create it under a configured source root before compilation.`);
    const real: string = fileSystem.realpathSync(file);
    if (productionProjectIsInSourceRoot(state, real) === false)
        throw new AutoMovieProductionSourcePathError("outside-root", `Source "${relativePath}" escapes its configured source root through a symlink. Move it inside a source root.`);
    return readAutoMovieProductionOwnedFile({
        root: state.rootReal,
        directory: path.dirname(real),
        relative: path.basename(real),
    });
}
