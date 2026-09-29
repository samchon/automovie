/**
 * Typed boundary for the native browser scene uploader shared by the live
 * inspector and website. The producer's world-space wire contract remains in
 * scenePayload.ts. The mounting host supplies decoded images and owns release.
 */
import type * as THREE from "three";

import type { IViewerScene, IViewerSceneItem } from "./scenePayload";

/** Upload one native part, including its physical finish or mirror surface. */
export function buildMesh(
  item: IViewerSceneItem,
  textures: Map<string, THREE.Texture>,
): THREE.Mesh;

/** Upload native meshes and the authored or calibration light rig. */
export function buildScene(
  payload: IViewerScene,
  textures: Map<string, THREE.Texture>,
  renderer: { toneMappingExposure: number },
): THREE.Scene;
