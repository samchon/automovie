import type { AutoMovieLocalProcessQuery } from "./AutoMovieLocalProcessQuery";
import { localProcessQueryStorage } from "./localProcessQueryStorage";

const nativeQuery: AutoMovieLocalProcessQuery = (pid: number, signal: 0): unknown =>
  process.kill(pid, signal);

/**
 * Return the invocation's process-table capability, defaulting to signal zero.
 *
 * @evidence contracts/common.md#principled-implementation Context lookup supplies an explicit dependency or the native process.kill adapter whose signature allows only non-terminating signal zero.
 * @evidence contracts/common.md#clear-and-simple-design Commit-lock observation reads one capability owner before passing it to the pure owner resolver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Node's process.kill is never replaced; an override must enter an explicit invocation scope.
 * @evidence contracts/common.md#meaningful-documentation States scoped selection and the non-terminating native default.
 * @evidence contracts/performance.md#efficient-algorithms One asynchronous-context lookup returns an existing function without probing a process; the adapter's eventual native query owns its cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Calls in one scope share the capability identity; process occupancy answers are never cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The module keeps one native adapter and the scope owns overrides until their asynchronous resources end; the reader acquires no process handle or task.
 */
export function currentAutoMovieLocalProcessQuery(): AutoMovieLocalProcessQuery {
  return localProcessQueryStorage.getStore() ?? nativeQuery;
}
