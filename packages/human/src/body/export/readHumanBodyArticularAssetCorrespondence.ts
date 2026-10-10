import type { Primitive } from "@gltf-transform/core";
import typia from "typia";

import { readHumanStaticPartCorrespondence } from "../../common/export/readHumanStaticPartCorrespondence";
import type { IAutoMovieHumanBodyArticularAssetCorrespondence } from "./IAutoMovieHumanBodyArticularAssetCorrespondence";

/**
 * Join candidate qualification to its actual primitive source-ID partition.
 * Body absence is legacy; a present unsupported claim or incomplete ID join
 * refuses. The common reader remains the sole element-interval admission owner.
 */
export function readHumanBodyArticularAssetCorrespondence(
  primitive: Primitive,
): IAutoMovieHumanBodyArticularAssetCorrespondence | undefined {
  const extras = primitive.getExtras();
  if (!Object.hasOwn(extras, "automovieArticularInspection")) return undefined;
  const qualification = typia.assertEquals<
    IAutoMovieHumanBodyArticularAssetCorrespondence["qualification"]
  >(extras.automovieArticularInspection);
  const geometry = readHumanStaticPartCorrespondence(primitive);
  if (
    geometry === undefined ||
    qualification.reference.basis.trim() === "" ||
    qualification.parts.length !== geometry.parts.length ||
    qualification.parts.some(
      (part, index) => part.id !== geometry.parts[index].id,
    )
  )
    throw new Error(
      "Articular qualification must match its actual source part partition.",
    );
  return { geometry, qualification: structuredClone(qualification) };
}
