import type { IAutoMovieModel } from "@automovie/interface";
import { type JSONDocument, WebIO } from "@gltf-transform/core";

import { createGltfDocument } from "../../common/export/createGltfDocument";
import { gltfMaterialExtensions } from "../../common/export/gltfMaterialExtensions";

/**
 * Serialize an admitted static face to GLB and glTF with resident resources.
 * The package owns both document creation and its writer: glTF-Transform uses
 * class identity internally, so passing a Document between independently loaded
 * CommonJS and ES-module copies can silently discard its geometry. Returned
 * bytes and JSON have no such module-instance identity requirement.
 *
 * This applies the same static geometry, Float32 and optical-material admission
 * as createGltfDocument. It does not mutate the model, fetch resources or create
 * an animation. Consumers register the supported extensions when reading.
 */
export async function exportHumanFace(model: IAutoMovieModel): Promise<{
  glb: Uint8Array<ArrayBuffer>;
  gltf: JSONDocument;
}> {
  const document = createGltfDocument(model);
  const writer = new WebIO().registerExtensions(gltfMaterialExtensions);
  const glb = await writer.writeBinary(document);
  const gltf = await writer.writeJSON(document);
  return { glb, gltf };
}
