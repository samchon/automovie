import type { Primitive } from "@gltf-transform/core";
import typia from "typia";

import { readHumanStaticPartCorrespondence } from "../../common/export/readHumanStaticPartCorrespondence";
import { isHumanFaceOralSourceSha256 } from "../anatomy/oral/isHumanFaceOralSourceSha256";
import type { IAutoMovieHumanFaceOralAssetCorrespondence } from "./IAutoMovieHumanFaceOralAssetCorrespondence";
import type { IAutoMovieHumanFaceOralExportQualification } from "./IAutoMovieHumanFaceOralExportQualification";
import type { IAutoMovieHumanStaticPartCorrespondence as IAutoMovieHumanStaticPartCorrespondenceImported, IAutoMovieHumanStaticPartInterval as IAutoMovieHumanStaticPartIntervalImported, IAutoMovieHumanFaceOralExportPartQualification as IAutoMovieHumanFaceOralExportPartQualificationImported } from "../../index";


/**
 * Read coarse oral qualification on the actual reimported static primitive.
 * Namespace absence is an unqualified legacy asset, not reconstructed source
 * authority. Present metadata must match every actual oral source member in
 * original interval order. This certifies correspondence, not source
 * authenticity, editable parameters or clinically valid anatomy.
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Exact qualification schema and common primitive interval admission bind ordered actual oral/tongue members. Generation/gaps/hash syntax qualify metadata, not recomputed original authenticity, editable parameters or anatomy.
 * @evidence contracts/common.md#clear-and-simple-design Common geometry owns accessor binding; this reader owns the independent oral namespace and returns cloned records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent namespace remains unqualified legacy data; malformed/order/population/provenance metadata refuses without inferring authority from appearance.
 * @evidence contracts/common.md#meaningful-documentation Prose gives actual reimported primitive, ordered members, absent legacy state and correspondence/source/editable/clinical limits.
 * @evidence contracts/performance.md#efficient-algorithms Common admission scans attributes/intervals/indices; P members test K tongue ids, then ids and hash/gap strings scan and metadata clones. No geometry solve occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work Writer/body consumers share common interval admission and source owners share digest grammar; mutable extras/accessors are read afresh without cached acceptance.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Geometry/qualification clones transfer, local id arrays/sets release, and no source asset, IO handle or async task is acquired.
 */
export function readHumanFaceOralAssetCorrespondence(
  primitive: Primitive,
): IAutoMovieHumanFaceOralAssetCorrespondence | undefined {
  const extras: Record<string, unknown> = primitive.getExtras();
  if (!Object.hasOwn(extras, "automovieOralQualification")) return undefined;
  const qualification: IAutoMovieHumanFaceOralExportQualification =
    typia.assertEquals<IAutoMovieHumanFaceOralExportQualification>(
      extras.automovieOralQualification,
    );
  const geometry: IAutoMovieHumanStaticPartCorrespondenceImported | undefined = readHumanStaticPartCorrespondence(primitive);
  const ids: string[] | undefined = geometry?.parts
    .filter(
      (part: IAutoMovieHumanStaticPartIntervalImported): boolean  =>
        /^(face:)?oral:/.test(part.id) ||
        qualification.tonguePartIds.includes(part.id),
    )
    .map((part: IAutoMovieHumanStaticPartIntervalImported): string  => part.id);
  if (
    geometry === undefined ||
    ids === undefined ||
    ids.length === 0 ||
    qualification.parts.length !== ids.length ||
    qualification.parts.some((part: IAutoMovieHumanFaceOralExportPartQualificationImported, at: number): boolean  => part.id !== ids[at]) ||
    qualification.generation.trim() === "" ||
    !isHumanFaceOralSourceSha256(qualification.dentalNativeSha256) ||
    qualification.sourceSha256.length === 0 ||
    qualification.sourceSha256.some(
      (hash: string): boolean  => !isHumanFaceOralSourceSha256(hash),
    ) ||
    qualification.clinicalGaps.length === 0 ||
    qualification.clinicalGaps.some((gap: string): boolean  => gap.trim() === "") ||
    qualification.tonguePartIds.length === 0 ||
    new Set(qualification.tonguePartIds).size !==
      qualification.tonguePartIds.length ||
    qualification.tonguePartIds.some((id: string): boolean  => id.trim() === "")
  )
    throw new Error(
      "Oral qualification must match actual source members, canonical provenance and explicit clinical gaps.",
    );
  return { geometry, qualification: structuredClone(qualification) };
}
