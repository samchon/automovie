import { AsyncLocalStorage } from "node:async_hooks";
import type { AutoMovieFileSystem } from "./AutoMovieFileSystem";

/**
 * Invocation-local storage shared by filesystem selection and scoped entry.
 *
 * AsyncLocalStorage propagates an explicit dependency through asynchronous descendants while preserving concurrent invocation isolation.
 * One storage owner joins the scope runner and current-capability reader.
 * The native filesystem is unchanged and no global method is replaced.
 * States stored capability, scope and consuming operations.
 * Node owns context propagation; references scale with live asynchronous contexts rather than filesystem byte size.
 * Dependency identity is propagated, not filesystem answers.
 * The module retains one storage instance; scoped return or throw restores the parent context, while descendants retain their namespace until their asynchronous resources end. Storage opens no filesystem handle.
 */
export const fileSystemStorage: AsyncLocalStorage<AutoMovieFileSystem> =
  new AsyncLocalStorage<AutoMovieFileSystem>();
