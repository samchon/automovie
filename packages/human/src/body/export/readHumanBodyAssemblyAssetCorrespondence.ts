import type { Primitive } from "@gltf-transform/core";
import typia from "typia";

import { readHumanStaticPartCorrespondence } from "../../common/export/readHumanStaticPartCorrespondence";
import { isHumanBodyAtlasSourceRecorded } from "../anatomy/atlas/isHumanBodyAtlasSourceRecorded";
import type { IAutoMovieHumanBodyAssemblyAssetCorrespondence } from "./IAutoMovieHumanBodyAssemblyAssetCorrespondence";
import type { IAutoMovieHumanBodyAssemblyQualification } from "./IAutoMovieHumanBodyAssemblyQualification";

/**
 * Join source assembly provenance to actual Float32 primitive member intervals.
 *
 * Absent metadata is legacy. Present qualification must cover exactly the
 * actual anatomical-source members in this primitive, in order; ordinary skin
 * and legacy atlas inspection have separate ownership. This validates binding
 * and schema rather than scientific authenticity or clinical resolution.
 * A native-only primitive carries the separate field/exterior/member record
 * with no static source accounts. Its original anchors retain their meaning.
 */
export function readHumanBodyAssemblyAssetCorrespondence(
  primitive: Primitive,
): IAutoMovieHumanBodyAssemblyAssetCorrespondence | undefined {
  const extras = primitive.getExtras();
  if (!Object.hasOwn(extras, "automovieAnatomicalAssembly")) {
    if (readHumanStaticPartCorrespondence(primitive)?.parts.some((part) => /^(?:body:)?native-subcutaneous:/.test(part.id)))
      throw new Error("Native subcutaneous source members require their actual calculation qualification.");
    return undefined;
  }
  const qualification =
    typia.assertEquals<IAutoMovieHumanBodyAssemblyQualification>(
      extras.automovieAnatomicalAssembly,
    );
  const geometry = readHumanStaticPartCorrespondence(primitive);
  if (geometry === undefined)
    throw new Error(
      "Coarse anatomical qualification has no actual source correspondence.",
    );
  const actual = geometry.parts.filter((part) =>
    /^(?:body:)?anatomical-source:/.test(part.id),
  );
  const native = qualification.nativeSubcutaneous;
  if (
    qualification.version !== 1 ||
    qualification.sourceModel.trim() === "" ||
    qualification.basis.trim() === "" ||
    qualification.generation.trim() === "" ||
    qualification.registration.trim() === "" ||
    Object.values(qualification.shape).some(
      (value) => !Number.isFinite(value),
    ) ||
    actual.length !== qualification.parts.length ||
    (native === undefined && geometry.parts.some((part) => /^(?:body:)?native-subcutaneous:/.test(part.id))) ||
    (native !== undefined && qualification.parts.some((part) => part.part === native.source.id)) ||
    (actual.length === 0 && native === undefined) ||
    new Set(qualification.parts.map((part) => part.id)).size !==
      qualification.parts.length
  )
    throw new Error(
      "Coarse anatomical qualification has unsupported source/schema/member population.",
    );
  if (native !== undefined) {
    const ids = new Set(native.members.map((member) => member.id));
    const parts = geometry.parts.filter((part) => /^(?:body:)?native-subcutaneous:/.test(part.id));
    if (native.basis !== qualification.basis || native.instance.trim() === "" || native.clinical !== "unavailable" ||
        native.source.id !== "subcutaneousAdipose" || native.source.tissue !== "adipose" ||
        [native.source.surface, native.source.fieldFileUri, native.source.bindingAccount, native.source.qualification, native.fieldQualification].some((value) => value.trim() === "") ||
        !/^sha256:[a-f0-9]{64}$/.test(native.source.fieldDigest) || !/^sha256:[a-f0-9]{64}$/.test(native.exteriorDigest) ||
        [native.source.fieldFileSha256, native.source.producerSha256, native.source.inputViewSha256, native.source.receiptSha256].some((value) => !/^[a-f0-9]{64}$/.test(value)) ||
        ids.size === 0 || ids.size !== native.members.length || parts.length !== ids.size ||
        new Set(native.members.map((member) => member.role)).size !== native.members.length ||
        native.members.some((member, at) => member.id !== parts[at].id ||
          member.id !== (member.id.startsWith("body:") ? "body:" : "") + "native-subcutaneous:" + native.source.id + "/" + native.source.surface + "/" + member.role ||
          !/^sha256:[a-f0-9]{64}$/.test(member.meshDigest)))
      throw new Error("Native subcutaneous qualification must bind actual boundary members and complete field/exterior provenance.");
  }
  for (const [at, part] of qualification.parts.entries()) {
    if (
      part.id !== actual[at].id ||
      !part.id.endsWith(
        "anatomical-source:" + part.part + "/" + part.surface,
      ) ||
      part.clinical !== "unavailable" ||
      part.bindingAccount.trim() === "" ||
      part.qualification.trim() === "" ||
      !isHumanBodyAtlasSourceRecorded(part.source) ||
      !/^[a-fA-F0-9]{64}$/.test(part.compiledMeshSha256)
    )
      throw new Error(
        "Coarse anatomical qualification differs from its actual member: " +
          part.id,
      );
    if (part.sourceVertices !== undefined) {
      const { sourceVertexCount, residentToSource } = part.sourceVertices;
      if (
        !Number.isSafeInteger(sourceVertexCount) ||
        sourceVertexCount < actual[at].vertexCount ||
        residentToSource.length !== actual[at].vertexCount ||
        residentToSource.some(
          (source, vertex) =>
            !Number.isSafeInteger(source) ||
            source < 0 ||
            source >= sourceVertexCount ||
            (vertex > 0 && source <= residentToSource[vertex - 1]),
        )
      )
        throw new Error(
          "Resident anatomical vertices have invalid original-source correspondence: " +
            part.id,
        );
    }
  }
  return { geometry, qualification };
}
