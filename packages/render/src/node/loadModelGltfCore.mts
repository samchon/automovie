/**
 * Load the installed glTF SDK through an explicit ES module boundary only when a model export requests it. Import failures reject the original loader promise.
 *
 * @evidence contracts/common.md#principled-implementation This ES module resolves the SDK's import entry and declaration graph together, keeping its nominal Document and property-graph classes coherent when the calling exporter is checked from CommonJS or NodeNext. The SDK performs all model serialization.
 * @evidence contracts/common.md#clear-and-simple-design The existing exportModelToGLB caller awaits this single deferred import; the helper adds no serializer, adapter or public package entry. Its module contains only this function, so importing the function does not eagerly load the SDK.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The ordinary SDK package import selects its declared export condition without casts, an any-typed specifier, patched foreign methods or a copied SDK implementation. The original import promise is returned directly.
 * @evidence contracts/common.md#meaningful-documentation Documents deferred loading, the module-format boundary, the original rejection path and the absence of model or visual admission. Callers need a runtime supporting the published CommonJS entry's ES module interop.
 * @evidence contracts/performance.md#efficient-algorithms The helper adds fixed call overhead to Node's module resolution, dependency loading and evaluation work; package graph size and runtime module caching determine that cost rather than model vertex count.
 * @evidence contracts/performance.md#reuse-equivalent-work Node's module loader shares the resolved SDK module and its dependencies; the helper creates no separate namespace, model-byte or serialization-result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The original pending import promise retains loader work until settlement, and the runtime module cache retains the loaded SDK. This helper acquires no output file, model buffer or host capture resource and adds no timeout or cancellation.
 * @author Samchon
 */
export function loadModelGltfCore(): Promise<typeof import("@gltf-transform/core")> {
  return import("@gltf-transform/core");
}
