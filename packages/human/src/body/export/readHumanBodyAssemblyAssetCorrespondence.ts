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
 *
 * @evidence contracts/common.md#principled-implementation Qualification joins the generic reader's actual carrying primitive intervals rather than reconstructed model data.
 * @evidence contracts/common.md#clear-and-simple-design One reader owns schema and exact ordered source identity correspondence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Material names and counts cannot substitute for actual source member intervals.
 * @evidence contracts/common.md#meaningful-documentation States absent legacy behavior and scientific qualification limits.
 */
export function readHumanBodyAssemblyAssetCorrespondence(primitive: Primitive): IAutoMovieHumanBodyAssemblyAssetCorrespondence | undefined {
  const extras = primitive.getExtras();
  if (!Object.hasOwn(extras, "automovieAnatomicalAssembly")) return undefined;
  const qualification = typia.assertEquals<IAutoMovieHumanBodyAssemblyQualification>(extras.automovieAnatomicalAssembly);
  const geometry = readHumanStaticPartCorrespondence(primitive);
  if (geometry === undefined) throw new Error("Coarse anatomical qualification has no actual source correspondence.");
  const actual = geometry.parts.filter((part) => /^(?:body:)?anatomical-source:/.test(part.id));
  if (qualification.version !== 1 || qualification.sourceModel.trim() === "" || qualification.basis.trim() === "" ||
      qualification.generation.trim() === "" || qualification.registration.trim() === "" ||
      Object.values(qualification.shape).some((value) => !Number.isFinite(value)) || actual.length !== qualification.parts.length || actual.length === 0 ||
      new Set(qualification.parts.map((part) => part.id)).size !== qualification.parts.length)
    throw new Error("Coarse anatomical qualification has unsupported source/schema/member population.");
  for (const [at, part] of qualification.parts.entries()) {
    if (part.id !== actual[at].id || !part.id.endsWith("anatomical-source:" + part.part + "/" + part.surface) ||
        part.clinical !== "unavailable" || part.bindingAccount.trim() === "" || part.qualification.trim() === "" ||
        !isHumanBodyAtlasSourceRecorded(part.source) || !/^[a-fA-F0-9]{64}$/.test(part.compiledMeshSha256))
      throw new Error("Coarse anatomical qualification differs from its actual member: " + part.id);
    if (part.sourceVertices !== undefined) {
      const { sourceVertexCount, residentToSource } = part.sourceVertices;
      if (!Number.isSafeInteger(sourceVertexCount) || sourceVertexCount < actual[at].vertexCount ||
          residentToSource.length !== actual[at].vertexCount || residentToSource.some((source, vertex) =>
            !Number.isSafeInteger(source) || source < 0 || source >= sourceVertexCount ||
            (vertex > 0 && source <= residentToSource[vertex - 1])))
        throw new Error("Resident anatomical vertices have invalid original-source correspondence: " + part.id);
    }
  }
  return { geometry, qualification };
}
