import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBodyAtlasParts } from "./IHumanBodyAtlasParts";
import type { IHumanBodyAtlasPartsInput } from "./IHumanBodyAtlasPartsInput";
import { isHumanBodyAtlasSourceRecorded } from "./isHumanBodyAtlasSourceRecorded";

/**
 * Carry explicitly selected atlas bones from their registered reference into
 * the current body pose, without deforming them into inferred personal tissue.
 *
 * Exact registered shape is required, treating omitted weights as zero.
 * Unsupported selections, duplicates, unrecorded source rights, missing
 * carriers and changed shape refuse by the anatomical part. An omitted
 * selection emits nothing. The actual acquired surface, not a bone-shaped
 * primitive, reaches the body, person and static export as separate parts.
 * Normal vectors rotate with the surface; source arrays remain caller-owned.
 * Clinical part resolution remains unavailable outside this adapter.
 *
 * @evidence contracts/common.md#principled-implementation Posed times inverse registered reference is a rigid map in the common frame; exact shape admission prevents silently applying an atlas to a different body.
 * @evidence contracts/common.md#clear-and-simple-design One selected-part pass admits provenance, checks registration and copies positioned meshes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No geometry replacement, dimensional rescaling, source-face filtering or clinical certification occurs.
 * @evidence contracts/common.md#meaningful-documentation Names opt-in, refusal, ownership and qualification limits.
 * @evidence contracts/modeling.md#part-identity-and-grouping One atlas part and one material per selected closed bone ID retain correspondence through static export's material grouping.
 * @evidence contracts/modeling.md#parameter-channels Only explicit named inspection selection is consumed; registered shape is a replay condition and no dimensions are inferred.
 * @evidence contracts/modeling.md#emitted-geometry The source mesh vertex and face populations are retained exactly for each selected resource.
 * @evidence contracts/modeling.md#spatial-conventions Registered common-frame metre points are carried by posed rotation times inverse reference rotation; normals receive rotation only.
 * @evidence contracts/modeling.md#shared-boundaries Separate acquired boundaries assert no cartilage continuity, bone-to-skin registration or independently articulated subtalar contact.
 * @evidence contracts/modeling.md#rendered-observation Explicit inspection parts reach the actual body and person static model; atlas registration and supported pose observation remain with the owning campaign record.
 * @evidence contracts/anatomy.md#anatomical-source The actual resource source receipt is retained; authored reference placement supplies no held-out tissue validation or personal reconstruction.
 * @evidence contracts/anatomy.md#permitted-range Exact registered shape refuses unsupported combinations; clinical motion admission remains the body pose owner and rigid replay certifies no tissue clearance.
 * @evidence contracts/anatomy.md#parametric-authority A document selects only named bone IDs, never personal vertices or placement frames.
 */
export function createHumanBodyAtlasParts(input: IHumanBodyAtlasPartsInput): IHumanBodyAtlasParts {
  const result: IHumanBodyAtlasParts = { parts: [], materials: [] };
  const seen = new Set<string>();
  for (const id of input.document.anatomicalInspection ?? []) {
    const refuse = (reason: string): never => {
      throw new Error(`Anatomical atlas inspection ${id}: ${reason}`);
    };
    if (seen.has(id)) refuse("duplicate-part-selection");
    seen.add(id);
    const matches = (input.basis.anatomicalCandidates ?? []).filter((part) => part.id === id);
    if (matches.length !== 1) refuse("source-resource-unavailable-or-ambiguous");
    const resource = matches[0];
    if (!isHumanBodyAtlasSourceRecorded(resource.source) ||
        !/^[a-fA-F0-9]{64}$/.test(resource.compiledMeshSha256))
      refuse("source-provenance-or-rights-unrecorded");
    const registration = resource.registration;
    if (registration.basis !== input.basis.id) refuse("basis-not-registered");
    if (registration.protocol.trim() === "") refuse("registration-protocol-unrecorded");
    const keys = new Set([...Object.keys(registration.shape), ...Object.keys(input.document.shape)]);
    for (const key of keys) {
      const reference = registration.shape[key] ?? 0;
      if (!Number.isFinite(reference) || reference !== (input.document.shape[key] ?? 0))
        refuse("shape-not-registered:" + key);
    }
    const frame = registration.reference;
    if (![...Object.values(frame.position), ...Object.values(frame.rotation)].every(Number.isFinite) ||
        Math.abs(Math.hypot(...Object.values(frame.rotation)) - 1) > 1e-9)
      refuse("invalid-reference-frame");
    const carry = input.transforms.get(registration.bone);
    if (carry === undefined) refuse("attachment-transform-unavailable:" + registration.bone);
    if (resource.mesh.skin !== null) refuse("source-mesh-must-be-rigid");
    const rotation = Quaternion.multiply(carry!.posed.rotation, Quaternion.inverse(frame.rotation));
    const move = (values: number[], point: boolean): number[] => {
      const output: number[] = [];
      for (let at = 0; at < values.length; at += 3) {
        const value: IAutoMovieVector3 = { x: values[at], y: values[at + 1], z: values[at + 2] };
        const rotated = Quaternion.rotateVector(rotation, point ? Vector3.subtract(value, frame.position) : value);
        const placed = point ? Vector3.add(rotated, carry!.posed.position) : rotated;
        output.push(placed.x, placed.y, placed.z);
      }
      return output;
    };
    const material = "anatomical-atlas:" + id;
    result.parts.push({
      id: material,
      name: id + " reference atlas bone (unvalidated personal anatomy)",
      geometry: { type: "mesh", mesh: {
        ...structuredClone(resource.mesh),
        positions: move(resource.mesh.positions, true),
        normals: resource.mesh.normals === null ? null : move(resource.mesh.normals, false),
      } },
      material,
      attachedBone: null,
      transform: null,
    });
    result.materials.push({
      id: material,
      name: id + " atlas inspection finish",
      baseColor: { r: .75, g: .7, b: .55, a: 1, hex: null },
      roughness: .75,
      metallic: 0,
      opacity: 1,
      emissive: null,
      baseColorTexture: null,
      doubleSided: false,
    });
  }
  return result;
}
