import { AsyncLocalStorage } from "node:async_hooks";
import type { AutoMovieLocalProcessQuery } from "./AutoMovieLocalProcessQuery";

/**
 * Invocation-local process-table capability shared by the query reader and runner.
 *
 * Node restores the parent scope on return or throw while asynchronous descendants retain their dependency until completion. This singleton opens no process handle and stores no process-table answers.
 */
export const localProcessQueryStorage: AsyncLocalStorage<AutoMovieLocalProcessQuery> =
  new AsyncLocalStorage<AutoMovieLocalProcessQuery>();
