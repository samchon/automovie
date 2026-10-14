import type { Document, Mesh, Primitive } from "@gltf-transform/core";
import typia from "typia";

import { readHumanStaticPartCorrespondence } from "../../common/export/readHumanStaticPartCorrespondence";
import type { IAutoMovieHumanBodyAssemblyQualification } from "./IAutoMovieHumanBodyAssemblyQualification";
import { readHumanBodyAssemblyAssetCorrespondence } from "./readHumanBodyAssemblyAssetCorrespondence";

/**
 * Carry the exact coarse source qualification in the existing static Document.
 *
 * The builder owns geometry and the generic writer owns source intervals. This adapter joins static anatomical and native SAT members exactly once across the supplied Document, then writes primitive-local subsets while preserving unrelated extras. Static receipts and native calculation records remain separate. Body/person exporters supply a source-addressed static Document from the same glTF-Transform module instance.
 *
 * The function mutates matching primitive extras in place and re-admits them through the shared body reader. A later refusal may leave earlier primitive mutations in the caller-owned Document; ordinary exporters discard that local Document on failure rather than publishing it. Binding and metadata admission do not certify authentic acquisition, clinical segmentation or personal anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Exact qualification schema and complete unique static/native source populations precede ordered primitive-local accounts, followed by the same assembly reader's actual accessor and provenance admission.
 * @evidence contracts/common.md#clear-and-simple-design One metadata adapter joins supplied receipts to existing source intervals while the builder and generic writer retain geometry ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/duplicate/unqualified members refuse, native field members receive no acquired static-mesh account, and admitted correspondence cannot certify clinical tissue resolution.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies same-Document/source-part premises, primitive-local subsets, extras mutation and partial mutation on failure with exporter-local discard.
 * @evidence contracts/performance.md#efficient-algorithms Receipt maps and primitive filtering/joining follow member counts; repeated common-reader admission also scans actual resident accessors, and native-source exclusion can scan supplied parts.
 * @evidence contracts/performance.md#reuse-equivalent-work One ID map per static/native population serves all primitives, and the common interval/body readers preserve the existing output-admission rules.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local maps/filtered arrays expire while caller Document extras retain supplied qualification references; no writer, source fetch, external handle or background task is acquired here.
 */
export function writeHumanBodyAssemblyQualification(
  document: Document,
  supplied: IAutoMovieHumanBodyAssemblyQualification,
): void {
  const qualification: IAutoMovieHumanBodyAssemblyQualification =
    typia.assertEquals<IAutoMovieHumanBodyAssemblyQualification>(supplied);
  const members: Map<string, (typeof qualification.parts)[number]> = new Map(
    qualification.parts.map(
      (part: (typeof qualification.parts)[number]): [string, typeof part] => [
        part.id,
        part,
      ],
    ),
  );
  const primitives: Primitive[] = document
    .getRoot()
    .listMeshes()
    .flatMap((mesh: Mesh): Primitive[] => mesh.listPrimitives());
  const actual: NonNullable<
    ReturnType<typeof readHumanStaticPartCorrespondence>
  >["parts"] = primitives
    .flatMap(
      (primitive: Primitive): typeof actual =>
        readHumanStaticPartCorrespondence(primitive)?.parts ?? [],
    )
    .filter((part: (typeof actual)[number]): boolean =>
      /^(?:body:)?anatomical-source:/.test(part.id),
    );
  const nativeMembers: Map<
    string,
    NonNullable<typeof qualification.nativeSubcutaneous>["members"][number]
  > = new Map(
    qualification.nativeSubcutaneous?.members.map(
      (
        part: NonNullable<
          typeof qualification.nativeSubcutaneous
        >["members"][number],
      ): [string, typeof part] => [part.id, part],
    ) ?? [],
  );
  const nativeActual: typeof actual = primitives
    .flatMap(
      (primitive: Primitive): typeof actual =>
        readHumanStaticPartCorrespondence(primitive)?.parts ?? [],
    )
    .filter((part: (typeof actual)[number]): boolean =>
      /^(?:body:)?native-subcutaneous:/.test(part.id),
    );
  if (
    members.size !== qualification.parts.length ||
    actual.length !== members.size ||
    new Set(actual.map((part: (typeof actual)[number]): string => part.id))
      .size !== members.size ||
    actual.some(
      (part: (typeof actual)[number]): boolean => !members.has(part.id),
    ) ||
    (qualification.nativeSubcutaneous !== undefined &&
      qualification.parts.some(
        (part: (typeof qualification.parts)[number]): boolean =>
          part.part === qualification.nativeSubcutaneous!.source.id,
      )) ||
    (qualification.nativeSubcutaneous !== undefined &&
      nativeMembers.size === 0) ||
    nativeMembers.size !==
      (qualification.nativeSubcutaneous?.members.length ?? 0) ||
    nativeActual.length !== nativeMembers.size ||
    new Set(
      nativeActual.map(
        (part: (typeof nativeActual)[number]): string => part.id,
      ),
    ).size !== nativeMembers.size ||
    nativeActual.some(
      (part: (typeof nativeActual)[number]): boolean =>
        !nativeMembers.has(part.id),
    )
  )
    throw new Error(
      "Coarse anatomical report must qualify every actual source member exactly once.",
    );
  for (const primitive of primitives) {
    const geometry: typeof actual =
      readHumanStaticPartCorrespondence(primitive)?.parts ?? [];
    const parts: typeof geometry = geometry.filter(
      (part: (typeof geometry)[number]): boolean => members.has(part.id),
    );
    const native: typeof geometry = geometry.filter(
      (part: (typeof geometry)[number]): boolean => nativeMembers.has(part.id),
    );
    if (parts.length === 0 && native.length === 0) continue;
    const {
      nativeSubcutaneous,
      ...staticQualification
    }: IAutoMovieHumanBodyAssemblyQualification = qualification;
    primitive.setExtras({
      ...primitive.getExtras(),
      automovieAnatomicalAssembly: {
        ...staticQualification,
        parts: parts.map(
          (
            part: (typeof parts)[number],
          ): (typeof qualification.parts)[number] => members.get(part.id)!,
        ),
        ...(native.length === 0
          ? {}
          : {
              nativeSubcutaneous: {
                ...nativeSubcutaneous!,
                members: native.map(
                  (
                    part: (typeof native)[number],
                  ): NonNullable<
                    typeof nativeSubcutaneous
                  >["members"][number] => nativeMembers.get(part.id)!,
                ),
              },
            }),
      },
    });
    readHumanBodyAssemblyAssetCorrespondence(primitive);
  }
}
