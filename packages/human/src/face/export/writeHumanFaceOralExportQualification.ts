import type { Document } from "@gltf-transform/core";
import typia from "typia";

import { readHumanStaticPartCorrespondence } from "../../common/export/readHumanStaticPartCorrespondence";
import { isHumanFaceOralSourceSha256 } from "../anatomy/oral/isHumanFaceOralSourceSha256";
import type { IAutoMovieHumanFaceOralExportQualification } from "./IAutoMovieHumanFaceOralExportQualification";
import { readHumanFaceOralAssetCorrespondence } from "./readHumanFaceOralAssetCorrespondence";

/**
 * Join coarse oral qualification to the same actual static source intervals.
 * Every generated oral member must be identified exactly once. Other source
 * members receive no oral claim, and neither colours nor shape similarity
 * supplies source identity. Typed qualification is metadata, not a substitute
 * for the writer's source interval, geometry and Float32 admission.
 * @evidence contracts/common.md#principled-implementation Bijective actual source-part identity joins one typed source receipt to the precise primitives emitted by the static writer.
 * @evidence contracts/common.md#clear-and-simple-design One Document adapter retains the writer's existing material grouping and geometry authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither a material label, coordinate match nor clinical guess supplies a qualification record.
 * @evidence contracts/common.md#meaningful-documentation States selected-source scope, static/editable separation and independent clinical qualification.
 * @author Samchon
 */
export function writeHumanFaceOralExportQualification(
  document: Document,
  input: IAutoMovieHumanFaceOralExportQualification,
): void {
  const report =
    typia.assertEquals<IAutoMovieHumanFaceOralExportQualification>(input);
  if (
    report.generation.trim() === "" ||
    !isHumanFaceOralSourceSha256(report.dentalNativeSha256) ||
    report.sourceSha256.length === 0 ||
    report.sourceSha256.some((hash) => !isHumanFaceOralSourceSha256(hash)) ||
    report.clinicalGaps.length === 0 ||
    report.tonguePartIds.length === 0 ||
    new Set(report.tonguePartIds).size !== report.tonguePartIds.length ||
    report.tonguePartIds.some((id) => id.trim() === "")
  )
    throw new Error(
      "Oral static qualification needs canonical provenance and explicit clinical gaps.",
    );
  const records = new Map(report.parts.map((part) => [part.id, part]));
  const primitives = document
    .getRoot()
    .listMeshes()
    .flatMap((mesh) => mesh.listPrimitives());
  const actual = primitives
    .flatMap(
      (primitive) => readHumanStaticPartCorrespondence(primitive)?.parts ?? [],
    )
    .filter(
      (part) =>
        /^(face:)?oral:/.test(part.id) ||
        report.tonguePartIds.includes(part.id),
    );
  if (
    records.size === 0 ||
    records.size !== report.parts.length ||
    actual.length !== records.size ||
    new Set(actual.map((part) => part.id)).size !== records.size ||
    actual.some((part) => !records.has(part.id)) ||
    report.tonguePartIds.some((id) => !records.has(id))
  )
    throw new Error(
      "Oral qualification must identify every actual generated oral source part exactly once.",
    );
  for (const primitive of primitives) {
    const parts =
      readHumanStaticPartCorrespondence(primitive)?.parts.flatMap((part) => {
        const record = records.get(part.id);
        return record === undefined ? [] : [structuredClone(record)];
      }) ?? [];
    if (parts.length === 0) continue;
    const qualification: IAutoMovieHumanFaceOralExportQualification = {
      ...structuredClone(report),
      parts,
    };
    primitive.setExtras({
      ...primitive.getExtras(),
      automovieOralQualification: qualification,
    });
    readHumanFaceOralAssetCorrespondence(primitive);
  }
}
