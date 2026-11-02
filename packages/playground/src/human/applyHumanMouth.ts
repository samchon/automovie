import { invalidateAutoMovieSkinnedPose } from "@automovie/viewer";
import * as THREE from "three";

import { AutoMovieHumanMouthDeformation } from "../../../human/src/expression/AutoMovieHumanMouthDeformation";
import type { AutoMovieHumanMouthExpression } from "../../../human/src/expression/AutoMovieHumanMouthExpression";

/**
 * Move the displayed skin, lining and tongue of a Human by a resolved mouth,
 * at their bind positions before skinning, and return the undo.
 *
 * The Human carries no shape per expression, so the page writes the
 * displacement of `AutoMovieHumanMouthDeformation` into the bind position and
 * normal buffers of the parts it moves; the GPU skin then carries the jaw's
 * pose over them as over the rest of the skin. The buffers belong to the
 * page's only instance of the shape, so no other figure sees the change, and
 * the returned undo writes the bind buffers back.
 *
 * @param parts The built parts by id.
 * @param context The body's mouth and jaw.
 * @param resolved The mouth to show.
 * @param scale Metres per calibration millimetre.
 * @returns A function that restores every buffer written.
 *
 * @evidence contracts/common.md#principled-implementation Displaces each vertex by the Human's own field at its bind place and turns its normal by the field's derivative, the order the model's morph targets would take (before skinning), so the jaw's pose composes over it.
 * @evidence contracts/common.md#clear-and-simple-design The page's one writer of mouth displacements; the field and the expression belong to the Human package.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Writes only the parts the field moves and keeps their originals; no other buffer or the model's data is touched.
 * @evidence contracts/common.md#meaningful-documentation States the frame, the order relative to skinning, the ownership premise and the undo.
 * @evidence contracts/performance.md#efficient-algorithms One field evaluation and six difference evaluations per vertex within the mouth's reach; vertices farther away are skipped by one distance test.
 * @evidence contracts/performance.md#reuse-equivalent-work The undo keeps the original arrays, so going back to rest computes nothing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains copies of the written buffers until the undo runs.
 */
export function applyHumanMouth(
  parts: ReadonlyMap<string, THREE.Object3D>,
  context: AutoMovieHumanMouthDeformation.IContext,
  resolved: AutoMovieHumanMouthExpression.IResolved,
  scale: number,
): () => void {
  const field: AutoMovieHumanMouthDeformation.Field =
    AutoMovieHumanMouthDeformation.field(context, resolved, resolved.opening);
  const undo: (() => void)[] = [];
  for (const [id, object] of parts) {
    if (!MOVED.test(id)) continue;
    object.traverse((node: THREE.Object3D): void => {
      const mesh: THREE.Mesh = node as THREE.Mesh;
      if (mesh.isMesh !== true) return;
      const position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
        mesh.geometry.getAttribute("position");
      const normal: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined =
        mesh.geometry.getAttribute("normal");
      if (!(position instanceof THREE.BufferAttribute)) return;
      const moved = AutoMovieHumanMouthDeformation.displace(
        position.array,
        normal instanceof THREE.BufferAttribute ? normal.array : null,
        scale,
        field,
        id === "human.mouth.tongue",
        context.mouth,
      );
      if (moved === null) return;
      const before: Float32Array = Float32Array.from(position.array);
      const beforeNormal: Float32Array | null =
        normal instanceof THREE.BufferAttribute ? Float32Array.from(normal.array) : null;
      (position.array as Float32Array).set(moved.positions);
      position.needsUpdate = true;
      if (beforeNormal !== null && moved.normals !== null) {
        ((normal as THREE.BufferAttribute).array as Float32Array).set(moved.normals);
        (normal as THREE.BufferAttribute).needsUpdate = true;
      }
      mesh.geometry.computeBoundingSphere();

      // A skinned part's bounds are its own, not the geometry's.
      invalidateAutoMovieSkinnedPose(mesh);
      undo.push((): void => {
        (position.array as Float32Array).set(before);
        position.needsUpdate = true;
        if (beforeNormal !== null) {
          ((normal as THREE.BufferAttribute).array as Float32Array).set(beforeNormal);
          (normal as THREE.BufferAttribute).needsUpdate = true;
        }
        mesh.geometry.computeBoundingSphere();
        invalidateAutoMovieSkinnedPose(mesh);
      });
    });
  }
  return (): void => {
    for (const restore of undo) restore();
  };
}

/** Parts the mouth moves: the skin, its pockets, the lining and the tongue. */
const MOVED: RegExp = /^human\.(skin|cavity)\.|^human\.mouth\.(lining|tongue)$/;
