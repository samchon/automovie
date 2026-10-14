import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneTransform } from "../../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IAutoMovieHumanBodyBoneWorldRest } from "../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { IAutoMovieHumanBodyAtlasPartResource } from "./IAutoMovieHumanBodyAtlasPartResource";
import type { IAutoMovieHumanBodyAtlasRegistration } from "./IAutoMovieHumanBodyAtlasRegistration";
import type { IHumanBodyAtlasParts } from "./IHumanBodyAtlasParts";
import type { IHumanBodyAtlasPartsInput } from "./IHumanBodyAtlasPartsInput";
import { isHumanBodyAtlasSourceRecorded } from "./isHumanBodyAtlasSourceRecorded";

/**
 * Carry explicitly selected atlas bones from their registered reference into the current body pose, without deforming them into inferred personal tissue.
 *
 * Exact registered shape is required, treating omitted weights as zero. Unsupported selections, duplicates, unrecorded source rights, missing carriers and changed shape refuse by the anatomical part. An omitted selection emits nothing. The actual acquired surface, not a bone-shaped primitive, reaches the body, person and static export as separate parts. Normal vectors rotate with the surface; source arrays remain caller-owned. Clinical part resolution remains unavailable outside this adapter.
 *
 * @evidence contracts/common.md#principled-implementation Exact basis/shape and unit reference frames admit selections, then posed-times-inverse-reference rotation/translation rigidly carries positions/normals in common metres.
 * @evidence contracts/common.md#clear-and-simple-design Explicit selection owns resource lookup and diagnostic output; actual body transforms supply current pose.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/ambiguous/duplicate/unqualified resources refuse without bone-shaped substitutes or inferred personal tissue.
 * @evidence contracts/common.md#meaningful-documentation The prose specifies omitted selection, exact shape, rights, refusal classes, static export and unchanged source arrays.
 * @evidence contracts/performance.md#efficient-algorithms For I selections, A resources and V vertices, lookup costs O(IA) and rigid carry O(V); cloned output storage follows mesh attributes.
 * @evidence contracts/performance.md#reuse-equivalent-work One carry rotation serves each part's points/normals; shape/current carrier changes invalidate any prior placement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Partial parts/materials die on refusal; returned meshes own copied attributes without GPU or acquisition handles.
 */
export function createHumanBodyAtlasParts(
  input: IHumanBodyAtlasPartsInput,
): IHumanBodyAtlasParts {
  const result: IHumanBodyAtlasParts = { parts: [], materials: [] };
  const seen: Set<string> = new Set<string>();
  for (const id of input.document.anatomicalInspection ?? []) {
    const refuse: (reason: string) => never = (reason: string): never => {
      throw new Error(`Anatomical atlas inspection ${id}: ${reason}`);
    };
    if (seen.has(id)) refuse("duplicate-part-selection");
    seen.add(id);
    const matches: IAutoMovieHumanBodyAtlasPartResource[] = (
      input.basis.anatomicalCandidates ?? []
    ).filter(
      (part: IAutoMovieHumanBodyAtlasPartResource): boolean => part.id === id,
    );
    if (matches.length !== 1)
      refuse("source-resource-unavailable-or-ambiguous");
    const resource: IAutoMovieHumanBodyAtlasPartResource = matches[0];
    if (
      !isHumanBodyAtlasSourceRecorded(resource.source) ||
      !/^[a-fA-F0-9]{64}$/.test(resource.compiledMeshSha256)
    )
      refuse("source-provenance-or-rights-unrecorded");
    const registration: IAutoMovieHumanBodyAtlasRegistration =
      resource.registration;
    if (registration.basis !== input.basis.id) refuse("basis-not-registered");
    if (registration.protocol.trim() === "")
      refuse("registration-protocol-unrecorded");
    const keys: Set<string> = new Set([
      ...Object.keys(registration.shape),
      ...Object.keys(input.document.shape),
    ]);
    for (const key of keys) {
      const reference: number = registration.shape[key] ?? 0;
      if (
        !Number.isFinite(reference) ||
        reference !== (input.document.shape[key] ?? 0)
      )
        refuse("shape-not-registered:" + key);
    }
    const frame: IAutoMovieHumanBodyBoneWorldRest = registration.reference;
    if (
      ![
        ...Object.values(frame.position),
        ...Object.values(frame.rotation),
      ].every(Number.isFinite) ||
      Math.abs(Math.hypot(...Object.values(frame.rotation)) - 1) > 1e-9
    )
      refuse("invalid-reference-frame");
    const carry: IAutoMovieHumanBodyBoneTransform | undefined =
      input.transforms.get(registration.bone);
    if (carry === undefined)
      refuse("attachment-transform-unavailable:" + registration.bone);
    if (resource.mesh.skin !== null) refuse("source-mesh-must-be-rigid");
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      carry!.posed.rotation,
      Quaternion.inverse(frame.rotation),
    );
    const move: (values: number[], point: boolean) => number[] = (
      values: number[],
      point: boolean,
    ): number[] => {
      const output: number[] = [];
      for (let at: number = 0; at < values.length; at += 3) {
        const value: IAutoMovieVector3 = {
          x: values[at],
          y: values[at + 1],
          z: values[at + 2],
        };
        const rotated: IAutoMovieVector3 = Quaternion.rotateVector(
          rotation,
          point ? Vector3.subtract(value, frame.position) : value,
        );
        const placed: IAutoMovieVector3 = point
          ? Vector3.add(rotated, carry!.posed.position)
          : rotated;
        output.push(placed.x, placed.y, placed.z);
      }
      return output;
    };
    const material: string = "anatomical-atlas:" + id;
    result.parts.push({
      id: material,
      name: id + " reference atlas bone (unvalidated personal anatomy)",
      geometry: {
        type: "mesh",
        mesh: {
          ...structuredClone(resource.mesh),
          positions: move(resource.mesh.positions, true),
          normals:
            resource.mesh.normals === null
              ? null
              : move(resource.mesh.normals, false),
        },
      },
      material,
      attachedBone: null,
      transform: null,
    });
    result.materials.push({
      id: material,
      name: id + " atlas inspection finish",
      baseColor: { r: 0.75, g: 0.7, b: 0.55, a: 1, hex: null },
      roughness: 0.75,
      metallic: 0,
      opacity: 1,
      emissive: null,
      baseColorTexture: null,
      doubleSided: false,
    });
  }
  return result;
}
