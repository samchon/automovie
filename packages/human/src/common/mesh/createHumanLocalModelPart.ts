import { Matrix4 } from "@automovie/engine";
import type { IAutoMovieModelPart } from "@automovie/interface";

import type { IHumanLocalMeshFrame } from "./IHumanLocalMeshFrame";
import { createHumanLocalMeshFrame } from "./createHumanLocalMeshFrame";

/**
 * Publish a static mesh in its prepared local frame using ordinary part TRS.
 * The original linear transform stays unchanged; its translation carries the
 * local origin through the existing engine matrix composition.
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
