import * as THREE from "three";

import type { AutoMovieRenderModeMesh } from "./AutoMovieRenderModeMesh.js";
import type { IAutoMovieRenderModeHandle } from "./IAutoMovieRenderModeHandle.js";
import { POSE_OVERLAY_NAME } from "./POSE_OVERLAY_NAME.js";
import { collectAutoMovieRenderModeMeshes } from "./collectAutoMovieRenderModeMeshes.js";
import { guardAutoMovieRenderModeRetirement } from "./guardAutoMovieRenderModeRetirement.js";
import { restoreAutoMovieRenderModeOnce } from "./restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * Hide meshes and draw actual bone-to-child-bone segments over black.
 *
 * Uses current world transforms from the real scene Bone hierarchy. Anonymous
 * instanced members without Bone objects have no pose overlay. Returned restore
 * retires line geometry/material and restores exact prior mesh visibility.
 * Active or failed scene retirement refuses before setup; failed restore keeps
 * its overlay resources, prior visibility and original cause reachable.
 *
 * @evidence contracts/common.md#principled-implementation Updates world matrices and joins each actual child Bone to its immediate Bone parent in world metres, hiding source meshes; root bones and nonbone parents create no segment, and anonymous instanced populations have no scene-bone representation to draw.
 * @evidence contracts/common.md#clear-and-simple-design Reads the existing pose graph rather than constructing a second skeleton or inferred anatomical connectivity; one shared line material and a named temporary group own this guide projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses actual world positions and parent identities without authored fixture joints or replacement matrix methods; missing bone graph is a reported representation gap, not filled by a guessed pose.
 * @evidence contracts/common.md#meaningful-documentation States mesh hiding, parent-child world-space segment interpretation, instanced-member omission and exact visibility/resource restore ownership.
 * @evidence contracts/performance.md#efficient-algorithms Collects M meshes, updates/traverses O scene nodes and allocates B two-point line geometries plus one material for B parent-child bone links; CPU/storage are O(M+O+B) and no mesh vertex buffers are copied.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses current scene world transforms and one line material during this snapshot; scene pose can change, so separate installations rebuild world-space segments instead of retaining a stale graph-only overlay.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns the temporary group/line geometries/material until memoized restore; independent cleanup removes/disposes them and restores borrowed visibility/background. Partial construction failure before returning the handle has no outer rollback here.
 */
export const applyPoseMode: (
  scene: THREE.Scene,
) => IAutoMovieRenderModeHandle = (
  scene: THREE.Scene,
): IAutoMovieRenderModeHandle => {
  guardAutoMovieRenderModeRetirement(scene);
  const background:
    | THREE.Color
    | THREE.Texture<unknown, THREE.TextureEventMap>
    | null = scene.background;
  scene.background = new THREE.Color(0x000000);
  const hidden: { mesh: AutoMovieRenderModeMesh; visible: boolean }[] =
    collectAutoMovieRenderModeMeshes(scene).map(
      (
        mesh: AutoMovieRenderModeMesh,
      ): { mesh: AutoMovieRenderModeMesh; visible: boolean } => {
        const visible: boolean = mesh.visible;
        mesh.visible = false;
        return { mesh, visible };
      },
    );

  scene.updateWorldMatrix(true, true);
  const overlay: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
  overlay.name = POSE_OVERLAY_NAME;
  const material: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
  });
  scene.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    const bone: THREE.Bone<THREE.Object3DEventMap> = object as THREE.Bone;
    if (bone.isBone !== true) return;
    const parent: THREE.Bone<THREE.Object3DEventMap> | null =
      bone.parent as THREE.Bone | null;
    if (parent === null || parent.isBone !== true) return;
    const from: THREE.Vector3 = new THREE.Vector3().setFromMatrixPosition(
      parent.matrixWorld,
    );
    const to: THREE.Vector3 = new THREE.Vector3().setFromMatrixPosition(
      bone.matrixWorld,
    );
    const geometry: THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    > = new THREE.BufferGeometry().setFromPoints([from, to]);
    overlay.add(new THREE.Line(geometry, material));
  });
  scene.add(overlay);

  return {
    mode: "pose",
    semantic: null,
    restore: restoreAutoMovieRenderModeOnce((): void => {
      guardAutoMovieRenderModeRetirement(scene, {
        run: (): void => {
          restoreAutoMovieRenderModeState([
            (): void => {
              scene.remove(overlay);
            },
            ...overlay.children.map(
              (child: THREE.Object3D): (() => void) =>
                (): void => {
                  (child as THREE.Line).geometry.dispose();
                },
            ),
            (): void => {
              material.dispose();
            },
            ...hidden.map(
              ({
                mesh,
                visible,
              }: {
                mesh: AutoMovieRenderModeMesh;
                visible: boolean;
              }): (() => void) =>
                (): void => {
                  mesh.visible = visible;
                },
            ),
            (): void => {
              scene.background = background;
            },
          ]);
        },
      });
    }),
  };
};
