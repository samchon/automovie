import path from "node:path";
import { IAutoMovieLegacyPropSpec } from "./legacyRecords";
import { autoMovieProjectSliceFilename } from "./autoMovieProjectSliceFilename";
import { autoMovieProjectWriteAtomic } from "./autoMovieProjectWriteAtomic";
import { autoMovieProjectSerializeJson } from "./autoMovieProjectSerializeJson";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 * Serialize and upsert one prop through a revision-guarded leaf replacement, leaving siblings untouched. This low-level save admits neither prop semantics nor sibling case identity; encoding/serialization precede mutation, while a published leaf may survive later revision refusal.
 *
 * @evidence contracts/common.md#principled-implementation An encoded node destination and serialized prop feed one revision-guarded leaf replacement.
 * @evidence contracts/common.md#clear-and-simple-design Upserts this prop while siblings remain untouched.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This low-level save performs no semantic or sibling case-collision admission.
 * @evidence contracts/common.md#meaningful-documentation States serialization-before-mutation, upsert scope and stale-clock refusal.
 * @evidence contracts/performance.md#efficient-algorithms Encodes node text and writes B serialized bytes plus concurrency checks.
 * @evidence contracts/performance.md#reuse-equivalent-work Staged text feeds publication; matching keys do not share effectful writes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Lock/temporary retirement is attempted only through their owners; native cleanup can retain fences/temporaries and renamed files can survive later refusal.
 */
export function autoMovieProjectSaveProp(_project: IAutoMovieProjectState, spec: IAutoMovieLegacyPropSpec): void {
    const file: string = path.join(_project.root, "props", autoMovieProjectSliceFilename(spec.node));
    const content: string = autoMovieProjectSerializeJson(spec);
    _project.commitCycle((assertNamespace: () => void): void => autoMovieProjectWriteAtomic(file, content, assertNamespace));
}
