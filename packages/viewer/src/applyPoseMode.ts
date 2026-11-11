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
 * Segments are written in world metres from the real scene Bone hierarchy at
 * application, and again by the handle's `update()`, so an override kept across
 * frames follows the pose. The links are the ones the scene holds at
 * application: a bone attached or detached afterwards is not followed.
 * Anonymous instanced members without Bone objects have no pose overlay.
 * Returned restore retires line geometry/material and restores exact prior
 * mesh visibility. Active or failed scene retirement refuses before setup;
 * failed restore keeps its overlay resources, prior visibility and original
 * cause reachable.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Updates world matrices and joins each actual child Bone to its immediate Bone parent in world metres, hiding source meshes; root bones and nonbone parents create no segment, and anonymous instanced populations have no scene-bone representation to draw.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads the existing pose graph rather than constructing a second skeleton or inferred anatomical connectivity; one shared line material and a named temporary group own this guide projection, and one placement routine serves application and every update.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses actual world positions and parent identities without authored fixture joints or replacement matrix methods; missing bone graph is a reported representation gap, not filled by a guessed pose.
 * @evidence contracts/development/common.md#meaningful-documentation States mesh hiding, parent-child world-space segment interpretation, what an update follows and what it does not, instanced-member omission and exact visibility/resource restore ownership.
 * @evidence contracts/development/implementation.md#efficient-algorithms Collects M meshes, traverses O scene nodes and allocates B two-point line geometries plus one material for B parent-child bone links; CPU/storage are O(M+O+B) and no mesh vertex buffers are copied. An update is one world-matrix pass plus B segment writes, with no allocation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses current scene world transforms, one line material and the B geometries built at application; an update rewrites their two points in place instead of rebuilding the overlay.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns the temporary group/line geometries/material until memoized restore; independent cleanup removes/disposes them and restores borrowed visibility/background. Partial construction failure before returning the handle has no outer rollback here.
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

  const overlay: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
  overlay.name = POSE_OVERLAY_NAME;
  const material: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
  });
  // One two-point segment per bone that has a bone parent, remembered with its two ends.
  const links: {
    parent: THREE.Bone;
    bone: THREE.Bone;
    geometry: THREE.BufferGeometry;
    position: THREE.BufferAttribute;
  }[] = [];
  scene.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    const bone: THREE.Bone<THREE.Object3DEventMap> = object as THREE.Bone;
    if (bone.isBone !== true) return;
    const parent: THREE.Bone<THREE.Object3DEventMap> | null =
      bone.parent as THREE.Bone | null;
    if (parent === null || parent.isBone !== true) return;
    const position: THREE.BufferAttribute = new THREE.BufferAttribute(
      new Float32Array(6),
      3,
    );
    const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", position);
    links.push({ parent, bone, geometry, position });
    overlay.add(new THREE.Line(geometry, material));
  });

  // Write every segment from the bones' world positions as they stand now.
  const end: THREE.Vector3 = new THREE.Vector3();
  const place: () => void = (): void => {
    scene.updateWorldMatrix(true, true);
    for (const link of links) {
      end.setFromMatrixPosition(link.parent.matrixWorld);
      link.position.setXYZ(0, end.x, end.y, end.z);
      end.setFromMatrixPosition(link.bone.matrixWorld);
      link.position.setXYZ(1, end.x, end.y, end.z);
      link.position.needsUpdate = true;
      // The renderer culls a line by this sphere, so it moves with the segment.
      link.geometry.computeBoundingSphere();
    }
  };
  place();
  scene.add(overlay);

  return {
    mode: "pose",
    semantic: null,
    update: place,
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
