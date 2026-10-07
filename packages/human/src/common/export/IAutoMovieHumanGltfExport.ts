import type { JSONDocument } from "@gltf-transform/core";

/**
 * One static human model written as glTF 2.0, in both container forms.
 *
 * `glb` is the binary container and `gltf` the JSON document with its
 * resources, both serialized from the same glTF-Transform document. Each is
 * owned by the caller.
 *
 * @evidence contracts/common.md#principled-implementation Both forms come from one serialized document, so they cannot describe different models.
 * @evidence contracts/common.md#clear-and-simple-design One named result replaces the exporter's anonymous return type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither form is post-edited after serialization.
 * @evidence contracts/common.md#meaningful-documentation States both container forms, their common source and ownership.
 * @author Samchon
 */
export interface IAutoMovieHumanGltfExport {
  /** Binary glTF container bytes. */
  glb: Uint8Array<ArrayBuffer>;

  /** JSON glTF document with its resources. */
  gltf: JSONDocument;
}
