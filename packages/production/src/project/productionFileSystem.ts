import type { AutoMovieFileSystem } from "./AutoMovieFileSystem";
import { currentAutoMovieFileSystem } from "./currentAutoMovieFileSystem";

/**
 * Dispatch production filesystem property reads to the invocation's capability.
 *
 * Selection occurs at property access. Retaining a returned method retains that implementation; ordinary callers invoke properties directly. Each operation preserves the native handle and error contract.
 *
 * A Proxy get trap forwards with Reflect.get to the current capability, preserving its Node-compatible surface. Project, publication, lock and render-job storage share this dispatcher, which targets a separate object and replaces no foreign method.
 *
 * Each property access adds a context lookup and Reflect.get before the underlying operation. Dispatch copies no file list or bytes and caches no filesystem results.
 *
 * The module retains one proxy without storing returned methods or handles; each consuming storage operation owns cleanup on success and failure.
 */
export const productionFileSystem: AutoMovieFileSystem = new Proxy({} as AutoMovieFileSystem, {
  get: (_target: AutoMovieFileSystem, property: string | symbol): unknown =>
    Reflect.get(currentAutoMovieFileSystem(), property),
});
