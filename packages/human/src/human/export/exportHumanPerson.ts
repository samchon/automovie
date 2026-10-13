import type { IAutoMovieModel } from "@automovie/interface";
import { WebIO } from "@gltf-transform/core";

import type { IAutoMovieHumanBodyAssemblyQualification } from "../../body/export/IAutoMovieHumanBodyAssemblyQualification";
import type { IAutoMovieHumanBodyAtlasQualification } from "../../body/export/IAutoMovieHumanBodyAtlasQualification";
import { writeHumanBodyAssemblyQualification } from "../../body/export/writeHumanBodyAssemblyQualification";
import { writeHumanBodyAtlasQualification } from "../../body/export/writeHumanBodyAtlasQualification";
import type { IAutoMovieHumanGltfExport } from "../../common/export/IAutoMovieHumanGltfExport";
import { createGltfDocument } from "../../common/export/createGltfDocument";
import { gltfMaterialExtensions } from "../../common/export/gltfMaterialExtensions";
import type { IAutoMovieHumanFaceOralExportQualification } from "../../face/export/IAutoMovieHumanFaceOralExportQualification";
import { writeHumanFaceOralExportQualification } from "../../face/export/writeHumanFaceOralExportQualification";

/**
 * Serialize a built person to GLB and glTF with resident resources.
 *
 * The existing static geometry owner validates resident and actual Float32 topology, preserves exact material/TRS grouping, supported resident textures and optical extensions, and emits no editable skeleton/skin binding. Another pose requires document replay. The writer shares this glTF-Transform module instance's Document; consumers still own image decoding and support for required optical extensions.
 *
 * Actual body atlas, coarse anatomical/native-subcutaneous and generated oral members require their supplied owner qualifications. Any supplied qualification opts into generic source-part intervals, then dedicated adapters join exact member receipts under existing body/face prefixes before serialization. Physical source correspondence remains an independent namespace. Metadata preserves rights/registration and explicit clinical gaps rather than certifying authentic acquisition, patient anatomy or current rendered appearance.
 *
 * Inputs remain unchanged. Metadata adapters may mutate the export-local Document before refusing; failure discards this local result rather than publishing partial bytes. Returned binary and resource-bearing JSON are owned by the caller. This function serializes resident data without writing a filesystem file or restoring a raw source asset.
 *
 * @evidence contracts/common.md#principled-implementation Actual member populations require their explicit qualification owners, then the shared static geometry/Float32 exporter and same-instance writer carry exact intervals, physical lineage and required optical metadata into both portable containers.
 * @evidence contracts/common.md#clear-and-simple-design This facade owns qualification presence/order and serialization; geometry packing and atlas/assembly/oral exact joins remain dedicated shared owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing member qualification refuses instead of inferred anatomy from names, and metadata/publication validity is not claimed clinical source authenticity or current GPU proof.
 * @evidence contracts/common.md#meaningful-documentation Prose states static metre geometry, independent identity namespaces, module-instance constraint, output ownership and failure-local Document mutation.
 * @evidence contracts/performance.md#efficient-algorithms Presence checks scan P parts; preparation pays actual material/group/mesh/image/topology costs, qualification adapters pay member/accessor checks, and binary plus JSON writing each traverses actual Document/resource populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Both containers share one prepared/qualified Document and registered extension set; resident texture reuse remains with the geometry owner and exports are not cached across mutable models.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Document/writer and preparation maps are call-local until async writes finish; returned buffers/JSON retain resources by caller choice, with no ongoing source fetch, file handle or exporter cache.
 */
export async function exportHumanPerson(
  model: IAutoMovieModel,
  atlas?: IAutoMovieHumanBodyAtlasQualification,
  assembly?: IAutoMovieHumanBodyAssemblyQualification,
  oral?: IAutoMovieHumanFaceOralExportQualification,
): Promise<IAutoMovieHumanGltfExport> {
  if (assembly?.nativeSubcutaneous === undefined &&
      model.parts.some((part: IAutoMovieModel["parts"][number]): boolean => part.id.startsWith("body:native-subcutaneous:")))
    throw new Error("Person native subcutaneous export needs its actual field/exterior/member qualification.");
  if (
    atlas === undefined &&
    model.parts.some((part: IAutoMovieModel["parts"][number]): boolean => /^body:anatomical-atlas:/.test(part.id))
  )
    throw new Error(
      "Person atlas inspection export needs its source rights and reference qualification.",
    );
  if (
    assembly === undefined &&
    model.parts.some((part: IAutoMovieModel["parts"][number]): boolean => /^body:anatomical-source:/.test(part.id))
  )
    throw new Error(
      "Person coarse anatomical export needs its source rights and shared registration qualification.",
    );
  if (
    oral === undefined &&
    model.parts.some((part: IAutoMovieModel["parts"][number]): boolean => /^face:oral:/.test(part.id))
  )
    throw new Error(
      "Person oral export needs its licensed source and clinical-gap qualification.",
    );
  const document: ReturnType<typeof createGltfDocument> = createGltfDocument(model, {
    sourcePartIdentity:
      atlas !== undefined || assembly !== undefined || oral !== undefined,
  });
  if (atlas !== undefined) writeHumanBodyAtlasQualification(document, atlas);
  if (assembly !== undefined)
    writeHumanBodyAssemblyQualification(document, assembly);
  if (oral !== undefined) writeHumanFaceOralExportQualification(document, oral);
  const writer: WebIO = new WebIO().registerExtensions(gltfMaterialExtensions);
  const glb: IAutoMovieHumanGltfExport["glb"] = await writer.writeBinary(document);
  const gltf: IAutoMovieHumanGltfExport["gltf"] = await writer.writeJSON(document);
  return { glb, gltf };
}
