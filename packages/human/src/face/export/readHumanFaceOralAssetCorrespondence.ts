import type { Primitive } from "@gltf-transform/core";
import typia from "typia";

import { readHumanStaticPartCorrespondence } from "../../common/export/readHumanStaticPartCorrespondence";
import { isHumanFaceOralSourceSha256 } from "../anatomy/oral/isHumanFaceOralSourceSha256";
import type { IAutoMovieHumanFaceOralAssetCorrespondence } from "./IAutoMovieHumanFaceOralAssetCorrespondence";
import type { IAutoMovieHumanFaceOralExportQualification } from "./IAutoMovieHumanFaceOralExportQualification";

/**
 * Read coarse oral qualification on the actual reimported static primitive.
 * Namespace absence is an unqualified legacy asset, not reconstructed source
 * authority. Present metadata must match every actual oral source member in
 * original interval order. This certifies correspondence, not source
 * authenticity, editable parameters or clinically valid anatomy.
 * @evidence contracts/common.md#principled-implementation Typed namespace admission and exact ordered member identity reuse actual Float32 accessor intervals from the common owner.
 * @evidence contracts/common.md#clear-and-simple-design One readback owner distinguishes absent qualification from malformed presence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A static shape or material never supplies a clinical certificate or editable numerical document.
 * @evidence contracts/common.md#meaningful-documentation States legacy absence and separate source/clinical authority.
 * @author Samchon
 */
export function readHumanFaceOralAssetCorrespondence(
  primitive: Primitive,
): IAutoMovieHumanFaceOralAssetCorrespondence | undefined {
  const extras = primitive.getExtras();
  if (!Object.hasOwn(extras, "automovieOralQualification")) return undefined;
  const qualification =
    typia.assertEquals<IAutoMovieHumanFaceOralExportQualification>(
      extras.automovieOralQualification,
    );
  const geometry = readHumanStaticPartCorrespondence(primitive);
  const ids = geometry?.parts
    .filter(
      (part) =>
        /^(face:)?oral:/.test(part.id) ||
        qualification.tonguePartIds.includes(part.id),
    )
    .map((part) => part.id);
  if (
    geometry === undefined ||
    ids === undefined ||
    ids.length === 0 ||
    qualification.parts.length !== ids.length ||
    qualification.parts.some((part, at) => part.id !== ids[at]) ||
    qualification.generation.trim() === "" ||
    !isHumanFaceOralSourceSha256(qualification.dentalNativeSha256) ||
    qualification.sourceSha256.length === 0 ||
    qualification.sourceSha256.some(
      (hash) => !isHumanFaceOralSourceSha256(hash),
    ) ||
    qualification.clinicalGaps.length === 0 ||
    qualification.clinicalGaps.some((gap) => gap.trim() === "") ||
    qualification.tonguePartIds.length === 0 ||
    new Set(qualification.tonguePartIds).size !==
      qualification.tonguePartIds.length ||
    qualification.tonguePartIds.some((id) => id.trim() === "")
  )
    throw new Error(
      "Oral qualification must match actual source members, canonical provenance and explicit clinical gaps.",
    );
  return { geometry, qualification: structuredClone(qualification) };
}
