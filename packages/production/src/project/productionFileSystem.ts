import type { AutoMovieFileSystem } from "./AutoMovieFileSystem";
import { currentAutoMovieFileSystem } from "./currentAutoMovieFileSystem";

/**
 * Dispatch production filesystem property reads to the invocation's capability.
 *
 * Selection occurs at property access. Retaining a returned method retains that
 * implementation; ordinary callers invoke properties directly. Each operation
 * preserves the native handle and error contract.
 *
 * A Proxy get trap forwards with Reflect.get to the current namespace, preserving the Node-compatible callable surface.
 * Project, publication, lock and render-job storage share one dispatcher; the current-capability reader owns selection.
 * The proxy targets a separate object and patches no foreign method; overrides are explicit scoped dependencies.
 * States property-time selection, retained-method behavior and native operation ownership.
 * Each property access adds a context lookup and Reflect.get before the underlying operation; dispatch copies no file list or bytes.
 * Filesystem results are not cached and each property access reads the active scope.
 * The module retains one proxy, storing neither returned methods nor handles; each consuming storage operation owns cleanup on success and failure.
 */
export const productionFileSystem: AutoMovieFileSystem = new Proxy({} as AutoMovieFileSystem, {
  get: (_target: AutoMovieFileSystem, property: string | symbol): unknown =>
    Reflect.get(currentAutoMovieFileSystem(), property),
});
