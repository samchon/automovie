

/**
 * Opening refusal naming an unusable requested root and supplied acquisition detail. The stable Error carries text only, without preserving the native cause or reversing initialization effects elsewhere.
 *
 * @evidence contracts/common.md#principled-implementation Native Error names the unusable requested root and the acquisition failure detail.
 * @evidence contracts/common.md#clear-and-simple-design The opening factory maps physical-root acquisition failure before constructing resident state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The established exact nondirectory message mapping remains; other failures keep their message only and original causes are not attached.
 * @evidence contracts/common.md#meaningful-documentation States the requested root, exact acquisition-message mapping and stable root Error name without original cause retention.
 * @evidence contracts/performance.md#efficient-algorithms Message formatting and native stack allocation depend on explanation text and host stack behavior.
 * @evidence contracts/performance.md#reuse-equivalent-work Each current refusal creates its own message/stack rather than sharing an earlier Error.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Catching callers retain the Error; construction opens no descriptor, token or task.
 */
export class AutoMovieProjectRootError extends Error {
    public constructor(root: string, detail: string) {
        super(`AutoMovie project root "${root}" is not a usable directory. ` +
            `Fix or remove this path, then call openProject again. ` +
            `Detail: ${detail}`);
        this.name = "AutoMovieProjectRootError";
    }
}
