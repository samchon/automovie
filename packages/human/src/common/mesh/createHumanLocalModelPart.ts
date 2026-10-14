import { Matrix4 } from "@automovie/engine";
import type { IAutoMovieModelPart } from "@automovie/interface";

import type { IHumanLocalMeshFrame } from "./IHumanLocalMeshFrame";
import { createHumanLocalMeshFrame } from "./createHumanLocalMeshFrame";

/**
 * Publish a static mesh in its prepared local frame using ordinary part TRS.
 * The original linear transform stays unchanged; its translation carries the
 * local origin through the existing engine matrix composition.
 *
 * @evidence contracts/common.md#principled-implementation Only static unattached meshes publish; prepared source identity must match unchanged geometry, and engine matrix composition carries the local origin through original linear TRS.
 * @evidence contracts/common.md#clear-and-simple-design Frame admission remains with createHumanLocalMeshFrame; this owner encodes compensating translation and an owned mesh clone in ordinary part data.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No alternate matrix law, tolerance placement or hidden second surface bypasses mismatched-frame refusal.
 * @evidence contracts/common.md#meaningful-documentation The prose states local publication, unchanged linear transform and translated origin; errors identify static/source ownership failures.
 * @evidence contracts/performance.md#efficient-algorithms Unprepared calls include frame validation; publication adds fixed matrix work and O(mesh attributes) structured cloning for owned output.
 * @evidence contracts/performance.md#reuse-equivalent-work A supplied prepared frame avoids preparation only for that unchanged source; current callers transfer it directly and identity alone is not content invalidation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Cloned local mesh/translation transfer to the result owner while prepared/source records remain borrowed, without retained publication handles/tasks.
 */
export function createHumanLocalModelPart(
  part: IAutoMovieModelPart,
  prepared?: IHumanLocalMeshFrame,
): IAutoMovieModelPart {
  if (part.geometry.type !== "mesh" || part.attachedBone !== null || part.geometry.mesh.skin !== null)
    throw new Error("Local human publication requires a static mesh part: " + part.id);
  const frame: IHumanLocalMeshFrame = prepared ?? createHumanLocalMeshFrame(part.geometry.mesh, part.id);
  if (frame.source !== part.geometry.mesh)
    throw new Error("A prepared local frame must belong to the published source mesh.");
  const transform: NonNullable<IAutoMovieModelPart["transform"]> = part.transform ?? {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const placed: ReturnType<typeof Matrix4.multiply> = Matrix4.multiply(
    Matrix4.compose(transform.translation, transform.rotation, transform.scale),
    Matrix4.compose(frame.origin, { x: 0, y: 0, z: 0, w: 1 }, { x: 1, y: 1, z: 1 }),
  );
  return {
    ...part,
    geometry: { type: "mesh", mesh: structuredClone(frame.mesh) },
    transform: { ...transform, translation: Matrix4.position(placed) },
  };
}
