import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import type { IAutoMovieHumanBodySourceVertexBinding } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodySourceVertexBinding";
import { createHash } from "node:crypto";

import { readHumanBodyMaterialSignedIntegral } from "../human-source/body-anatomy/readHumanBodyMaterialSignedIntegral.ts";
import type { IHumanTrunkSourceChart } from "./IHumanTrunkSourceChart.ts";

/** A complete original raw graph and byte-identified source replacements. @author Samchon */
interface IHumanTrunkAssemblyInput {
  assembly: IAutoMovieHumanBodyAnatomicalAssembly;
  translation: readonly number[];
  generation: string;
  replacements: readonly IHumanTrunkAssemblyReplacement[];
}

/** One original member's authored A geometry and matching carry. @author Samchon */
interface IHumanTrunkAssemblyReplacement {
  part: string;
  originalMesh: IHumanTrunkSourceChart["mesh"];
  mesh: IHumanTrunkSourceChart["mesh"];
  binding: IAutoMovieHumanBodySourceVertexBinding;
  originalUri: string;
  originalSha256: string;
  uri: string;
  sha256: string;
}

/** Fresh assembly and compact material lineage; no clinical admission. @author Samchon */
interface IHumanTrunkAssemblyResult {
  assembly: IAutoMovieHumanBodyAnatomicalAssembly;
  readings: IHumanTrunkAssemblyReading[];
}

/** Actual source-frame conversion and retained original quantity. @author Samchon */
interface IHumanTrunkAssemblyReading {
  part: string;
  member: string;
  originalSource: unknown;
  sourceUri: string;
  sourceSha256: string;
  compiledMeshSha256: string;
  originalAtlasQuantity: number;
  parentCanonicalQuantity: number;
  derivativeCanonicalQuantity: number;
  vertices: number;
  triangles: number;
}

/**
 * Derive a fresh canonical source assembly from byte-bound atlas charts.
 * A-to-C is only the supplied translation in metres; no fitting, scaling,
 * mirroring or inferred body-sized offset occurs. Every original C coordinate
 * is first checked against original A plus that same explicit translation.
 * Source URI, raw bytes, original triangle ordinals and compiled C identity
 * must address the predecessor before a member can be replaced.
 *
 * Only replaced part/surface records and the two generation headers copy.
 * Unaffected parts, rig nodes/sites, shape, rights and field ranges retain
 * their actual original values and references. This avoids another complete
 * large-assembly hydration. Existing source fields on a replacement refuse:
 * a chart cannot silently copy a field defined on a different geometry.
 * Named bone/site attachments stay original; shell contact and clinical
 * registration remain separate from those graph addresses.
 * The caller owns file bytes and the generation's parent/recipe receipt.
 */
export function deriveHumanTrunkSourceAssembly(
  input: IHumanTrunkAssemblyInput,
): IHumanTrunkAssemblyResult {
  const { assembly, translation, generation, replacements } = input;
  if (assembly.mode !== "neutral-only" || assembly.rig.generation !== assembly.generation ||
      translation.length !== 3 || !translation.every(Number.isFinite) || generation.length === 0)
    throw new Error("Source derivation needs one identified held raw graph and explicit finite A-to-C translation.");
  const patches = new Map(replacements.map((value) => [value.part, value]));
  if (patches.size !== replacements.length) throw new Error("A source member cannot have two competing replacements.");
  const hash = (value: unknown): string => createHash("sha256").update(JSON.stringify(value)).digest("hex");
  const readings: IHumanTrunkAssemblyReading[] = [];
  const parts = assembly.parts.map((part) => {
    const patch = patches.get(part.id);
    if (patch === undefined) return part;
    if (part.surfaces.length !== 1 || (part.shapeFields?.length ?? 0) !== 0)
      throw new Error("Chart derivation cannot reinterpret multiple members or original material fields: " + part.id);
    const previous = part.surfaces[0];
    const original = patch.originalMesh;
    if (previous.source.uri !== patch.originalUri || previous.source.sha256 !== patch.originalSha256 ||
        previous.compiledMeshSha256 !== hash(previous.mesh) || previous.mesh.indices === null ||
        previous.mesh.positions.length !== original.positions.length ||
        previous.mesh.indices.length !== original.indices.length ||
        previous.mesh.indices.some((value, at) => value !== original.indices[at]))
      throw new Error("Raw canonical predecessor does not address the original atlas member: " + part.id);
    for (let at = 0; at < original.positions.length; at++)
      if (previous.mesh.positions[at] !== original.positions[at] + translation[at % 3])
        throw new Error("Original atlas/canonical point is not the supplied one-time translation: " + part.id);
    if (patch.mesh.positions.length !== original.positions.length || patch.mesh.indices.length !== original.indices.length ||
        patch.mesh.indices.some((value, at) => value !== original.indices[at]) ||
        patch.binding.bones.length !== previous.binding.bones.length ||
        new Set(patch.binding.bones).size !== patch.binding.bones.length ||
        new Set(previous.binding.bones).size !== previous.binding.bones.length ||
        patch.binding.bones.some((bone) => !previous.binding.bones.includes(bone)))
      throw new Error("Source derivation changes original material ordinals or eligible bones: " + part.id);
    const vertices = original.positions.length / 3;
    if (patch.binding.boneIndices.length !== 4 * vertices || patch.binding.weights.length !== 4 * vertices)
      throw new Error("Source carry does not retain four slots per actual material station: " + part.id);
    for (let vertex = 0; vertex < vertices; vertex++) {
      let total = 0;
      for (let slot = 0; slot < 4; slot++) {
        const at = 4 * vertex + slot;
        const ordinal = patch.binding.boneIndices[at], weight = patch.binding.weights[at];
        if (!Number.isSafeInteger(ordinal) || ordinal < 0 || ordinal >= patch.binding.bones.length ||
            !Number.isFinite(weight) || weight < 0)
          throw new Error("Source carry has an invalid original bone ordinal or weight: " + part.id);
        total += weight;
      }
      // Same normalization boundary as the actual anatomical assembly consumer.
      if (Math.abs(total - 1) > 1e-8) throw new Error("Source carry weights do not sum to one: " + part.id);
    }
    const mesh: IHumanTrunkSourceChart["mesh"] = { ...patch.mesh,
      positions: patch.mesh.positions.map((value, at) => value + translation[at % 3]) };
    const originalAtlasQuantity = readHumanBodyMaterialSignedIntegral(original.positions, original.indices).value;
    const parentCanonicalQuantity = readHumanBodyMaterialSignedIntegral(previous.mesh.positions, previous.mesh.indices).value;
    const derivativeCanonicalQuantity = readHumanBodyMaterialSignedIntegral(mesh.positions, mesh.indices).value;
    if (!(derivativeCanonicalQuantity > 0) ||
        Math.abs(derivativeCanonicalQuantity - originalAtlasQuantity) > 256 * Number.EPSILON * originalAtlasQuantity)
      throw new Error("Canonical translation lost the original source signed quantity: " + part.id);
    const compiledMeshSha256 = hash(mesh);
    readings.push({ part: part.id, member: previous.id, originalSource: previous.source,
      sourceUri: patch.uri, sourceSha256: patch.sha256, compiledMeshSha256,
      originalAtlasQuantity, parentCanonicalQuantity, derivativeCanonicalQuantity,
      vertices: mesh.positions.length / 3, triangles: mesh.indices.length / 3 });
    const surfaces: IAutoMovieHumanBodyAnatomicalAssembly["parts"][number]["surfaces"] = [{ ...previous, mesh, binding: patch.binding, compiledMeshSha256,
      source: { ...previous.source, uri: patch.uri, sha256: patch.sha256, revision: generation,
        acquisition: previous.source.acquisition + "; derivative continuous atlas chart and matching named-attachment carry; predecessor " +
          previous.source.uri + " SHA256 " + previous.source.sha256 + "; one explicit A-to-C translation; no clinical or target-frame admission" } }];
    return { ...part, surfaces };
  });
  if (readings.length !== replacements.length) throw new Error("Source replacement names a member absent from the original whole graph.");
  return { assembly: { ...assembly, generation, parts, rig: { ...assembly.rig, generation } }, readings };
}
