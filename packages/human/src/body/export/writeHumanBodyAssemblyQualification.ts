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
 * Native SAT members use their explicit calculation record and actual generic
 * intervals; they never receive an acquired static-mesh qualification.
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
  const nativeMembers = new Map(qualification.nativeSubcutaneous?.members.map((part) => [part.id, part]) ?? []);
  const nativeActual = primitives.flatMap((primitive) => readHumanStaticPartCorrespondence(primitive)?.parts ?? [])
    .filter((part) => /^(?:body:)?native-subcutaneous:/.test(part.id));
  if (
    members.size !== qualification.parts.length ||
    actual.length !== members.size ||
    actual.some((part) => !members.has(part.id)) ||
    (qualification.nativeSubcutaneous !== undefined && qualification.parts.some((part) => part.part === qualification.nativeSubcutaneous!.source.id)) ||
    (qualification.nativeSubcutaneous !== undefined && nativeMembers.size === 0) ||
    nativeMembers.size !== (qualification.nativeSubcutaneous?.members.length ?? 0) ||
    nativeActual.length !== nativeMembers.size || nativeActual.some((part) => !nativeMembers.has(part.id))
  )
    throw new Error(
      "Coarse anatomical report must qualify every actual source member exactly once.",
    );
  for (const primitive of primitives) {
    const geometry = readHumanStaticPartCorrespondence(primitive)?.parts ?? [];
    const parts = geometry.filter((part) => members.has(part.id));
    const native = geometry.filter((part) => nativeMembers.has(part.id));
    if (parts.length === 0 && native.length === 0) continue;
    const { nativeSubcutaneous, ...staticQualification } = qualification;
    primitive.setExtras({
      ...primitive.getExtras(),
      automovieAnatomicalAssembly: {
        ...staticQualification,
        parts: parts.map((part) => members.get(part.id)!),
        ...(native.length === 0 ? {} : { nativeSubcutaneous: {
          ...nativeSubcutaneous!,
          members: native.map((part) => nativeMembers.get(part.id)!),
        } }),
      },
    });
    readHumanBodyAssemblyAssetCorrespondence(primitive);
  }
}
