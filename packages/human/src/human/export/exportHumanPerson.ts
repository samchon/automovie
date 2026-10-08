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
 * A person is a static resident model, posed and skinned already, so it takes
 * the shared static exporter unchanged: parts grouped by material, Float32
 * topology validated at the output boundary, optical materials carried as
 * glTF extensions. No skeleton or skin binding is written; a consumer that
 * wants another pose replays the document through the builder. The document
 * and the writer stay in one module instance, as the face's and the body's
 * do, because glTF-Transform relies on class identity.
 * An optional atlas report opts into generic source-part correspondence and
 * joins acquired body atlas receipts under their actual `body:` source IDs.
 * It preserves reference-only registration and unavailable personal anatomy;
 * omission keeps both optional namespaces absent.
 * A separate coarse anatomical assembly report joins source tissue members
 * under their actual `body:anatomical-source:` IDs, retaining original rights,
 * authored registration and unavailable clinical resolution in the same
 * writer Document. Neither qualification is inferred from a material name.
 * Optional oral qualification joins actual `face:oral:` source intervals in
 * that same Document, preserving licensed/native source digests and the oral
 * owner's explicit clinical gaps.
 *
 * @evidence contracts/common.md#principled-implementation The person's model has no bone binding, which is the precondition of the shared exporter, so reusing it is exact rather than approximate.
 * @evidence contracts/common.md#clear-and-simple-design Build the document, write both containers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is patched; unsupported resources refuse in the shared exporter.
 * @evidence contracts/common.md#meaningful-documentation The comment states why no rig is written and why one module instance is kept.
 */
export async function exportHumanPerson(
  model: IAutoMovieModel,
  atlas?: IAutoMovieHumanBodyAtlasQualification,
  assembly?: IAutoMovieHumanBodyAssemblyQualification,
  oral?: IAutoMovieHumanFaceOralExportQualification,
): Promise<IAutoMovieHumanGltfExport> {
  if (assembly?.nativeSubcutaneous === undefined &&
      model.parts.some((part) => part.id.startsWith("body:native-subcutaneous:")))
    throw new Error("Person native subcutaneous export needs its actual field/exterior/member qualification.");
  if (
    atlas === undefined &&
    model.parts.some((part) => /^body:anatomical-atlas:/.test(part.id))
  )
    throw new Error(
      "Person atlas inspection export needs its source rights and reference qualification.",
    );
  if (
    assembly === undefined &&
    model.parts.some((part) => /^body:anatomical-source:/.test(part.id))
  )
    throw new Error(
      "Person coarse anatomical export needs its source rights and shared registration qualification.",
    );
  if (
    oral === undefined &&
    model.parts.some((part) => /^face:oral:/.test(part.id))
  )
    throw new Error(
      "Person oral export needs its licensed source and clinical-gap qualification.",
    );
  const document = createGltfDocument(model, {
    sourcePartIdentity:
      atlas !== undefined || assembly !== undefined || oral !== undefined,
  });
  if (atlas !== undefined) writeHumanBodyAtlasQualification(document, atlas);
  if (assembly !== undefined)
    writeHumanBodyAssemblyQualification(document, assembly);
  if (oral !== undefined) writeHumanFaceOralExportQualification(document, oral);
  const writer = new WebIO().registerExtensions(gltfMaterialExtensions);
  const glb = await writer.writeBinary(document);
  const gltf = await writer.writeJSON(document);
  return { glb, gltf };
}
