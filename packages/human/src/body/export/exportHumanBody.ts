import type { IAutoMovieModel } from "@automovie/interface";
import { type JSONDocument, WebIO } from "@gltf-transform/core";

import { portraitDocument } from "../../face/export/portraitDocument";
import { portraitGltfExtensions } from "../../face/export/portraitGltfExtensions";

/**
 * Serialize a built body to GLB and glTF with resident resources.
 *
 * A body build is a static resident model, skinned already, so it takes the
 * face's static exporter unchanged: parts grouped by material, Float32
 * topology validated at the output boundary, optical materials carried as
 * glTF extensions. No skeleton or skin binding is written; the posed surface
 * is what the document evaluated to, and a consumer that wants another pose
 * replays the document through the builder rather than animating the file.
 * The package keeps document creation and the writer in one module instance
 * for the same reason the face does: glTF-Transform relies on class identity.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-export Delivers the evaluated posed body as portable GLB and glTF with no rig, the document remaining the source of another pose.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-export Writes the static surface through the shared Float32 exporter, document and writer in one module instance.
 */
export async function exportHumanBody(model: IAutoMovieModel): Promise<{
  glb: Uint8Array<ArrayBuffer>;
  gltf: JSONDocument;
}> {
  const document = portraitDocument(model);
  const writer = new WebIO().registerExtensions(portraitGltfExtensions);
  const glb = await writer.writeBinary(document);
  const gltf = await writer.writeJSON(document);
  return { glb, gltf };
}
