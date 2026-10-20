/**
 * Load the installed glTF SDK's CommonJS export only when a model export requests it. Resolution and evaluation failures reject the returned promise.
 *
 * @evidence contracts/common.md#principled-implementation The SDK's declared require export and its corresponding types supply one nominal Document/property-graph identity in this CommonJS package and its CommonJS test consumer. The SDK performs all model serialization.
 * @evidence contracts/common.md#clear-and-simple-design The existing exportModelToGLB caller awaits this single deferred import; the helper adds no serializer, adapter or public package entry. Its module contains only this function, so importing the function does not eagerly load the SDK.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The ordinary SDK package require selects its supported export condition without casts, patched foreign methods or a copied SDK implementation. A promise callback defers loading and converts synchronous load failures to rejection.
 * @evidence contracts/common.md#meaningful-documentation Documents deferred loading of the SDK's supported CommonJS export, failure rejection and the absence of model or visual admission.
 * @evidence contracts/performance.md#efficient-algorithms The helper adds fixed call overhead to Node's module resolution, dependency loading and evaluation work; package graph size and runtime module caching determine that cost rather than model vertex count.
 * @evidence contracts/performance.md#reuse-equivalent-work Node's module loader shares the resolved SDK module and its dependencies; the helper creates no separate namespace, model-byte or serialization-result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The original pending import promise retains loader work until settlement, and the runtime module cache retains the loaded SDK. This helper acquires no output file, model buffer or host capture resource and adds no timeout or cancellation.
 */
export function loadModelGltfCore(): Promise<
  typeof import("@gltf-transform/core")
> {
  return Promise.resolve().then((): typeof import("@gltf-transform/core") =>
    require("@gltf-transform/core"),
  );
}
