import type { Primitive } from "@gltf-transform/core";
import typia from "typia";

import { readHumanStaticPartCorrespondence } from "../../common/export/readHumanStaticPartCorrespondence";
import { isHumanBodyAtlasSourceRecorded } from "../anatomy/atlas/isHumanBodyAtlasSourceRecorded";
import type { IAutoMovieHumanBodyAtlasAssetCorrespondence } from "./IAutoMovieHumanBodyAtlasAssetCorrespondence";
import type { IAutoMovieHumanBodyAtlasQualification } from "./IAutoMovieHumanBodyAtlasQualification";

/**
 * Read acquired atlas qualification bound to actual static source members.
 *
 * Namespace absence preserves legacy assets. A present namespace must identify
 * every atlas member of this primitive exactly once in actual source order;
 * source rights, acquisition and registration remain explicit. This admits
 * correspondence, not source authenticity or clinical validity.
 *
 * @evidence contracts/common.md#principled-implementation Exact schema and source-member joins bind reference-only qualification to actual accessor intervals admitted by the common owner.
 * @evidence contracts/common.md#clear-and-simple-design One namespace reader delegates interval arithmetic and owns atlas metadata admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A material label or atlas surface cannot certify personal anatomy.
 * @evidence contracts/common.md#meaningful-documentation States legacy absence, refusal and the limits of readback authority.
 */
export function readHumanBodyAtlasAssetCorrespondence(primitive: Primitive): IAutoMovieHumanBodyAtlasAssetCorrespondence | undefined {
  const extras = primitive.getExtras();
  if (!Object.hasOwn(extras, "automovieAtlasInspection")) return undefined;
  const qualification = typia.assertEquals<IAutoMovieHumanBodyAtlasQualification>(extras.automovieAtlasInspection);
  const geometry = readHumanStaticPartCorrespondence(primitive);
  const ids = geometry?.parts.filter((part) => /^(body:)?anatomical-atlas:/.test(part.id)).map((part) => part.id);
  if (geometry === undefined || ids === undefined || ids.length === 0 || qualification.parts.length !== ids.length ||
      qualification.parts.some((part, at) => part.id !== ids[at] || part.id !== (part.id.startsWith("body:") ? "body:" : "") + "anatomical-atlas:" + part.part ||
        !isHumanBodyAtlasSourceRecorded(part.source) || part.registration.basis.trim() === "" || part.registration.protocol.trim() === "" ||
        !/^[a-f0-9]{64}$/i.test(part.compiledMeshSha256) ||
        Object.values(part.registration.shape).some((value) => !Number.isFinite(value))))
    throw new Error("Atlas qualification must match its actual source members and reference provenance.");
  return { geometry, qualification: structuredClone(qualification) };
}
