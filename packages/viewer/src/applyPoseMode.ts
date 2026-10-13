import {restoreAutoMovieRenderModeState} from "./restoreAutoMovieRenderModeState.js";
import * as THREE from "three";
import type {IAutoMovieRenderModeHandle} from "./IAutoMovieRenderModeHandle.js";
import {collectAutoMovieRenderModeMeshes} from "./collectAutoMovieRenderModeMeshes.js";
import {POSE_OVERLAY_NAME} from "./POSE_OVERLAY_NAME.js";
import {restoreAutoMovieRenderModeOnce} from "./restoreAutoMovieRenderModeOnce.js";

/** Hide meshes and draw bone→child-bone segments over a black background. */
export const applyPoseMode = (scene: THREE.Scene): IAutoMovieRenderModeHandle => {
  const background = scene.background;
  scene.background = new THREE.Color(0x000000);
  const hidden = collectAutoMovieRenderModeMeshes(scene).map((mesh) => {
    const visible = mesh.visible;
    mesh.visible = false;
    return { mesh, visible };
  });

  scene.updateWorldMatrix(true, true);
  const overlay = new THREE.Group();
  overlay.name = POSE_OVERLAY_NAME;
  const material = new THREE.LineBasicMaterial({ color: 0xffffff });
  scene.traverse((object) => {
    const bone = object as THREE.Bone;
    if (bone.isBone !== true) return;
    const parent = bone.parent as THREE.Bone | null;
    if (parent === null || parent.isBone !== true) return;
    const from = new THREE.Vector3().setFromMatrixPosition(parent.matrixWorld);
    const to = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
    const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
    overlay.add(new THREE.Line(geometry, material));
  });
  scene.add(overlay);

  return {
    mode: "pose",
    semantic: null,
    restore: restoreAutoMovieRenderModeOnce(() => {
      restoreAutoMovieRenderModeState([
        ()=>{scene.remove(overlay);},
        ...overlay.children.map(child=>()=>{(child as THREE.Line).geometry.dispose();}),
        ()=>{material.dispose();},
        ...hidden.map(({mesh,visible})=>()=>{mesh.visible=visible;}),
        ()=>{scene.background=background;},
      ]);
    }),
  };
};
