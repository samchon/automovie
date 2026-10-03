import type { IAutoMovieModel } from "@automovie/interface";
import { type JSONDocument, WebIO } from "@gltf-transform/core";

import { createGltfDocument } from "../../common/export/createGltfDocument";
import { gltfMaterialExtensions } from "../../common/export/gltfMaterialExtensions";

/**
 * Serialize a built person to GLB and glTF with resident resources.
 *
 * A person is a static resident model, posed and skinned already, so it takes
 * the shared static exporter unchanged: parts grouped by material, Float32
 * topology validated at the output boundary, optical materials carried as
 * glTF extensions. No skeleton or skin binding is written; a consumer that
 * wants another pose replays the document through the builder. The document
 * and the writer stay in one module instance, as the face's and the body's
 * do, because glTF-Transform relies on class identity.
 *
 * @evidence contracts/common.md#principled-implementation The person's model has no bone binding, which is the precondition of the shared exporter, so reusing it is exact rather than approximate.
 * @evidence contracts/common.md#clear-and-simple-design Build the document, write both containers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is patched; unsupported resources refuse in the shared exporter.
 * @evidence contracts/common.md#meaningful-documentation The comment states why no rig is written and why one module instance is kept.
 */
export async function exportHumanPerson(model: IAutoMovieModel): Promise<{
  glb: Uint8Array<ArrayBuffer>;
  gltf: JSONDocument;
}> {
  const document = createGltfDocument(model);
  const writer = new WebIO().registerExtensions(gltfMaterialExtensions);
  const glb = await writer.writeBinary(document);
  const gltf = await writer.writeJSON(document);
  return { glb, gltf };
}
