

/**
 * Import-specific malformed-JSON Error, recognized by applied-state admission to return null. Its inherited constructor stores the path-specific message and original parser cause supplied by the wrapper.
 *
 * @evidence contracts/common.md#principled-implementation A dedicated Error subtype distinguishes malformed persisted import JSON from unrelated read failures at the applied-state boundary.
 * @evidence contracts/common.md#clear-and-simple-design Keeps parsing refusal classification separate from plan/state schema checks and filesystem observation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No malformed value is converted to a valid plan, and the wrapper retains the parser's actual cause rather than substituting its string as failure evidence.
 * @evidence contracts/common.md#meaningful-documentation States malformed-JSON classification, inherited constructor and parser-cause retention through Error options.
 * @evidence contracts/performance.md#efficient-algorithms Inherited Error construction retains message/stack state following their lengths; this subtype adds no independent scan or allocation population.
 * @evidence contracts/performance.md#reuse-equivalent-work Applied-state admission recognizes this exact class identity without a message regex or error cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retaining the error retains its message, stack and supplied cause reference; the subtype acquires no descriptor, lease or task.
 */
export class legacyImporterInvalidLegacyImportJsonError extends Error {}
