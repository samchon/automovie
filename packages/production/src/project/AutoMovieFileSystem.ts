import type fs from "node:fs";

/**
 * Node-compatible storage capability selected per production invocation.
 *
 * Operations preserve Node's path, result and error contracts and own any acquired handles. The scoped runner supplies this dependency explicitly.
 *
 * @evidence contracts/common.md#principled-implementation Node's namespace type preserves the actual method signatures without another path or handle model.
 * @evidence contracts/common.md#clear-and-simple-design The scope, reader and dispatcher share one filesystem capability type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit dependencies do not replace Node globals or foreign methods.
 * @evidence contracts/common.md#meaningful-documentation States invocation selection, native contracts and handle ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The namespace signature executes no file read, traversal or write algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Filesystem capability methods declare effects rather than a cached observation or reuse policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The runtime scope owns namespace references and each operation owns acquired handles.
 */
export type AutoMovieFileSystem = typeof fs;
