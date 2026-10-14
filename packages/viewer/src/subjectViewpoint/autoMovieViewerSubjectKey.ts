import type { IAutoMovieViewerSubject } from "./IAutoMovieViewerSubject.js";

/**
 * Format a caller-supplied subject as kind:id or kind:id@revision without escaping. Round-trip requires a nonempty id, a nonempty revision without @ when present, and an id without @ when revision is null.
 *
 * @evidence contracts/common.md#principled-implementation Preserves authored category/id text and appends the optional revision using the parser's first-colon/last-at grammar; reserved delimiter restrictions are a caller premise, not enforced here.
 * @evidence contracts/common.md#clear-and-simple-design One textual inspection identity is separate from scene resolution and capture metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Encoding does not validate category membership, escape delimiter ambiguity or establish that the named source exists.
 * @evidence contracts/common.md#meaningful-documentation States exact syntax and the nonempty/delimiter premises needed for parser round-trip.
 * @evidence contracts/performance.md#efficient-algorithms Copies O(id+revision) text into one key, with no scene traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated inputs produce equal text without caching; text equality alone cannot certify current source or revision content.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned string is caller owned and retains no scene, renderer or identity registry.
 */
export function autoMovieViewerSubjectKey(subject: IAutoMovieViewerSubject): string { return subject.revision === null
    ? `${subject.kind}:${subject.id}`
    : `${subject.kind}:${subject.id}@${subject.revision}`; }
