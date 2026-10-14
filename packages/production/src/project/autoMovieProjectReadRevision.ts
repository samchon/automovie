import type { AutoMovieProjectRevisionDecision } from "./AutoMovieProjectRevisionDecision";
import path from "node:path";
import { parseAutoMovieStructuredJson } from "../production/duplicateAwareJson";
import { readAutoMovieProductionOwnedFile } from "../production/productionRenderJob";
import { decodeAutoMovieProjectRevision } from "./projectRevision";
import { AutoMovieProjectJsonError } from "./AutoMovieProjectJsonError";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 *
 * @evidence contracts/common.md#principled-implementation Optional owned bytes and strict JSON parsing feed the safe-integer decoder; only absence becomes zero.
 * @evidence contracts/common.md#clear-and-simple-design Separates physical/parser attribution from pure clock admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed present clocks are neither reset nor rounded.
 * @evidence contracts/common.md#meaningful-documentation States legacy zero, safe integer domain and malformed-file refusal.
 * @evidence contracts/performance.md#efficient-algorithms Reads/parses B bytes with ancestry/descriptor checks before fixed numeric work.
 * @evidence contracts/performance.md#reuse-equivalent-work Every refresh renews current clock evidence rather than reusing an earlier value.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Readers close descriptors; only a clock or attributed Error escapes.
 */
export function autoMovieProjectReadRevision(_project: IAutoMovieProjectState): number {
    let value: unknown;
    try {
        const bytes: Uint8Array<ArrayBufferLike> | null = readAutoMovieProductionOwnedFile({
            root: _project.root,
            directory: _project.root,
            relative: path.basename(_project.revisionPath),
            optional: true,
        });
        value =
            bytes === null
                ? undefined
                : parseAutoMovieStructuredJson({
                    record: path.basename(_project.revisionPath),
                    bytes,
                });
    }
    catch (error) {
        throw new AutoMovieProjectJsonError(_project.revisionPath, (error as Error).message);
    }
    const decision: AutoMovieProjectRevisionDecision = decodeAutoMovieProjectRevision(value);
    if (decision.state === "invalid")
        throw new AutoMovieProjectJsonError(_project.revisionPath, "the record must contain one non-negative safe-integer revision");
    return decision.revision;
}
