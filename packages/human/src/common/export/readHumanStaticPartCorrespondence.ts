import type { Primitive } from "@gltf-transform/core";
import typia from "typia";

import type { IAutoMovieHumanStaticPartCorrespondence } from "./IAutoMovieHumanStaticPartCorrespondence";

/**
 * Read an owned source-ID partition from the actual carrying primitive.
 * Absence is a legacy asset; present malformed or unsupported metadata refuses.
 * This checks element binding, not topology, provenance authenticity or anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Exact version/schema admission and contiguous element partitions are checked against actual accessors and each member's referenced vertices.
 * @evidence contracts/common.md#clear-and-simple-design One reader owns interval admission for generic and body-qualified consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Material names and regenerated source meshes do not substitute for the primitive's records.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes legacy absence, malformed presence and identity from anatomical certification.
 */
export function readHumanStaticPartCorrespondence(primitive: Primitive): IAutoMovieHumanStaticPartCorrespondence | undefined {
  const extras = primitive.getExtras();
  if (!Object.hasOwn(extras, "automovieSourceParts")) return undefined;
  const record = typia.assertEquals<IAutoMovieHumanStaticPartCorrespondence>(extras.automovieSourceParts);
  const positions = primitive.getAttribute("POSITION");
  const indices = primitive.getIndices();
  if (primitive.getMode() !== 4 || positions === null || positions.getType() !== "VEC3" || positions.getComponentType() !== 5126 || indices === null || indices.getType() !== "SCALAR" || ![5121, 5123, 5125].includes(indices.getComponentType()))
    throw new Error("Source part correspondence requires an indexed Float32 triangle primitive.");
  // An admitted unsigned component type comes from a resident typed array.
  const values = indices.getArray()!;
  if (primitive.listAttributes().some((attribute) => attribute.getCount() !== positions.getCount()))
    throw new Error("Source part correspondence requires aligned resident accessors.");
  if (record.sourceModel.trim() === "" || record.parts.length === 0)
    throw new Error("Source part correspondence needs model and member identities.");
  const seen = new Set<string>();
  let vertex = 0;
  let index = 0;
  for (const part of record.parts) {
    if (part.id.trim() === "" || seen.has(part.id))
      throw new Error("Source part correspondence needs unique nonempty member IDs.");
    seen.add(part.id);
    if (![part.vertexOffset, part.vertexCount, part.indexOffset, part.indexCount].every((value) => Number.isSafeInteger(value) && value >= 0) || part.vertexCount === 0 || part.indexCount % 3 !== 0 || part.vertexOffset !== vertex || part.indexOffset !== index)
      throw new Error("Source part correspondence intervals must form an ordered triangle partition.");
    vertex += part.vertexCount;
    index += part.indexCount;
    if (vertex > positions.getCount() || index > values.length)
      throw new Error("Source part correspondence exceeds its actual accessors.");
    for (let offset = part.indexOffset; offset < index; offset++)
      if (values[offset] < part.vertexOffset || values[offset] >= vertex)
        throw new Error("Source part index leaves its member vertex interval.");
  }
  if (vertex !== positions.getCount() || index !== values.length)
    throw new Error("Source part correspondence must cover its actual accessors.");
  return structuredClone(record);
}
