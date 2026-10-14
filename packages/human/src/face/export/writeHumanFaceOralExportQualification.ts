import type { Document, Mesh, Primitive } from "@gltf-transform/core";
import typia from "typia";

import { readHumanStaticPartCorrespondence } from "../../common/export/readHumanStaticPartCorrespondence";
import { isHumanFaceOralSourceSha256 } from "../anatomy/oral/isHumanFaceOralSourceSha256";
import type { IAutoMovieHumanFaceOralExportQualification } from "./IAutoMovieHumanFaceOralExportQualification";
import { readHumanFaceOralAssetCorrespondence } from "./readHumanFaceOralAssetCorrespondence";
import type { IAutoMovieHumanFaceOralExportPartQualification as IAutoMovieHumanFaceOralExportPartQualificationImported, IAutoMovieHumanStaticPartInterval as IAutoMovieHumanStaticPartIntervalImported } from "../../index";


/**
 * Join coarse oral qualification to the same actual static source intervals.
 * Every generated oral member must be identified exactly once. Other source
 * members receive no oral claim, and neither colours nor shape similarity
 * supplies source identity. Typed qualification is metadata, not a substitute
 * for the writer's source interval, geometry and Float32 admission.
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Exact ids must cover every actual oral/tongue interval once before qualification follows per-primitive member order. Common accessor admission and oral readback bind output metadata, not source authenticity or clinical anatomy.
 * @evidence contracts/common.md#clear-and-simple-design Global coverage precedes primitive-local copies; canonical geometry and oral readers retain distinct admission rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/duplicate identity or invalid provenance refuses without appearance inference. Extras mutate in place; later readback failure can leave earlier metadata, requiring callers to discard the private failed export Document rather than claim rollback.
 * @evidence contracts/common.md#meaningful-documentation Prose separates source coverage from geometry/qualification authority; unrelated extras survive, non-oral members receive no claim and supplied Document mutation can be partial on failure.
 * @evidence contracts/performance.md#efficient-algorithms Global/per-primitive readers rescan actual accessors/indices; member/tongue searches and full-report clones per primitive add population-dependent work beyond metadata assignment.
 * @evidence contracts/performance.md#reuse-equivalent-work One source-id map serves all primitives and actual readback verifies installed extras; separate mutable Documents cannot share installed effects or cached acceptance.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Copies become Document-owned and local maps/member lists release; prior mutations remain on failure, with no opened file, retained task or native handle here.
 */
export function writeHumanFaceOralExportQualification(
  document: Document,
  input: IAutoMovieHumanFaceOralExportQualification,
): void {
  const report: IAutoMovieHumanFaceOralExportQualification =
    typia.assertEquals<IAutoMovieHumanFaceOralExportQualification>(input);
  if (
    report.generation.trim() === "" ||
    !isHumanFaceOralSourceSha256(report.dentalNativeSha256) ||
    report.sourceSha256.length === 0 ||
    report.sourceSha256.some((hash: string): boolean  => !isHumanFaceOralSourceSha256(hash)) ||
    report.clinicalGaps.length === 0 ||
    report.tonguePartIds.length === 0 ||
    new Set(report.tonguePartIds).size !== report.tonguePartIds.length ||
    report.tonguePartIds.some((id: string): boolean  => id.trim() === "")
  )
    throw new Error(
      "Oral static qualification needs canonical provenance and explicit clinical gaps.",
    );
  const records: Map<string, IAutoMovieHumanFaceOralExportPartQualificationImported> = new Map(report.parts.map((part: IAutoMovieHumanFaceOralExportPartQualificationImported): [string, IAutoMovieHumanFaceOralExportPartQualificationImported]  => [part.id, part]));
  const primitives: Primitive[] = document
    .getRoot()
    .listMeshes()
    .flatMap((mesh: Mesh): Primitive[] => mesh.listPrimitives());
  const actual: IAutoMovieHumanStaticPartIntervalImported[] = primitives
    .flatMap(
      (primitive: Primitive): IAutoMovieHumanStaticPartIntervalImported[]  => readHumanStaticPartCorrespondence(primitive)?.parts ?? [],
    )
    .filter(
      (part: IAutoMovieHumanStaticPartIntervalImported): boolean  =>
        /^(face:)?oral:/.test(part.id) ||
        report.tonguePartIds.includes(part.id),
    );
  if (
    records.size === 0 ||
    records.size !== report.parts.length ||
    actual.length !== records.size ||
    new Set(actual.map((part: IAutoMovieHumanStaticPartIntervalImported): string  => part.id)).size !== records.size ||
    actual.some((part: IAutoMovieHumanStaticPartIntervalImported): boolean  => !records.has(part.id)) ||
    report.tonguePartIds.some((id: string): boolean  => !records.has(id))
  )
    throw new Error(
      "Oral qualification must identify every actual generated oral source part exactly once.",
    );
  for (const primitive of primitives) {
    const parts: IAutoMovieHumanFaceOralExportPartQualificationImported[] =
      readHumanStaticPartCorrespondence(primitive)?.parts.flatMap((part: IAutoMovieHumanStaticPartIntervalImported): IAutoMovieHumanFaceOralExportPartQualificationImported[]  => {
        const record: IAutoMovieHumanFaceOralExportPartQualificationImported | undefined = records.get(part.id);
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
