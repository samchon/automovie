import { SHA256_DIGEST_PATTERN } from "@automovie/engine";
import type { Primitive } from "@gltf-transform/core";
import typia from "typia";

import { readHumanStaticPartCorrespondence } from "../../common/export/readHumanStaticPartCorrespondence";
import { isHumanBodyAtlasSourceRecorded } from "../anatomy/atlas/isHumanBodyAtlasSourceRecorded";
import type { IAutoMovieHumanBodyAssemblyAssetCorrespondence } from "./IAutoMovieHumanBodyAssemblyAssetCorrespondence";
import type { IAutoMovieHumanBodyAssemblyQualification } from "./IAutoMovieHumanBodyAssemblyQualification";

/**
 * Join source assembly provenance to actual Float32 primitive member intervals.
 *
 * Absent metadata is legacy unless actual native-subcutaneous members require their calculation qualification. Present static qualification covers actual anatomical-source members in order; a native-only primitive carries a separate field/exterior/member account. Ordinary skin and atlas inspection remain separate. Schema, provenance syntax and accessor binding do not establish scientific authenticity or clinical resolution.
 *
 * Optional source numbering is an increasing resident-to-original bijection within the declared original population. Native roles/IDs and field/exterior/member digest forms remain explicit. The common reader returns owned geometry, while this reader borrows the exact admitted qualification object from extras; it neither hashes original bytes nor deep-copies that qualification.
 *
 * @evidence contracts/common.md#principled-implementation Exact schema and common Float32 intervals precede ordered static/native ID checks, registered-source syntax, finite shape weights and optional original-ordinal correspondence admission.
 * @evidence contracts/common.md#clear-and-simple-design Static source members and native field calculations retain separate accounts within one namespace, reusing the common accessor binding and atlas provenance predicate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing native accounts, ambiguous members/roles, invalid digest forms and ordinal mappings refuse; syntactic provenance cannot establish source authenticity or clinical segmentation.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies legacy/native absence behavior, Float32 versus source numbering, digest-form limits and borrowed qualification versus owned common geometry.
 * @evidence contracts/performance.md#efficient-algorithms Common accessor admission scans actual arrays; filtering/ordered joins/duplicate sets and ordinal checks add work proportional to actual members, text and correspondence rows.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared interval, provenance and canonical prefixed-digest owners avoid divergent rules, while mutable extras are revalidated instead of cached across reads.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local member/role sets and filtered arrays expire; output owns cloned common geometry but borrows qualification, and no Primitive handle, source fetch or task is acquired.
 */
export function readHumanBodyAssemblyAssetCorrespondence(
  primitive: Primitive,
): IAutoMovieHumanBodyAssemblyAssetCorrespondence | undefined {
  const extras: ReturnType<Primitive["getExtras"]> = primitive.getExtras();
  if (!Object.hasOwn(extras, "automovieAnatomicalAssembly")) {
    if (readHumanStaticPartCorrespondence(primitive)?.parts.some((part: NonNullable<ReturnType<typeof readHumanStaticPartCorrespondence>>["parts"][number]): boolean => /^(?:body:)?native-subcutaneous:/.test(part.id)))
      throw new Error("Native subcutaneous source members require their actual calculation qualification.");
    return undefined;
  }
  const qualification: IAutoMovieHumanBodyAssemblyQualification =
    typia.assertEquals<IAutoMovieHumanBodyAssemblyQualification>(
      extras.automovieAnatomicalAssembly,
    );
  const geometry: ReturnType<typeof readHumanStaticPartCorrespondence> = readHumanStaticPartCorrespondence(primitive);
  if (geometry === undefined)
    throw new Error(
      "Coarse anatomical qualification has no actual source correspondence.",
    );
  const actual: typeof geometry.parts = geometry.parts.filter((part: typeof geometry.parts[number]): boolean =>
    /^(?:body:)?anatomical-source:/.test(part.id),
  );
  const native: IAutoMovieHumanBodyAssemblyQualification["nativeSubcutaneous"] = qualification.nativeSubcutaneous;
  if (
    qualification.version !== 1 ||
    qualification.sourceModel.trim() === "" ||
    qualification.basis.trim() === "" ||
    qualification.generation.trim() === "" ||
    qualification.registration.trim() === "" ||
    Object.values(qualification.shape).some(
      (value: number): boolean => !Number.isFinite(value),
    ) ||
    actual.length !== qualification.parts.length ||
    (native === undefined && geometry.parts.some((part: typeof geometry.parts[number]): boolean => /^(?:body:)?native-subcutaneous:/.test(part.id))) ||
    (native !== undefined && qualification.parts.some((part: typeof qualification.parts[number]): boolean => part.part === native.source.id)) ||
    (actual.length === 0 && native === undefined) ||
    new Set(qualification.parts.map((part: typeof qualification.parts[number]): string => part.id)).size !==
      qualification.parts.length
  )
    throw new Error(
      "Coarse anatomical qualification has unsupported source/schema/member population.",
    );
  if (native !== undefined) {
    const ids: Set<string> = new Set(native.members.map((member: typeof native.members[number]): string => member.id));
    const parts: typeof geometry.parts = geometry.parts.filter((part: typeof geometry.parts[number]): boolean => /^(?:body:)?native-subcutaneous:/.test(part.id));
    if (native.basis !== qualification.basis || native.instance.trim() === "" || native.clinical !== "unavailable" ||
        native.source.id !== "subcutaneousAdipose" || native.source.tissue !== "adipose" ||
        [native.source.surface, native.source.fieldFileUri, native.source.bindingAccount, native.source.qualification, native.fieldQualification].some((value: string): boolean => value.trim() === "") ||
        !SHA256_DIGEST_PATTERN.test(native.source.fieldDigest) || !SHA256_DIGEST_PATTERN.test(native.exteriorDigest) ||
        [native.source.fieldFileSha256, native.source.producerSha256, native.source.inputViewSha256, native.source.receiptSha256].some((value: string): boolean => !/^[a-f0-9]{64}$/.test(value)) ||
        ids.size === 0 || ids.size !== native.members.length || parts.length !== ids.size ||
        new Set(native.members.map((member: typeof native.members[number]): typeof member.role => member.role)).size !== native.members.length ||
        native.members.some((member: typeof native.members[number], at: number): boolean => member.id !== parts[at].id ||
          member.id !== (member.id.startsWith("body:") ? "body:" : "") + "native-subcutaneous:" + native.source.id + "/" + native.source.surface + "/" + member.role ||
          !SHA256_DIGEST_PATTERN.test(member.meshDigest)))
      throw new Error("Native subcutaneous qualification must bind actual boundary members and complete field/exterior provenance.");
  }
  for (const [at, part] of qualification.parts.entries()) {
    if (
      part.id !== actual[at].id ||
      part.id !== (part.id.startsWith("body:") ? "body:" : "") +
        "anatomical-source:" + part.part + "/" + part.surface ||
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
      const { sourceVertexCount, residentToSource }: NonNullable<typeof part.sourceVertices> = part.sourceVertices;
      if (
        !Number.isSafeInteger(sourceVertexCount) ||
        sourceVertexCount < actual[at].vertexCount ||
        residentToSource.length !== actual[at].vertexCount ||
        residentToSource.some(
          (source: number, vertex: number): boolean =>
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
