/**
 * Load the installed glTF SDK through a native dynamic import only when a model export requests it. Import failures reject the original loader promise.
 *
 * @evidence contracts/common.md#principled-implementation NodeNext preserves the native dynamic import in this CommonJS package, while the explicit import resolution mode selects the same SDK declaration graph and keeps its nominal Document and property-graph classes coherent with the exporter. The SDK performs all model serialization.
 * @evidence contracts/common.md#clear-and-simple-design The existing exportModelToGLB caller awaits this single deferred import; the helper adds no serializer, adapter or public package entry. Its module contains only this function, so importing the function does not eagerly load the SDK.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The ordinary SDK package import selects its declared export condition without casts, an any-typed specifier, patched foreign methods or a copied SDK implementation. The original import promise is returned directly.
 * @evidence contracts/common.md#meaningful-documentation Documents deferred loading, preserved native dynamic import, the original rejection path and the absence of model or visual admission. The published CommonJS entry uses Node's native import operation to load the SDK's ES module.
 * @evidence contracts/performance.md#efficient-algorithms The helper adds fixed call overhead to Node's module resolution, dependency loading and evaluation work; package graph size and runtime module caching determine that cost rather than model vertex count.
 * @evidence contracts/performance.md#reuse-equivalent-work Node's module loader shares the resolved SDK module and its dependencies; the helper creates no separate namespace, model-byte or serialization-result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The original pending import promise retains loader work until settlement, and the runtime module cache retains the loaded SDK. This helper acquires no output file, model buffer or host capture resource and adds no timeout or cancellation.
 * @author Samchon
 */
export function loadModelGltfCore(): Promise<typeof import("@gltf-transform/core", { with: { "resolution-mode": "import" } })> {
  return import("@gltf-transform/core");
}
