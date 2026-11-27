import * as THREE from "three";

import type { AutoMovieRenderModeMesh } from "./AutoMovieRenderModeMesh";
import { AutoMovieRenderThreeKind } from "../AutoMovieRenderThreeKind";
import type { IAutoMovieRenderModeHandle } from "../IAutoMovieRenderModeHandle";
import { AutoMovieRenderPoseOverlayName } from "../AutoMovieRenderPoseOverlayName";
import { collectRenderModeMeshes } from "./collectRenderModeMeshes";
import { guardRenderModeRetirement } from "./guardRenderModeRetirement";
import { restoreRenderModeOnce } from "./restoreRenderModeOnce";
import { restoreRenderModeState } from "./restoreRenderModeState";

/*
 * Hide meshes and draw actual bone-to-child-bone segments over black.
 *
 * Segments are written in world metres from the real scene Bone hierarchy at
 * application, and again by the handle's `update()`, so an override kept across
 * frames follows the pose. The links are the ones the scene holds at
 * application: a bone attached or detached afterwards is not followed.
 * Anonymous instanced members without Bone objects have no pose overlay.
 * Returned restore retires line geometry/material and restores exact prior mesh
 * visibility. Active or failed scene retirement refuses before setup; failed
 * restore keeps its overlay resources, prior visibility and original cause
 * reachable.
 */
export const applyPoseMode: (
  scene: THREE.Scene,
) => IAutoMovieRenderModeHandle = (
  scene: THREE.Scene,
): IAutoMovieRenderModeHandle => {
  guardRenderModeRetirement(scene);
  const background:
    | THREE.Color
    | THREE.Texture<unknown, THREE.TextureEventMap>
    | null = scene.background;
  scene.background = new THREE.Color(0x000000);
  const hidden: { mesh: AutoMovieRenderModeMesh; visible: boolean }[] =
    collectRenderModeMeshes(scene).map(
      (
        mesh: AutoMovieRenderModeMesh,
      ): { mesh: AutoMovieRenderModeMesh; visible: boolean } => {
        const visible: boolean = mesh.visible;
        mesh.visible = false;
        return { mesh, visible };
      },
    );

  const overlay: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
  overlay.name = AutoMovieRenderPoseOverlayName;
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
    if (!AutoMovieRenderThreeKind.isBone(object)) return;
    const bone: THREE.Bone = object;
    const parent: THREE.Object3D | null = bone.parent;
    if (parent === null || !AutoMovieRenderThreeKind.isBone(parent)) return;
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
    restore: restoreRenderModeOnce((): void => {
      guardRenderModeRetirement(scene, {
        run: (): void => {
          restoreRenderModeState([
            (): void => {
              scene.remove(overlay);
            },
            ...overlay.children.map(
              (child: THREE.Object3D): (() => void) =>
                (): void => {
                  if (AutoMovieRenderThreeKind.isLine(child))
                    child.geometry.dispose();
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
