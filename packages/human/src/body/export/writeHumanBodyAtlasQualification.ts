import type { Document, Mesh, Primitive } from "@gltf-transform/core";
import typia from "typia";

import { readHumanStaticPartCorrespondence } from "../../common/export/readHumanStaticPartCorrespondence";
import type { IAutoMovieHumanBodyAtlasQualification } from "./IAutoMovieHumanBodyAtlasQualification";
import { readHumanBodyAtlasAssetCorrespondence } from "./readHumanBodyAtlasAssetCorrespondence";

/**
 * Join selected atlas receipts to the actual export Document before writing.
 *
 * Body/person exporters supply a source-addressed static Document from the same glTF-Transform module instance. Every actual atlas member requires one unique supplied receipt; matching primitives receive copied member records in source order while unrelated extras and non-atlas members remain unchanged. Body-prefixed IDs preserve person composition.
 *
 * Matching primitive extras are mutated before reader re-admission. A later failure may leave earlier metadata mutations in the supplied Document; ordinary exporters discard that local Document on failure. Receipts retain reference rights/registration and unavailable personal anatomy, without source authenticity or clinical certification.
 *
 * @evidence contracts/common.md#principled-implementation Exact atlas schema, unique receipt/actual-member populations and complete ID membership precede copied primitive-local receipts, followed by shared atlas correspondence admission.
 * @evidence contracts/common.md#clear-and-simple-design One metadata adapter joins selected atlas records to existing generic source intervals while static geometry, body construction and portable serialization remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/duplicate records or absent source correspondence refuse; non-atlas members gain no qualification and reference replay remains clinically unvalidated.
 * @evidence contracts/common.md#meaningful-documentation The prose specifies source-addressed same-module Document premises, body prefixes, copied records, extras mutation and partial-failure discard semantics.
 * @evidence contracts/performance.md#efficient-algorithms Receipt maps and primitive joins follow member counts, while repeated common/atlas readers scan actual accessors and metadata needed for output admission.
 * @evidence contracts/performance.md#reuse-equivalent-work One receipt ID map serves every primitive and the same atlas/common readers own validation rather than a separate interval formula in this writer.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local maps/arrays expire; Document extras retain owned receipt copies until released, with no acquired source handle, persistent cache or task.
 */
export function writeHumanBodyAtlasQualification(
  document: Document,
  input: IAutoMovieHumanBodyAtlasQualification,
): void {
  const report: IAutoMovieHumanBodyAtlasQualification =
    typia.assertEquals<IAutoMovieHumanBodyAtlasQualification>(input);
  const records: Map<string, typeof report.parts[number]> = new Map(report.parts.map((part: typeof report.parts[number]): [string, typeof part] => [part.id, part]));
  const primitives: Primitive[] = document
    .getRoot()
    .listMeshes()
    .flatMap((mesh: Mesh): Primitive[] => mesh.listPrimitives());
  const actual: NonNullable<ReturnType<typeof readHumanStaticPartCorrespondence>>["parts"] = primitives
    .flatMap(
      (primitive: Primitive): typeof actual => readHumanStaticPartCorrespondence(primitive)?.parts ?? [],
    )
    .filter((part: typeof actual[number]): boolean => /^(body:)?anatomical-atlas:/.test(part.id));
  if (
    records.size === 0 ||
    records.size !== report.parts.length ||
    actual.length !== records.size ||
    new Set(actual.map((part: typeof actual[number]): string => part.id)).size !== records.size ||
    actual.some((part: typeof actual[number]): boolean => !records.has(part.id))
  )
    throw new Error(
      "Atlas qualification must identify every actual atlas source part exactly once.",
    );
  for (const primitive of primitives) {
    const geometry: ReturnType<typeof readHumanStaticPartCorrespondence> = readHumanStaticPartCorrespondence(primitive);
    if (geometry === undefined)
      throw new Error("Atlas qualification requires the exported primitive's actual source-part correspondence.");
    const parts: typeof report.parts = geometry.parts.flatMap(
      (part: typeof geometry.parts[number]): typeof report.parts => {
        const record: typeof report.parts[number] | undefined = records.get(part.id);
        return record === undefined ? [] : [structuredClone(record)];
      },
    );
    if (parts.length === 0) continue;
    const qualification: IAutoMovieHumanBodyAtlasQualification = {
      version: 1,
      qualification: "reference-atlas-inspection",
      parts,
    };
    primitive.setExtras({
      ...primitive.getExtras(),
      automovieAtlasInspection: qualification,
    });
    readHumanBodyAtlasAssetCorrespondence(primitive);
  }
}
