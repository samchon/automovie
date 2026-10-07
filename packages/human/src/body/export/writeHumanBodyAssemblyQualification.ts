import type { Document } from "@gltf-transform/core";
import typia from "typia";

import { readHumanStaticPartCorrespondence } from "../../common/export/readHumanStaticPartCorrespondence";
import type { IAutoMovieHumanBodyAssemblyQualification } from "./IAutoMovieHumanBodyAssemblyQualification";
import { readHumanBodyAssemblyAssetCorrespondence } from "./readHumanBodyAssemblyAssetCorrespondence";

/**
 * Carry the exact coarse source qualification in the existing static Document.
 *
 * The actual builder owns geometry and the generic writer owns source interval
 * grouping. This adapter joins every anatomical member exactly once before
 * the same Document is serialized; it does not recreate a mesh or certify
 * personal anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Qualification binds actual primitive member intervals in the same Document instance used by the writer.
 * @evidence contracts/common.md#clear-and-simple-design One bijective source join precedes the existing static serialization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or extra provenance records cannot be hidden by geometry grouping.
 * @evidence contracts/common.md#meaningful-documentation States responsibility and scientific limits.
 */
export function writeHumanBodyAssemblyQualification(
  document: Document,
  supplied: IAutoMovieHumanBodyAssemblyQualification,
): void {
  const qualification =
    typia.assertEquals<IAutoMovieHumanBodyAssemblyQualification>(supplied);
  const members = new Map(qualification.parts.map((part) => [part.id, part]));
  const primitives = document
    .getRoot()
    .listMeshes()
    .flatMap((mesh) => mesh.listPrimitives());
  const actual = primitives
    .flatMap(
      (primitive) => readHumanStaticPartCorrespondence(primitive)?.parts ?? [],
    )
    .filter((part) => /^(?:body:)?anatomical-source:/.test(part.id));
  if (
    members.size !== qualification.parts.length ||
    actual.length !== members.size ||
    actual.some((part) => !members.has(part.id))
  )
    throw new Error(
      "Coarse anatomical report must qualify every actual source member exactly once.",
    );
  for (const primitive of primitives) {
    const parts = (
      readHumanStaticPartCorrespondence(primitive)?.parts ?? []
    ).filter((part) => members.has(part.id));
    if (parts.length === 0) continue;
    primitive.setExtras({
      ...primitive.getExtras(),
      automovieAnatomicalAssembly: {
        ...qualification,
        parts: parts.map((part) => members.get(part.id)!),
      },
    });
    readHumanBodyAssemblyAssetCorrespondence(primitive);
  }
}
