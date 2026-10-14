import type { JSONDocument } from "@gltf-transform/core";

/**
 * One static human model written as glTF 2.0, in both container forms.
 *
 * `glb` is the binary container and `gltf` the JSON document with its
 * resources, both serialized from the same glTF-Transform document. Each is
 * owned by the caller.
 *
 *
 * @evidence contracts/common.md#principled-implementation Pairs binary GLB and resource-bearing JSON serialized from the same glTF-Transform document, giving callers both standard container forms.
 * @evidence contracts/common.md#clear-and-simple-design The result exposes portable bytes and JSON rather than a module-instance-dependent Document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The container pair carries no inferred anatomy, new pose or geometry qualification.
 * @evidence contracts/common.md#meaningful-documentation Documents the common serialization source and caller ownership of both representations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This output type chooses no writing algorithm; body, face and person exporters own WebIO serialization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The two output fields define a result, not reuse across requests or retained writer instances.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned arrays/JSON belong to the caller; this interface opens no IO handle or running task.
 *
 *
 * @author Samchon
 */
export interface IAutoMovieHumanGltfExport {
  /** Binary glTF container bytes. */
  glb: Uint8Array<ArrayBuffer>;

  /** JSON glTF document with its resources. */
  gltf: JSONDocument;
}
