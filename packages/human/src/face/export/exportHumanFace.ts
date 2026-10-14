import type { IAutoMovieModel, IAutoMovieModelPart as IAutoMovieModelPartImported } from "@automovie/interface";
import { WebIO } from "@gltf-transform/core";

import type { IAutoMovieHumanGltfExport } from "../../common/export/IAutoMovieHumanGltfExport";
import { createGltfDocument } from "../../common/export/createGltfDocument";
import { gltfMaterialExtensions } from "../../common/export/gltfMaterialExtensions";
import type { IAutoMovieHumanFaceOralExportQualification } from "./IAutoMovieHumanFaceOralExportQualification";
import { writeHumanFaceOralExportQualification } from "./writeHumanFaceOralExportQualification";



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
 *
 * @evidence contracts/common.md#principled-implementation Shared static/model/Float32/optical admission creates a Document written by the same module's WebIO as binary and JSON; oral metadata binds actual intervals first. Portable results avoid Document class identity across module copies.
 * @evidence contracts/common.md#clear-and-simple-design Package-owned creation/writing composes common geometry/material and separate oral qualification, returning values instead of exposing a module-sensitive Document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unprefixed generated oral parts require qualification; unsupported resources/correspondence fail without fetching or fabricated source/clinical/visual proof. Readers must support the registered extensions.
 * @evidence contracts/common.md#meaningful-documentation Prose states static resident resources, same-module writer, immutable model, output admission and reader extension requirements.
 * @evidence contracts/performance.md#efficient-algorithms Full mesh/image preparation, grouping/topology and two output serializations dominate by geometry/resource/output sizes; the wrapper's small body does not make total export constant.
 * @evidence contracts/performance.md#reuse-equivalent-work Binary/JSON writes share one admitted Document and extension set; formats/effects differ and mutable exports are not cached across requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Document/writer/intermediates are local and both output resource populations transfer, so peak bytes include both formats. No external stream/GPU handle or export history is retained.
 */
export async function exportHumanFace(
  model: IAutoMovieModel,
  oral?: IAutoMovieHumanFaceOralExportQualification,
): Promise<IAutoMovieHumanGltfExport> {
  if (oral === undefined && model.parts.some((part: IAutoMovieModelPartImported): boolean  => /^oral:/.test(part.id)))
    throw new Error(
      "Generated oral static export needs its canonical source and clinical qualification.",
    );
  const document: ReturnType<typeof createGltfDocument> = createGltfDocument(model, {
    sourcePartIdentity: oral !== undefined,
  });
  if (oral !== undefined) writeHumanFaceOralExportQualification(document, oral);
  const writer: WebIO = new WebIO().registerExtensions(gltfMaterialExtensions);
  const glb: Awaited<ReturnType<WebIO["writeBinary"]>> = await writer.writeBinary(document);
  const gltf: Awaited<ReturnType<WebIO["writeJSON"]>> = await writer.writeJSON(document);
  return { glb, gltf };
}
