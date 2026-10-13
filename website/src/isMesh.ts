import * as THREE from "three";

/** Recognizes the Three mesh capability used when counting and merging the manor's entry-local meshes. */
export const isMesh: (object: THREE.Object3D) => object is THREE.Mesh = (object: THREE.Object3D): object is THREE.Mesh =>
  (object as THREE.Mesh).isMesh === true;
