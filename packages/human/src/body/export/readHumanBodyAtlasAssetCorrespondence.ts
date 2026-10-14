import type { Primitive } from "@gltf-transform/core";
import typia from "typia";

import { readHumanStaticPartCorrespondence } from "../../common/export/readHumanStaticPartCorrespondence";
import { isHumanBodyAtlasSourceRecorded } from "../anatomy/atlas/isHumanBodyAtlasSourceRecorded";
import type { IAutoMovieHumanBodyAtlasAssetCorrespondence } from "./IAutoMovieHumanBodyAtlasAssetCorrespondence";
import type { IAutoMovieHumanBodyAtlasQualification } from "./IAutoMovieHumanBodyAtlasQualification";

/**
 * Read acquired atlas qualification bound to actual static source members.
 *
 * Namespace absence preserves legacy assets. A present namespace identifies every actual atlas member in the primitive's source order, with nonempty recorded acquisition rights, reference basis/protocol, finite reference shape and a source digest form. These are metadata and correspondence checks rather than source-byte hashing, authentic acquisition or clinical validity. Common geometry and qualification are independently owned copies.
 *
 * @evidence contracts/common.md#principled-implementation Exact atlas schema and shared actual accessor admission precede complete ordered atlas ID equality, recorded-source syntax, reference identity and finite shape checks.
 * @evidence contracts/common.md#clear-and-simple-design One atlas-specific reader adds reference qualification to the common source interval owner without taking over geometry or editable document serialization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing geometry, wrong member identities, incomplete source records or invalid reference fields refuse; digest spelling alone cannot verify bytes or clinical anatomy.
 * @evidence contracts/common.md#meaningful-documentation The prose gives legacy absence, actual source order, reference/digest limits and copied result ownership.
 * @evidence contracts/performance.md#efficient-algorithms Common accessor admission follows resident array size; atlas filtering, ordered joins, source text and shape checks follow metadata size before qualification cloning.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared interval reader and recorded-source predicate supply identical rules to builder/atlas consumers without caching mutable primitive extras.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Filtered ID arrays and schema temporaries expire; owned geometry/qualification copies escape without retaining a writer, acquired source handle or task.
 */
export function readHumanBodyAtlasAssetCorrespondence(
  primitive: Primitive,
): IAutoMovieHumanBodyAtlasAssetCorrespondence | undefined {
  const extras: ReturnType<Primitive["getExtras"]> = primitive.getExtras();
  if (!Object.hasOwn(extras, "automovieAtlasInspection")) return undefined;
  const qualification: IAutoMovieHumanBodyAtlasQualification =
    typia.assertEquals<IAutoMovieHumanBodyAtlasQualification>(
      extras.automovieAtlasInspection,
    );
  const geometry: ReturnType<typeof readHumanStaticPartCorrespondence> =
    readHumanStaticPartCorrespondence(primitive);
  const ids: string[] | undefined = geometry?.parts
    .filter((part: NonNullable<typeof geometry>["parts"][number]): boolean =>
      /^(body:)?anatomical-atlas:/.test(part.id),
    )
    .map(
      (part: NonNullable<typeof geometry>["parts"][number]): string => part.id,
    );
  if (
    geometry === undefined ||
    ids === undefined ||
    ids.length === 0 ||
    qualification.parts.length !== ids.length ||
    qualification.parts.some(
      (part: (typeof qualification.parts)[number], at: number): boolean =>
        part.id !== ids[at] ||
        part.id !==
          (part.id.startsWith("body:") ? "body:" : "") +
            "anatomical-atlas:" +
            part.part ||
        !isHumanBodyAtlasSourceRecorded(part.source) ||
        part.registration.basis.trim() === "" ||
        part.registration.protocol.trim() === "" ||
        !/^[a-f0-9]{64}$/i.test(part.compiledMeshSha256) ||
        Object.values(part.registration.shape).some(
          (value: number): boolean => !Number.isFinite(value),
        ),
    )
  )
    throw new Error(
      "Atlas qualification must match its actual source members and reference provenance.",
    );
  return { geometry, qualification: structuredClone(qualification) };
}
