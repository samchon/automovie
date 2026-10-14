import type { AutoMovieLocalProcessQuery } from "./AutoMovieLocalProcessQuery";
import { localProcessQueryStorage } from "./localProcessQueryStorage";

/**
 * Execute an operation with an explicit invocation-local process-table capability.
 *
 * Production lock observation uses the native capability outside an explicit scope. Descendant completion belongs to the supplied operation, whose result or exception is preserved; current repository callers do not invoke this scoped entry.
 *
 * @evidence contracts/common.md#principled-implementation AsyncLocalStorage.run supplies the capability to the operation and descendants, restores the parent on return or throw, and preserves promises as ordinary return values.
 * @evidence contracts/common.md#clear-and-simple-design One scoped runner supplies the capability read by commit-lock observations through the canonical current-capability reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An explicit dependency supplies the query instead of replacing process.kill or inferring process death from age.
 * @evidence contracts/common.md#meaningful-documentation States the lack of current repository invocations, native default, descendant ownership and result preservation.
 * @evidence contracts/performance.md#efficient-algorithms Scope entry adds Node context propagation cost; the supplied operation and its asynchronous descendants determine total work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each effectful operation executes independently and no process-query result is shared as a cached answer.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The active parent scope is restored on return or throw; descendants retain the capability until completion. The runner opens no process handle and cannot clean up tasks the operation owns.
 */
export function withAutoMovieLocalProcessQuery<Output>(
  query: AutoMovieLocalProcessQuery,
  operation: () => Output,
): Output {
  return localProcessQueryStorage.run(query, operation);
}
