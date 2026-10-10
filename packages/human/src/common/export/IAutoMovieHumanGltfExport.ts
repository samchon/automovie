import type { JSONDocument } from "@gltf-transform/core";

/**
 * One static human model written as glTF 2.0, in both container forms.
 *
 * `glb` is the binary container and `gltf` the JSON document with its
 * resources, both serialized from the same glTF-Transform document. Each is
 * owned by the caller.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanGltfExport {
  /** Binary glTF container bytes. */
  glb: Uint8Array<ArrayBuffer>;

  /** JSON glTF document with its resources. */
  gltf: JSONDocument;
}
