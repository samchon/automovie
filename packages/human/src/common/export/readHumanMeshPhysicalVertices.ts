import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type { IAutoMovieMesh } from "@automovie/interface";
import type { Accessor, Primitive } from "@gltf-transform/core";
import typia from "typia";

import type { IHumanMeshPhysicalSourceTable } from "./IHumanMeshPhysicalSourceTable";

/**
 * Restore declared physical source pairs from an actual static primitive.
 * The unnormalized Uint16 VEC2 attribute stores low/high words of 32-bit table
 * references, never opaque source IDs. This retains glTF 2.0 compatibility.
 * Zero retains declared current-position legacy incidence; positive values
 * address the JSON table by index+1. Domain and safe integer ID values survive
 * material merge without acquiring anatomical or provenance certification.
 * Present metadata and its accessor must agree with resident Float32 geometry.
 * The existing engine resolver admits aliases and nullable legacy semantics;
 * returned arrays are owned and no primitive or caller record is mutated.
 *
 * @evidence contracts/common.md#principled-implementation Resident Float32 XYZ, complete unsigned triangles and aligned unnormalized Uint16 low/high references carry the versioned source table. typia admits its shape and the engine resolver checks aliases/reference semantics; orphan metadata refuses.
 * @evidence contracts/common.md#clear-and-simple-design This reader owns physical-source transport admission, reusing the engine's canonical pair resolver while exporters independently decide anatomical qualification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The radix 65536 encodes unsigned 32-bit references; zero is declared nullable legacy incidence, with no synthesized IDs, primitive mutation or specimen exception.
 * @evidence contracts/common.md#meaningful-documentation The prose gives accessor format, index-plus-one lookup, legacy absence, owned output and lack of anatomical or provenance certification.
 * @evidence contracts/performance.md#efficient-algorithms For S source pairs, V vertices and I indices, admission costs O(S+V+I) plus source-key work; restored arrays and validation positions occupy O(S+V) space.
 * @evidence contracts/performance.md#reuse-equivalent-work The engine resolver supplies shared pair/reference semantics; no primitive-read cache assumes mutable accessors or extras remain equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Restored pairs/references transfer to the caller; copied validation positions and other call-local arrays become unreachable on completion or refusal, with no persistent primitive handles.
 */
export function readHumanMeshPhysicalVertices(
  primitive: Primitive,
): IAutoMovieMesh["physicalVertices"] {
  const extras: ReturnType<Primitive["getExtras"]> = primitive.getExtras();
  const attribute: Accessor | null = primitive.getAttribute("_AUTOMOVIE_PHYSICAL_SOURCE");
  if (!Object.hasOwn(extras, "automoviePhysicalVertices")) {
    if (attribute !== null)
      throw new Error(
        "Orphan physical source accessor without its source-pair table.",
      );
    return undefined;
  }
  const input: unknown = extras.automoviePhysicalVertices;
  if (
    input !== null &&
    typeof input === "object" &&
    "version" in input &&
    input.version !== 1
  )
    throw new Error("Unsupported physical source namespace version.");
  const record: IHumanMeshPhysicalSourceTable = typia.assertEquals<IHumanMeshPhysicalSourceTable>(input);
  const positions: Accessor | null = primitive.getAttribute("POSITION");
  const indices: Accessor | null = primitive.getIndices();
  const xyz: ReturnType<Accessor["getArray"]> | undefined = positions?.getArray();
  const references: ReturnType<Accessor["getArray"]> | undefined = attribute?.getArray();
  const triangles: ReturnType<Accessor["getArray"]> | undefined = indices?.getArray();
  if (
    primitive.getMode() !== 4 ||
    positions?.getType() !== "VEC3" ||
    !(xyz instanceof Float32Array) ||
    attribute?.getType() !== "VEC2" ||
    !(references instanceof Uint16Array) ||
    attribute.getNormalized() ||
    references.length / 2 !== xyz.length / 3 ||
    indices?.getType() !== "SCALAR" ||
    !(
      triangles instanceof Uint8Array ||
      triangles instanceof Uint16Array ||
      triangles instanceof Uint32Array
    )
  )
    throw new Error(
      "Physical source correspondence needs aligned resident Float32 XYZ, unnormalized Uint16 low/high references and unsigned triangle indices.",
    );
  if (
    triangles.length === 0 ||
    triangles.length % 3 !== 0 ||
    Array.from(triangles).some((vertex: number): boolean => vertex >= positions.getCount())
  )
    throw new Error(
      "Physical source correspondence needs complete in-range actual triangles.",
    );
  const result: NonNullable<IAutoMovieMesh["physicalVertices"]> = {
    sources: record.sources.map((source: IHumanMeshPhysicalSourceTable["sources"][number]): IHumanMeshPhysicalSourceTable["sources"][number] => ({ ...source })),
    vertices: Array.from({ length: references.length / 2 }, (_value: unknown, vertex: number): number | null => {
      const reference: number =
        references[vertex * 2] + 65536 * references[vertex * 2 + 1];
      return reference === 0 ? null : reference - 1;
    }),
  };
  resolveAutoMovieMeshPhysicalVertices({
    positions: Array.from(xyz),
    physicalVertices: result,
  });
  return result;
}
