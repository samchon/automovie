import type { IAutoMovieModel } from "@automovie/interface";
import { WebIO } from "@gltf-transform/core";
import typia from "typia";

import type { IAutoMovieHumanExportOptions } from "../../common/export/IAutoMovieHumanExportOptions";
import type { IAutoMovieHumanGltfExport } from "../../common/export/IAutoMovieHumanGltfExport";
import { createGltfDocument } from "../../common/export/createGltfDocument";
import { gltfMaterialExtensions } from "../../common/export/gltfMaterialExtensions";
import { readHumanStaticPartCorrespondence } from "../../common/export/readHumanStaticPartCorrespondence";
import type { IAutoMovieHumanBodyAnatomicalInspection } from "../anatomy/generated/IAutoMovieHumanBodyAnatomicalInspection";
import type { IAutoMovieHumanBodyArticularQualification } from "./IAutoMovieHumanBodyArticularQualification";
import type { IAutoMovieHumanBodyAssemblyQualification } from "./IAutoMovieHumanBodyAssemblyQualification";
import type { IAutoMovieHumanBodyAtlasQualification } from "./IAutoMovieHumanBodyAtlasQualification";
import { readHumanBodyArticularAssetCorrespondence } from "./readHumanBodyArticularAssetCorrespondence";
import { writeHumanBodyAssemblyQualification } from "./writeHumanBodyAssemblyQualification";
import { writeHumanBodyAtlasQualification } from "./writeHumanBodyAtlasQualification";

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
 * An optional inspection enables source identity in that same construction and
 * joins candidate-only qualification before writing. The report supplies
 * reference provenance, never a clinical certificate or editable document.
 * Every actual source ID must match exactly one reported candidate. Omitting
 * the report leaves articular qualification absent. Source-part identity also
 * stays absent unless requested separately; supplied physical correspondence
 * is independently preserved by the standard writer, including this call.
 * A separate exact third option can request source-part identity without an
 * articular report, for a source-conditioned exterior. Only true opts in;
 * omitted, undefined and false preserve source-part namespace absence. Legacy
 * models without physical correspondence retain their default bytes. An articular report
 * always requires its source mapping, regardless of that independent option.
 * A separate fourth atlas report retains acquired source rights, exact
 * reference registration and unavailable personal anatomy in the
 * `automovieAtlasInspection` namespace. Its selected source IDs must join
 * actual primitive members; ordinary skin receives no atlas qualification.
 * A fifth coarse-assembly report carries acquired or authored tissue member
 * rights and shared registration under `automovieAnatomicalAssembly` through
 * those same actual intervals. Its clinical state remains unavailable.
 */
export async function exportHumanBody(
  model: IAutoMovieModel,
  inspection?: IAutoMovieHumanBodyAnatomicalInspection,
  options?: IAutoMovieHumanExportOptions,
  atlas?: IAutoMovieHumanBodyAtlasQualification,
  assembly?: IAutoMovieHumanBodyAssemblyQualification,
): Promise<IAutoMovieHumanGltfExport> {
  if (assembly?.nativeSubcutaneous === undefined &&
      model.parts.some((part) => part.id.startsWith("native-subcutaneous:")))
    throw new Error("Native subcutaneous export needs its actual field/exterior/member qualification.");
  if (
    atlas === undefined &&
    model.parts.some((part) => /^anatomical-atlas:/.test(part.id))
  )
    throw new Error(
      "Atlas inspection export needs its source rights and reference qualification.",
    );
  if (
    assembly === undefined &&
    model.parts.some((part) => /^anatomical-source:/.test(part.id))
  )
    throw new Error(
      "Coarse anatomical export needs its source rights and shared registration qualification.",
    );
  const report =
    inspection === undefined
      ? undefined
      : typia.assertEquals<IAutoMovieHumanBodyAnatomicalInspection>(inspection);
  const admitted =
    options === undefined
      ? undefined
      : typia.assertEquals<IAutoMovieHumanExportOptions>(options);
  const document = createGltfDocument(model, {
    sourcePartIdentity:
      report !== undefined ||
      atlas !== undefined ||
      assembly !== undefined ||
      admitted?.sourcePartIdentity === true,
  });
  if (report !== undefined) {
    if (
      report.generatorRevision !== "articular-head-inspection/1" ||
      report.reference.basis.trim() === "" ||
      report.candidates.length === 0
    )
      throw new Error(
        "Unsupported or empty articular inspection qualification.",
      );
    const candidates = new Map(
      report.candidates.map((candidate) => [
        candidate.part + "/head-candidate",
        candidate,
      ]),
    );
    const actual = document
      .getRoot()
      .listMeshes()
      .flatMap((mesh) => mesh.listPrimitives());
    const ids = actual.flatMap((primitive) =>
      readHumanStaticPartCorrespondence(primitive)!.parts.map(
        (part) => part.id,
      ),
    );
    if (
      candidates.size !== report.candidates.length ||
      ids.length !== candidates.size ||
      ids.some((id) => !candidates.has(id))
    )
      throw new Error(
        "Articular report must match every actual source candidate exactly once.",
      );
    for (const primitive of actual) {
      const mapping = readHumanStaticPartCorrespondence(primitive)!;
      const qualification: IAutoMovieHumanBodyArticularQualification = {
        version: 1,
        generatorRevision: "articular-head-inspection/1",
        reference: { ...report.reference },
        skin: { ...report.skin },
        parts: mapping.parts.map((part) => {
          const candidate = candidates.get(part.id)!;
          return {
            id: `${candidate.part}/head-candidate`,
            source: candidate.source,
            registration: candidate.registration,
            partResolution: { ...candidate.partResolution },
          };
        }),
      };
      primitive.setExtras({
        ...primitive.getExtras(),
        automovieArticularInspection: qualification,
      });
      readHumanBodyArticularAssetCorrespondence(primitive);
    }
  }
  if (atlas !== undefined) writeHumanBodyAtlasQualification(document, atlas);
  if (assembly !== undefined)
    writeHumanBodyAssemblyQualification(document, assembly);
  const writer = new WebIO().registerExtensions(gltfMaterialExtensions);
  const glb = await writer.writeBinary(document);
  const gltf = await writer.writeJSON(document);
  return { glb, gltf };
}
