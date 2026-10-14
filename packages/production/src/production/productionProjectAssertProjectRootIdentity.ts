import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import type { BigIntStats, Stats } from "node:fs";

/**
 * Refuse a deleted production handle or a project root whose physical generation changed.
 *
 * @evidence contracts/common.md#principled-implementation Deleted state refuses first; lstat rejects absence, final links and nondirectories before bigint device/inode comparison with the constructor's admitted root identity.
 * @evidence contracts/common.md#clear-and-simple-design The project-root generation guard is shared by reads and mutations; state-root and production-incarnation checks remain distinct downstream responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A replacement at the same pathname is not admitted by string equality, and no stale handle is rebound or retried under a newly observed identity.
 * @evidence contracts/common.md#meaningful-documentation States deletion/root-generation refusal and the reopen correction; return establishes this observation only and does not prevent a subsequent filesystem change.
 * @evidence contracts/performance.md#efficient-algorithms At most one lstat and one bigint stat plus constant identity comparisons are performed; native path lookup cost depends on host path depth, without payload or directory-population reads.
 * @evidence contracts/performance.md#reuse-equivalent-work The constructor's expected identity is reused as the comparison basis, but every guard reacquires current facts rather than caching a successful observation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Stat objects are local and the state remains caller-owned; no descriptor, buffer, lock or task is retained on success or failure.
 */
export function productionProjectAssertProjectRootIdentity(state: AutoMovieProductionProjectState): void {
    if (state.deleted_)
        throw new AutoMovieProductionInputRaceError(`Production "${state.productionId}" was deleted. Open another registered production before reading or mutating project state.`);
    const linked: Stats | null = lstatOrNull(state.root);
    const current: BigIntStats | null = linked === null ||
        linked.isSymbolicLink() ||
        linked.isDirectory() === false
        ? null
        : fileSystem.statSync(state.root, { bigint: true });
    if (current === null ||
        current.dev.toString() !== state.rootDevice ||
        current.ino.toString() !== state.rootInode)
        throw new AutoMovieProductionInputRaceError("Production project root identity changed. Discard this project handle and open the physical project again before reading or mutating it.");
}
