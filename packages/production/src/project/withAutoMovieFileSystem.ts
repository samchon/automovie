import type { AutoMovieFileSystem } from "./AutoMovieFileSystem";
import { fileSystemStorage } from "./fileSystemStorage";

/**
 * Execute an operation with an explicit invocation-local filesystem capability.
 *
 * Current callers are storage fault tests; ordinary production dispatch uses native storage. Descendants inherit the dependency and the operation owns their completion and handles. The original result or exception is preserved.
 *
 * @evidence contracts/common.md#principled-implementation AsyncLocalStorage.run binds a dependency to the operation and its descendants and restores the parent on synchronous return or throw, preserving the result including promises.
 * @evidence contracts/common.md#clear-and-simple-design One scoped entry supplies the ordinary storage dispatcher; current invocation owners are the explicit storage-fault test harness.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Injected storage errors pass through actual production operations without replacing Node globals or foreign methods.
 * @evidence contracts/common.md#meaningful-documentation States current use, native default, descendant inheritance, completion ownership and result preservation.
 * @evidence contracts/performance.md#efficient-algorithms Scope entry adds Node context bookkeeping; total work follows the operation and asynchronous descendant population.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every effectful operation executes and no answer is memoized.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parent context is restored on return or throw; descendants may retain the namespace until completion. The runner opens no handle and the supplied operation owns its resource cleanup.
 */
export function withAutoMovieFileSystem<T>(fileSystem: AutoMovieFileSystem, task: () => T): T {
  return fileSystemStorage.run(fileSystem, task);
}
