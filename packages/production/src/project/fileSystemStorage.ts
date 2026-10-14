import { AsyncLocalStorage } from "node:async_hooks";
import type { AutoMovieFileSystem } from "./AutoMovieFileSystem";

/**
 * Invocation-local storage shared by filesystem selection and scoped entry.
 *
 * AsyncLocalStorage propagates the explicit capability through asynchronous descendants while isolating concurrent invocations. The scope runner and current-capability reader share this storage; Node's filesystem methods remain unchanged and filesystem answers are not cached.
 *
 * The module retains one storage instance and references scale with live asynchronous contexts. Scoped return or throw restores the parent context, while descendants retain their capability until their asynchronous resources end. Storage opens no filesystem handle.
 */
export const fileSystemStorage: AsyncLocalStorage<AutoMovieFileSystem> =
  new AsyncLocalStorage<AutoMovieFileSystem>();
