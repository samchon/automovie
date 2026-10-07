import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type { IAutoMovieMesh } from "@automovie/interface";
import type { Primitive } from "@gltf-transform/core";
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
 * @evidence contracts/common.md#principled-implementation One decoded boundary restores lossless source-pair/null lineage and delegates coordinate agreement to the existing engine resolver.
 * @evidence contracts/common.md#clear-and-simple-design Physical incidence is a separate namespace from source-part intervals and anatomical qualification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source IDs are not Float32 attributes, output vertex ordinals, normal islands or inferred coordinate contact.
 * @evidence contracts/common.md#meaningful-documentation States reference encoding, absence, malformed presence, source identity and ownership.
 */
export function readHumanMeshPhysicalVertices(
  primitive: Primitive,
): IAutoMovieMesh["physicalVertices"] {
  const extras = primitive.getExtras();
  const attribute = primitive.getAttribute("_AUTOMOVIE_PHYSICAL_SOURCE");
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
  const record = typia.assertEquals<IHumanMeshPhysicalSourceTable>(input);
  const positions = primitive.getAttribute("POSITION");
  const indices = primitive.getIndices();
  const xyz = positions?.getArray();
  const references = attribute?.getArray();
  const triangles = indices?.getArray();
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
    Array.from(triangles).some((vertex) => vertex >= positions.getCount())
  )
    throw new Error(
      "Physical source correspondence needs complete in-range actual triangles.",
    );
  const result = {
    sources: record.sources.map((source) => ({ ...source })),
    vertices: Array.from({ length: references.length / 2 }, (_, vertex) => {
      const reference =
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
