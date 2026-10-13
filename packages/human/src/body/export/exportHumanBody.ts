import type { IAutoMovieModel } from "@automovie/interface";
import { WebIO, type Mesh, type Primitive } from "@gltf-transform/core";
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
 * The shared static exporter packs the already posed model into material/TRS groups, checks actual Float32 output topology and carries supported optical extensions. The asset contains no skeleton or skin binding; another pose requires document replay. Document creation and WebIO serialization use the same glTF-Transform module instance because the library relies on class identity. Detail normals/overlays and other unsupported channels retain the shared exporter's limits.
 *
 * Optional articular inspection requires every actual source member to match one reported head candidate and carries reference-only qualification. The exact third options record requests source-part identity only when true; articular, atlas or assembly reports also require it. Supplied physical correspondence is independently preserved by the standard writer. Omitting these options/reports retains optional namespace absence for legacy models.
 *
 * Atlas and coarse/native assembly reports join actual source members through their respective writers, retaining acquisition rights, source registration and unavailable personal/clinical anatomy. A model carrying atlas, coarse anatomical or native-subcutaneous members requires its matching report. These metadata joins do not reconstruct editable documents or certify source authenticity. Source model and reports remain unchanged; the local Document and output buffers belong to this invocation and are discarded on failure.
 *
 * @evidence contracts/common.md#principled-implementation Shared static Float32/material export precedes exact candidate ID joining and separate atlas/assembly qualification writers, then one same-module WebIO writes resident GLB and glTF.
 * @evidence contracts/common.md#clear-and-simple-design This body boundary coordinates existing geometry, metadata and serialization owners instead of reimplementing topology, intervals or optical extension rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Required source reports, exact options/schema and complete candidate joins refuse invalid states; carried reference metadata cannot certify personal anatomy, clinical resolution or rendered acceptance.
 * @evidence contracts/common.md#meaningful-documentation The prose gives static replay semantics, supported channel limits, source/physical namespace independence, same-module identity and local output ownership.
 * @evidence contracts/performance.md#efficient-algorithms Model/report scans and candidate maps scale with actual parts; generic preparation/topology and repeated metadata readers add their source-sized costs, then both GLB and glTF serialization traverse resident output.
 * @evidence contracts/performance.md#reuse-equivalent-work One prepared Document and one candidate ID map serve primitive qualification and both output encodings, sharing the established static/atlas/assembly readers and extension set.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The invocation holds its Document, writer and both returned encodings until serialization finishes; no source network/file handle or cross-export cache is acquired, and failures publish no partial asset.
 */
export async function exportHumanBody(
  model: IAutoMovieModel,
  inspection?: IAutoMovieHumanBodyAnatomicalInspection,
  options?: IAutoMovieHumanExportOptions,
  atlas?: IAutoMovieHumanBodyAtlasQualification,
  assembly?: IAutoMovieHumanBodyAssemblyQualification,
): Promise<IAutoMovieHumanGltfExport> {
  if (assembly?.nativeSubcutaneous === undefined &&
      model.parts.some((part: IAutoMovieModel["parts"][number]): boolean => part.id.startsWith("native-subcutaneous:")))
    throw new Error("Native subcutaneous export needs its actual field/exterior/member qualification.");
  if (
    atlas === undefined &&
    model.parts.some((part: IAutoMovieModel["parts"][number]): boolean => /^anatomical-atlas:/.test(part.id))
  )
    throw new Error(
      "Atlas inspection export needs its source rights and reference qualification.",
    );
  if (
    assembly === undefined &&
    model.parts.some((part: IAutoMovieModel["parts"][number]): boolean => /^anatomical-source:/.test(part.id))
  )
    throw new Error(
      "Coarse anatomical export needs its source rights and shared registration qualification.",
    );
  const report: IAutoMovieHumanBodyAnatomicalInspection | undefined =
    inspection === undefined
      ? undefined
      : typia.assertEquals<IAutoMovieHumanBodyAnatomicalInspection>(inspection);
  const admitted: IAutoMovieHumanExportOptions | undefined =
    options === undefined
      ? undefined
      : typia.assertEquals<IAutoMovieHumanExportOptions>(options);
  const document: ReturnType<typeof createGltfDocument> = createGltfDocument(model, {
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
    const candidates: Map<string, typeof report.candidates[number]> = new Map(
      report.candidates.map((candidate: typeof report.candidates[number]): [string, typeof candidate] => [
        candidate.part + "/head-candidate",
        candidate,
      ]),
    );
    const actual: Primitive[] = document
      .getRoot()
      .listMeshes()
      .flatMap((mesh: Mesh): Primitive[] => mesh.listPrimitives());
    const ids: string[] = actual.flatMap((primitive: Primitive): string[] =>
      readHumanStaticPartCorrespondence(primitive)!.parts.map(
        (part: NonNullable<ReturnType<typeof readHumanStaticPartCorrespondence>>["parts"][number]): string => part.id,
      ),
    );
    if (
      candidates.size !== report.candidates.length ||
      ids.length !== candidates.size ||
      ids.some((id: string): boolean => !candidates.has(id))
    )
      throw new Error(
        "Articular report must match every actual source candidate exactly once.",
      );
    for (const primitive of actual) {
      const mapping: NonNullable<ReturnType<typeof readHumanStaticPartCorrespondence>> = readHumanStaticPartCorrespondence(primitive)!;
      const qualification: IAutoMovieHumanBodyArticularQualification = {
        version: 1,
        generatorRevision: "articular-head-inspection/1",
        reference: { ...report.reference },
        skin: { ...report.skin },
        parts: mapping.parts.map((part: typeof mapping.parts[number]): IAutoMovieHumanBodyArticularQualification["parts"][number] => {
          const candidate: typeof report.candidates[number] = candidates.get(part.id)!;
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
  const writer: WebIO = new WebIO().registerExtensions(gltfMaterialExtensions);
  const glb: Awaited<ReturnType<WebIO["writeBinary"]>> = await writer.writeBinary(document);
  const gltf: Awaited<ReturnType<WebIO["writeJSON"]>> = await writer.writeJSON(document);
  return { glb, gltf };
}
