import { Matrix4 } from "@automovie/engine";
import type { IAutoMovieModelPart } from "@automovie/interface";

import type { IHumanLocalMeshFrame } from "./IHumanLocalMeshFrame";
import { createHumanLocalMeshFrame } from "./createHumanLocalMeshFrame";

/**
 * Publish a static mesh in its prepared local frame using ordinary part TRS.
 * The original linear transform stays unchanged; its translation carries the
 * local origin through the existing engine matrix composition.
 *
 * @evidence contracts/common.md#principled-implementation Post-composes the existing TRS with the compensating origin translation.
 * @evidence contracts/common.md#clear-and-simple-design One adapter publishes the prepared frame without another model API.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retains part, material, geometry incidence and existing linear transform.
 * @evidence contracts/common.md#meaningful-documentation States static scope and compensation order.
 * @evidence contracts/modeling.md#spatial-conventions Local metre positions use the ordinary T*R*S part transform.
 * @evidence contracts/modeling.md#shared-boundaries Carries existing physical source correspondence without reassignment.
 * @evidence contracts/modeling.md#emitted-geometry Publishes the same complete mesh in a translated coordinate frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Preserves the caller's identities.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no personal channel.
 * @evidenceExclude contracts/modeling.md#rendered-observation Normal viewer and glTF consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no anatomical dimension.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission remains unchanged.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no authoring control.
 */
export function createHumanLocalModelPart(
  part: IAutoMovieModelPart,
  prepared?: IHumanLocalMeshFrame,
): IAutoMovieModelPart {
  if (part.geometry.type !== "mesh" || part.attachedBone !== null || part.geometry.mesh.skin !== null)
    throw new Error("Local human publication requires a static mesh part: " + part.id);
  const frame = prepared ?? createHumanLocalMeshFrame(part.geometry.mesh, part.id);
  if (frame.source !== part.geometry.mesh)
    throw new Error("A prepared local frame must belong to the published source mesh.");
  const transform = part.transform ?? {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const placed = Matrix4.multiply(
    Matrix4.compose(transform.translation, transform.rotation, transform.scale),
    Matrix4.compose(frame.origin, { x: 0, y: 0, z: 0, w: 1 }, { x: 1, y: 1, z: 1 }),
  );
  return {
    ...part,
    geometry: { type: "mesh", mesh: structuredClone(frame.mesh) },
    transform: { ...transform, translation: Matrix4.position(placed) },
  };
}
