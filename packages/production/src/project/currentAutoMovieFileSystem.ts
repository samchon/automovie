import fs from "node:fs";
import type { AutoMovieFileSystem } from "./AutoMovieFileSystem";
import { fileSystemStorage } from "./fileSystemStorage";

/**
 * Return the invocation's filesystem capability, defaulting to native storage.
 *
 * @evidence contracts/common.md#principled-implementation Context lookup selects an explicitly scoped dependency and nullish absence selects the native Node namespace.
 * @evidence contracts/common.md#clear-and-simple-design The production dispatcher has one owner for dependency selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native methods remain unchanged and overrides require explicit invocation scope.
 * @evidence contracts/common.md#meaningful-documentation States scoped selection and the native default.
 * @evidence contracts/performance.md#efficient-algorithms One context lookup and fallback return an existing reference without filesystem access or allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Dispatches in one scope share the dependency identity; no filesystem answer is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This reader retains no state or handle; the returned reference belongs to the scope or Node module.
 */
export function currentAutoMovieFileSystem(): AutoMovieFileSystem {
  return fileSystemStorage.getStore() ?? fs;
}
