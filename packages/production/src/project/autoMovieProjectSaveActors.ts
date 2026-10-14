import path from "node:path";
import { IAutoMovieLegacyActorSpec } from "./legacyRecords";
import { autoMovieProjectSliceFilename } from "./autoMovieProjectSliceFilename";
import { autoMovieProjectWriteAtomic } from "./autoMovieProjectWriteAtomic";
import { autoMovieProjectSerializeJson } from "./autoMovieProjectSerializeJson";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 * Stage all selected actor filenames and text before one revision-guarded cycle writes them in input order. Unnamed siblings remain; semantic, duplicate and case admission are external, and later failures can leave earlier selected members published.
 *
 * @evidence contracts/common.md#principled-implementation All actor filenames/text are staged before one guarded cycle writes selected members in input order.
 * @evidence contracts/common.md#clear-and-simple-design One revision increment surrounds upserts while unnamed siblings remain untouched.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Serialization failure writes nothing; later leaf failure can retain earlier writes, with no added duplicate/case guard.
 * @evidence contracts/common.md#meaningful-documentation States selected-member upsert and partial-flush limits.
 * @evidence contracts/performance.md#efficient-algorithms Stages N records/B bytes then performs N writes and one concurrency scope.
 * @evidence contracts/performance.md#reuse-equivalent-work Staged text is reused; equal ids never authorize shared effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Staging expires and safe lock/temporary retirement is attempted; cleanup can retain fences/temporaries and published actor files remain.
 */
export function autoMovieProjectSaveActors(_project: IAutoMovieProjectState, specs: readonly IAutoMovieLegacyActorSpec[]): void {
    const staged: {
        file: string;
        content: string;
    }[] = specs.map((spec: IAutoMovieLegacyActorSpec): {
        file: string;
        content: string;
    } => ({
        file: path.join(_project.root, "actors", autoMovieProjectSliceFilename(spec.node)),
        content: autoMovieProjectSerializeJson(spec),
    }));
    _project.commitCycle((assertNamespace: () => void): void => {
        for (const { file, content } of staged)
            autoMovieProjectWriteAtomic(file, content, assertNamespace);
    });
}
