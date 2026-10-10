import type { Document } from "@gltf-transform/core";
import typia from "typia";

import { readHumanStaticPartCorrespondence } from "../../common/export/readHumanStaticPartCorrespondence";
import type { IAutoMovieHumanBodyAtlasQualification } from "./IAutoMovieHumanBodyAtlasQualification";
import { readHumanBodyAtlasAssetCorrespondence } from "./readHumanBodyAtlasAssetCorrespondence";

/**
 * Join selected atlas receipts to the actual export Document before writing.
 *
 * The body writer uses this adapter, which also accepts actual body-prefixed
 * atlas records in a composed Document. It changes only the atlas
 * namespace on matching primitives; every actual atlas source member requires
 * exactly one supplied receipt, while other source members make no atlas claim.
 */
export function writeHumanBodyAtlasQualification(
  document: Document,
  input: IAutoMovieHumanBodyAtlasQualification,
): void {
  const report =
    typia.assertEquals<IAutoMovieHumanBodyAtlasQualification>(input);
  const records = new Map(report.parts.map((part) => [part.id, part]));
  const primitives = document
    .getRoot()
    .listMeshes()
    .flatMap((mesh) => mesh.listPrimitives());
  const actual = primitives
    .flatMap(
      (primitive) => readHumanStaticPartCorrespondence(primitive)?.parts ?? [],
    )
    .filter((part) => /^(body:)?anatomical-atlas:/.test(part.id));
  if (
    records.size === 0 ||
    records.size !== report.parts.length ||
    actual.length !== records.size ||
    new Set(actual.map((part) => part.id)).size !== records.size ||
    actual.some((part) => !records.has(part.id))
  )
    throw new Error(
      "Atlas qualification must identify every actual atlas source part exactly once.",
    );
  for (const primitive of primitives) {
    const parts = readHumanStaticPartCorrespondence(primitive)!.parts.flatMap(
      (part) => {
        const record = records.get(part.id);
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
