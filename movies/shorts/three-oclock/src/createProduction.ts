import * as THREE from "three";

import { createHumanActor } from "./actors/createHumanActor";
import { createNoteGrip } from "./actors/createNoteGrip";
import { createCoupledPerformance } from "./actors/createCoupledPerformance";
import { createCourtyard } from "./createCourtyard";
import { durationSeconds } from "./durationSeconds";

/**
 * Stage the rehearsal and unnoticed arrival through actual Human polygons.
 *
 * @evidence contracts/common.md#implementation-and-ownership Owns courtyard, two Human performers, note and exact-time staging. Coupled performance retains the accepted opening and measures actual paper release/gravity and shared forehead contact before consuming the stop, recovery and offered space. Public Human retains full-foot fitting and arm constraints. Current0–48s still ends before pickup/handoff and is not the whole film. Original grip-target residual stays separate from physical face contact. Shared Viewer/Render own display/capture.
 * @evidence contracts/common.md#authoring-interface Returns the scene, camera, exact-time seek and resource disposal. Seconds use the duration shared by src/durationSeconds.ts and render.config.ts.
 */
export function createProduction(): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  seek: (seconds: number) => void;
  prepare: (progress?: (done: number, total: number) => void) => Promise<void>;
  dispose: () => void;
} {
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd6dce0);
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    39,
    9 / 16,
    0.1,
    100,
  );
  camera.position.set(5.5, 2.4, 3.6);
  camera.lookAt(-2.1, 0.85, -0.3);
  const courtyard: ReturnType<typeof createCourtyard> = createCourtyard();
  scene.add(courtyard.object);
  scene.add(new THREE.HemisphereLight(0xf1f3ed, 0x656864, 2.5));
  const sun: THREE.DirectionalLight = new THREE.DirectionalLight(0xfff0d6, 3.2);
  sun.position.set(1.5, 6, 5);
  scene.add(sun);
  const carina: ReturnType<typeof createHumanActor> = createHumanActor("carina");
  const grip: ReturnType<typeof createNoteGrip> = createNoteGrip(carina);
  const harry: ReturnType<typeof createHumanActor> = createHumanActor("harry");
  scene.add(carina.object);
  scene.add(harry.object);
  const paperGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(0.002, 0.15, 0.1);
  const paperMaterial: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0xfffdf2, roughness: 1 });
  const paper: THREE.Mesh = new THREE.Mesh(paperGeometry, paperMaterial);
  paper.name = "carina-invitation-note";
  scene.add(paper);
  const performance: ReturnType<typeof createCoupledPerformance> = createCoupledPerformance(carina, harry, grip, paper, durationSeconds);
  return {
    scene,
    camera,
    prepare: performance.prepare,
    seek: (seconds: number): void => {
      // The new cached tail and its camera share one actual24fps sample.
      if (seconds > 48) seconds = Math.floor(seconds * 24 + 1e-7) / 24;
      const motion: ReturnType<typeof performance.apply> = performance.apply(seconds);
      if (seconds >= 25) {
        camera.position.set(1.6, 1.7, 1.8);
        camera.lookAt(-1.8, 0.85, -0.03);
        camera.fov = 49;
        if (seconds >= 45.3) {
          const phase: number = Math.max(0, Math.min(1, (seconds - 45.3) / 1));
          const pull: number = phase * phase * (3 - 2 * phase);
          camera.position.lerp(new THREE.Vector3(2.3, 1.9, 2.6), pull);
          camera.lookAt(-1.8, 0.85, -0.03 + 0.23 * pull);
        }
        if (seconds >= 50.5 && seconds < 55.1) {
          camera.position.set(1.6, 1.7, 1.8); camera.lookAt(-1.8, 0.85, 0.25); camera.fov = 49;
        }
        if (seconds >= 48.4 && seconds < 50.5) { camera.position.set(-0.1, 1.25, 1.25); camera.lookAt(-1.7, 0.65, -0.15); camera.fov = 49; }
        if (seconds >= 58.4) { camera.position.set(-6.7, 1.9, -0.2); camera.lookAt(-3.3, 0.85, 0.6); camera.fov = 59; }
      } else if (seconds >= 19) {
        camera.position.set(1.4, 1.8, -2.2);
        camera.lookAt(-1.8, 0.9, -0.15);
        camera.fov = 49;
      } else if ((seconds >= 1.5 && seconds < 4.1) || (seconds >= 7.3 && seconds < 11.1)) {
        camera.position.set(-0.6, 1.35, -1.95);
        camera.lookAt(-1.8, 0.88, -0.45);
        camera.fov = 59;
      } else {
        camera.position.set(0.8, 2.1, 7.8);
        camera.lookAt(-2.5, 0.9, -0.25);
        camera.fov = 49;
      }
      camera.updateProjectionMatrix();
      scene.userData.motion = { segment: "0-60 whole rehearsal, shared reach, physical note exchange and departure draft", time: seconds, ...motion, gripPreferredTargetError: grip.error, gripTargetConverged: grip.error <= 0.0015, gripTrials: seconds === 0 ? grip.trials : undefined, forearmPronation: grip.forearmPronation, paperFacingHolder: grip.facingAlignment, camera: camera.position.toArray() };
      scene.updateMatrixWorld(true);
    },
    dispose: (): void => {
      carina.dispose();
      harry.dispose();
      courtyard.dispose();
      paperGeometry.dispose();
      paperMaterial.dispose();
      scene.clear();
    },
  };
}
