import * as THREE from "three";

import { createInspectionRing } from "../assets/ring/createInspectionRing";
import { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";

/** The film and physical inspection use the same ring, lighting and delivered camera without constructing a second performance or soundtrack. */
export function createKickboxingScene(): createKickboxingScene.IStage {
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10151e);
  scene.add(new THREE.HemisphereLight(0xe2efff, 0x635c53, 2.1));
  const light: THREE.DirectionalLight = new THREE.DirectionalLight(0xfff2dc, 3);
  light.position.set(2, 7, 4);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, {
    left: -4,
    right: 4,
    top: 4,
    bottom: -4,
    near: 0.1,
    far: 15,
  });
  scene.add(light);
  const ring: createInspectionRing.Result = createInspectionRing();
  scene.add(ring.object);
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    43,
    1,
    0.02,
    80,
  );
  return {
    scene,
    camera,
    placeCamera: (seconds: number): void => {
      const planned: FilmPlan.Camera = FilmPlan.camera(seconds);
      camera.position.set(...planned.position);
      camera.fov = planned.fovDegrees;
      camera.lookAt(new THREE.Vector3(...planned.target));
      camera.updateProjectionMatrix();
    },
    target: (seconds: number): THREE.Vector3 =>
      new THREE.Vector3(...FilmPlan.camera(seconds).target),
    dispose: (): void => {
      ring.dispose();
      scene.clear();
    },
  };
}

/** One owned scene, with a camera driven by the film's existing shot plan. */
export namespace createKickboxingScene {
  /** Performance and audio are supplied by the mounting consumer. */
  export interface IStage {
    /** Original ring and light population. */
    scene: THREE.Scene;
    /** Original delivered camera. */
    camera: THREE.PerspectiveCamera;
    /** Adopt the film's shot at an absolute second. */
    placeCamera: (seconds: number) => void;
    /** Original inspection orbit centre at that second. */
    target: (seconds: number) => THREE.Vector3;
    /** Release stage resources after the performance. */
    dispose: () => void;
  }
}
