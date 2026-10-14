

/**
 * File-attributed resident JSON, acquisition or revision-shape refusal. The stable Error retains supplied reason text but not the original cause or stack; constructing it changes no project data.
 *
 * @evidence contracts/common.md#principled-implementation Native Error identifies the malformed file and includes the parser/filesystem message under the established JSON refusal name.
 * @evidence contracts/common.md#clear-and-simple-design Revision and optional JSON readers share file-context attribution; invalid clock shape uses this same refusal identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only message text is retained; the original error/cause/stack is not attached and no resident data is repaired.
 * @evidence contracts/common.md#meaningful-documentation States the malformed file address, parser/filesystem or clock detail, stable Error name and loss of the original cause.
 * @evidence contracts/performance.md#efficient-algorithms Message formatting and native stack allocation depend on explanation text and host stack behavior.
 * @evidence contracts/performance.md#reuse-equivalent-work Each current refusal creates its own message/stack rather than sharing an earlier Error.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Catching callers retain the Error; construction opens no descriptor, token or task.
 */
export class AutoMovieProjectJsonError extends Error {
    public constructor(file: string, reason: string) {
        super(`AutoMovie project file "${file}" contains malformed JSON. ` +
            `Fix or remove this file, then call openProject again. ` +
            `Parser detail: ${reason}`);
        this.name = "AutoMovieProjectJsonError";
    }
}
