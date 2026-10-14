import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import { readProductionEntryPresence } from "./readProductionEntryPresence";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectAssertPhysicalDirectoryAncestors } from "./productionProjectAssertPhysicalDirectoryAncestors";
import { productionProjectAssertIncarnation } from "./productionProjectAssertIncarnation";

/**
 * Observe any in-project entry so unsafe recovery markers remain visible instead of appearing as absent prose.
 *
 * @evidence contracts/common.md#principled-implementation The presence owner checks current incarnation, strict lexical descendant and parent physical ancestry before lstat, then repeats parent and incarnation guards before returning presence, including dangling links or directories.
 * @evidence contracts/common.md#clear-and-simple-design This adapter supplies the existing project guards to the dedicated presence reader; readable nullable text remains a separate readProseDocument contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsafe final recovery markers are observed as present rather than hidden behind a regular-text check; escape, root-address and unsafe-parent errors propagate without a fabricated absence.
 * @evidence contracts/common.md#meaningful-documentation Defines entry presence versus readable text, repeated generation/parent checks and refusal; a true result is not permission to read or publish that entry.
 * @evidence contracts/performance.md#efficient-algorithms The delegated operation performs two incarnation checks, two parent-depth walks and one target lstat, plus path-text resolution; no target payload or directory population is read.
 * @evidence contracts/performance.md#reuse-equivalent-work Constructor identity captures remain comparison inputs but both pre/post observations are fresh; prior presence cannot replace recovery-marker currentness checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Three invocation-local callbacks borrow state; guarded readers own any transient descriptor cleanup and no marker, byte cache or pending task survives the call.
 */
export function productionProjectProseDocumentExists(state: AutoMovieProductionProjectState, relativePath: string): boolean {
    return readProductionEntryPresence({
        root: state.rootReal,
        relative: relativePath,
        assertCurrent: (): void => productionProjectAssertIncarnation(state),
        assertParent: (parent: string): void => productionProjectAssertPhysicalDirectoryAncestors(state.rootReal, parent, true),
        exists: (file: string): boolean => lstatOrNull(file) !== null,
    });
}
