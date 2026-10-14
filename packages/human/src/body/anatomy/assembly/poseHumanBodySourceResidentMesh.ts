import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneTransform } from "../../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IAutoMovieHumanBodySourceRigResult } from "../articulation/rig/IAutoMovieHumanBodySourceRigResult";
import type { AutoMovieHumanBodyBoneId } from "../identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodySourceVertexBinding } from "./IAutoMovieHumanBodySourceVertexBinding";
import type { IHumanBodySourceResidentMesh } from "./IHumanBodySourceResidentMesh";
import { createHumanBodySourceResidentMesh } from "./createHumanBodySourceResidentMesh";

/**
 * Pose one admitted source boundary while preserving native binding ordinals through resident compaction.
 *
 * The assembly owner first admits source member identity, attribute cardinality and bone/tissue ownership. Every original four-slot row and source direction is checked before referenced vertices are selected, so unused malformed data cannot disappear. Current posed-times-inverse-rest source frames linearly blend points and directions; directions are normalized and cancellation refuses. The output is new static geometry, source arrays stay unchanged and the supplied refusal callback supplies the anatomical context. This coarse performer certifies neither physiological tissue deformation nor clinical anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Four-slot linear blending uses each actual anatomical bone's posed-times-inverse-rest transform in common metres; native-to-resident correspondence preserves the admitted source rows and finite noncancelled directions are normalized.
 * @evidence contracts/common.md#clear-and-simple-design This per-boundary owner combines source-row admission, resident selection and posing while the assembly coordinator retains anatomical identity, provenance, material and quantity responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every original binding row is admitted before compaction, including unused vertices; no source-specific topology exemption, inferred attachment or clinical certificate repairs an unsupported boundary.
 * @evidence contracts/common.md#meaningful-documentation The prose states assembly prerequisites, four-slot/native correspondence, common frame, direction refusal, unchanged source arrays, contextual failure and coarse-tissue limitations.
 * @evidence contracts/performance.md#efficient-algorithms For V source vertices, R resident vertices, B bound bones and T indices, frame setup is O(B) and fixed-width admission/blending is O(V+R); resident selection and optional normal reconstruction add their own documented costs, with O(R) emitted buffers.
 * @evidence contracts/performance.md#reuse-equivalent-work Each bound bone's carry rotation is computed once and reused for every weighted source point and direction; the one resident correspondence serves both output position and normal buffers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Bound transforms, resident maps and emitted buffers are call-local; only the completed mesh escapes, and refusal releases partial arrays without mutating source geometry or acquiring GPU resources.
 */
export function poseHumanBodySourceResidentMesh(
  mesh: IAutoMovieMesh,
  sourceNormals: readonly number[],
  binding: IAutoMovieHumanBodySourceVertexBinding,
  rig: IAutoMovieHumanBodySourceRigResult,
  geometricNormals: boolean,
  member: string,
  refuse: (reason: string) => never,
): IAutoMovieMesh {
  const transforms: (IAutoMovieHumanBodyBoneTransform & {
    rotation: IAutoMovieQuaternion;
  })[] = binding.bones.map(
    (
      bone: AutoMovieHumanBodyBoneId,
    ): IAutoMovieHumanBodyBoneTransform & {
      rotation: IAutoMovieQuaternion;
    } => {
      const transform: IAutoMovieHumanBodyBoneTransform | undefined =
        rig.bones.get(bone);
      if (transform === undefined) refuse("source-bone-unavailable:" + bone);
      return {
        ...transform!,
        rotation: Quaternion.multiply(
          transform!.posed.rotation,
          Quaternion.inverse(transform!.rest.rotation),
        ),
      };
    },
  );
  // Original binding rows remain source data, including bookkeeping
  // ordinals that no triangle references. Admit every row before selecting
  // resident geometry so malformed unused bindings cannot disappear.
  for (let vertex: number = 0; vertex < mesh.positions.length / 3; vertex++) {
    let sum: number = 0;
    for (let slot: number = 0; slot < 4; slot++) {
      const at: number = vertex * 4 + slot;
      const bone: number = binding.boneIndices[at];
      const weight: number = binding.weights[at];
      if (
        !Number.isSafeInteger(bone) ||
        bone < 0 ||
        bone >= transforms.length ||
        !Number.isFinite(weight) ||
        weight < 0
      )
        refuse("invalid-source-weight:" + member + "/" + vertex);
      sum += weight;
    }
    if (Math.abs(sum - 1) > 1e-8)
      refuse("source-weights-do-not-sum-to-one:" + member + "/" + vertex);
    const sourceNormal: readonly number[] = sourceNormals.slice(
      vertex * 3,
      vertex * 3 + 3,
    );
    if (
      !sourceNormal.every(Number.isFinite) ||
      !(Math.hypot(...sourceNormal) > 0)
    )
      refuse("source-direction-unavailable:" + member + "/" + vertex);
  }
  const resident: IHumanBodySourceResidentMesh =
    createHumanBodySourceResidentMesh(mesh, geometricNormals);
  const positions: number[] = [];
  const normals: number[] = [];
  for (
    let vertex: number = 0;
    vertex < resident.sourceVertices.length;
    vertex++
  ) {
    const originalVertex: number = resident.sourceVertices[vertex];
    const offset: number = vertex * 3;
    const source: IAutoMovieVector3 = {
      x: resident.mesh.positions[offset],
      y: resident.mesh.positions[offset + 1],
      z: resident.mesh.positions[offset + 2],
    };
    const normal: IAutoMovieVector3 = {
      x: resident.mesh.normals![offset],
      y: resident.mesh.normals![offset + 1],
      z: resident.mesh.normals![offset + 2],
    };
    let point: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let direction: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let sum: number = 0;
    for (let slot: number = 0; slot < 4; slot++) {
      const at: number = originalVertex * 4 + slot;
      const bone: number = binding.boneIndices[at];
      const weight: number = binding.weights[at];
      if (
        !Number.isSafeInteger(bone) ||
        bone < 0 ||
        bone >= transforms.length ||
        !Number.isFinite(weight) ||
        weight < 0
      )
        refuse("invalid-source-weight:" + member + "/" + originalVertex);
      const transform: IAutoMovieHumanBodyBoneTransform & {
        rotation: IAutoMovieQuaternion;
      } = transforms[bone];
      const placed: IAutoMovieVector3 = Vector3.add(
        Quaternion.rotateVector(
          transform.rotation,
          Vector3.subtract(source, transform.rest.position),
        ),
        transform.posed.position,
      );
      point = Vector3.add(point, Vector3.scale(placed, weight));
      direction = Vector3.add(
        direction,
        Vector3.scale(
          Quaternion.rotateVector(transform.rotation, normal),
          weight,
        ),
      );
      sum += weight;
    }
    if (Math.abs(sum - 1) > 1e-8)
      refuse(
        "source-weights-do-not-sum-to-one:" + member + "/" + originalVertex,
      );
    const length: number = Math.hypot(direction.x, direction.y, direction.z);
    if (
      !(length > 0) ||
      !Number.isFinite(length) ||
      !Object.values(point).every(Number.isFinite)
    )
      refuse(
        "source-deformation-nonfinite-or-cancelled:" +
          member +
          "/" +
          originalVertex,
      );
    positions.push(point.x, point.y, point.z);
    normals.push(
      direction.x / length,
      direction.y / length,
      direction.z / length,
    );
  }
  return { ...resident.mesh, positions, normals };
}
