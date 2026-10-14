import type { Accessor, Primitive } from "@gltf-transform/core";
import typia from "typia";

import type { IAutoMovieHumanStaticPartCorrespondence } from "./IAutoMovieHumanStaticPartCorrespondence";

/**
 * Read an owned source-ID partition from the actual carrying primitive.
 * Absence is a legacy asset; present malformed or unsupported metadata refuses.
 * This checks element binding, not topology, provenance authenticity or anatomy.
 *
 * @evidence contracts/common.md#principled-implementation typia admits versioned metadata; aligned indexed Float32 triangles require contiguous positive vertex intervals and triangle-aligned index intervals covering all accessors, with every index inside its member. This establishes element binding rather than anatomy or authentic provenance.
 * @evidence contracts/common.md#clear-and-simple-design A single primitive reader owns interval admission and returns a structured clone, reused by body and face qualification consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Triangle mode and component constants are glTF encodings; unique nonempty identities and coverage derive from actual accessors without expected specimen counts.
 * @evidence contracts/common.md#meaningful-documentation The public comment distinguishes absent legacy assets from malformed metadata and limits qualification to correspondence; refusal messages identify interval and accessor failures.
 * @evidence contracts/performance.md#efficient-algorithms For A attributes, P parts and I indices, validation costs O(A+P+I) plus metadata cloning; scanning every index is necessary to reject cross-member references, and the set/output scale with P.
 * @evidence contracts/performance.md#reuse-equivalent-work Body and face readers share this ordered interval rule; no cache equates separate reads of mutable primitive extras or resident arrays.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The duplicate-ID set and counters are local; the returned clone transfers ownership to its caller while borrowed accessors and all temporary state acquire no native handle or task.
 */
export function readHumanStaticPartCorrespondence(
  primitive: Primitive,
): IAutoMovieHumanStaticPartCorrespondence | undefined {
  const extras: ReturnType<Primitive["getExtras"]> = primitive.getExtras();
  if (!Object.hasOwn(extras, "automovieSourceParts")) return undefined;
  const record: IAutoMovieHumanStaticPartCorrespondence =
    typia.assertEquals<IAutoMovieHumanStaticPartCorrespondence>(
      extras.automovieSourceParts,
    );
  const positions: Accessor | null = primitive.getAttribute("POSITION");
  const indices: Accessor | null = primitive.getIndices();
  if (
    primitive.getMode() !== 4 ||
    positions === null ||
    positions.getType() !== "VEC3" ||
    positions.getComponentType() !== 5126 ||
    indices === null ||
    indices.getType() !== "SCALAR" ||
    ![5121, 5123, 5125].includes(indices.getComponentType())
  )
    throw new Error(
      "Source part correspondence requires an indexed Float32 triangle primitive.",
    );
  // An admitted unsigned component type comes from a resident typed array.
  const values: NonNullable<ReturnType<Accessor["getArray"]>> =
    indices.getArray()!;
  if (
    primitive
      .listAttributes()
      .some(
        (attribute: Accessor): boolean =>
          attribute.getCount() !== positions.getCount(),
      )
  )
    throw new Error(
      "Source part correspondence requires aligned resident accessors.",
    );
  if (record.sourceModel.trim() === "" || record.parts.length === 0)
    throw new Error(
      "Source part correspondence needs model and member identities.",
    );
  const seen: Set<string> = new Set<string>();
  let vertex: number = 0;
  let index: number = 0;
  for (const part of record.parts) {
    if (part.id.trim() === "" || seen.has(part.id))
      throw new Error(
        "Source part correspondence needs unique nonempty member IDs.",
      );
    seen.add(part.id);
    if (
      ![
        part.vertexOffset,
        part.vertexCount,
        part.indexOffset,
        part.indexCount,
      ].every(
        (value: number): boolean => Number.isSafeInteger(value) && value >= 0,
      ) ||
      part.vertexCount === 0 ||
      part.indexCount % 3 !== 0 ||
      part.vertexOffset !== vertex ||
      part.indexOffset !== index
    )
      throw new Error(
        "Source part correspondence intervals must form an ordered triangle partition.",
      );
    vertex += part.vertexCount;
    index += part.indexCount;
    if (vertex > positions.getCount() || index > values.length)
      throw new Error(
        "Source part correspondence exceeds its actual accessors.",
      );
    for (let offset: number = part.indexOffset; offset < index; offset++)
      if (values[offset] < part.vertexOffset || values[offset] >= vertex)
        throw new Error("Source part index leaves its member vertex interval.");
  }
  if (vertex !== positions.getCount() || index !== values.length)
    throw new Error(
      "Source part correspondence must cover its actual accessors.",
    );
  return structuredClone(record);
}
