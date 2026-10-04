import type { Primitive } from "@gltf-transform/core";
import typia from "typia";

import { readHumanStaticPartCorrespondence } from "../../common/export/readHumanStaticPartCorrespondence";
import type { IAutoMovieHumanBodyArticularAssetCorrespondence } from "./IAutoMovieHumanBodyArticularAssetCorrespondence";

/**
 * Join candidate qualification to its actual primitive source-ID partition.
 * Body absence is legacy; a present unsupported claim or incomplete ID join
 * refuses. The common reader remains the sole element-interval admission owner.
 *
 * @evidence contracts/common.md#principled-implementation Exact candidate-only schema and ID-order equality bind qualification to the admitted common mapping.
 * @evidence contracts/common.md#clear-and-simple-design Delegates geometry binding and owns only body qualification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A material name or a resolved bone label cannot replace candidate provenance.
 * @evidence contracts/common.md#meaningful-documentation States absence, refusal and the distinction from clinical validity.
 */
export function readHumanBodyArticularAssetCorrespondence(primitive: Primitive): IAutoMovieHumanBodyArticularAssetCorrespondence | undefined {
  const extras = primitive.getExtras();
  if (!Object.hasOwn(extras, "automovieArticularInspection")) return undefined;
  const qualification = typia.assertEquals<IAutoMovieHumanBodyArticularAssetCorrespondence["qualification"]>(extras.automovieArticularInspection);
  const geometry = readHumanStaticPartCorrespondence(primitive);
  if (geometry === undefined || qualification.reference.basis.trim() === "" || qualification.parts.length !== geometry.parts.length || qualification.parts.some((part, index) => part.id !== geometry.parts[index].id))
    throw new Error("Articular qualification must match its actual source part partition.");
  return { geometry, qualification: structuredClone(qualification) };
}
