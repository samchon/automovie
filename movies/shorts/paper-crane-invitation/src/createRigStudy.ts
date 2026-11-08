import type { IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import { createHumanPerformer } from "./createHumanPerformer";

/**
 * Exercise a generic Human reach through the actual Viewer before staging.
 * This diagnostic has no screenplay, character-age or completed-film claim.
 * Target and measured residual share the actor's metre body frame.
 *
 * @evidence contracts/common.md#implementation-and-ownership Reuses Human FK and bounded clinical IK. Target and actual hand markers expose error instead of moving the hand independently. This factory owns every allocated resource until disposal.
 * @evidence contracts/common.md#authoring-interface Seek finite seconds without prior-frame state. The rig query selects this diagnostic separately from the film. Dispose retires its actor and Three resources.
 */
export function createRigStudy(): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  seek: (seconds: number) => number;
  dispose: () => void;
} {
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc8d0d5);
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 30);
  camera.position.set(3.8, 2.0, 3.6);
  camera.lookAt(0, 0.95, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x697486, 2.3));
  const light: THREE.DirectionalLight = new THREE.DirectionalLight(0xfff1dc, 3);
  light.position.set(3, 5, 2);
  scene.add(light);
  const owners: (() => void)[] = [];
  let retired: boolean = false;
  /** Retire every acquired diagnostic owner on failure or caller disposal. */
  const retire: () => void = (): void => {
    if (retired) return;
    retired = true;
    const errors: unknown[] = [];
    for (const owner of owners.reverse()) { try { owner(); } catch (error: unknown) { errors.push(error); } }
    scene.clear();
    if (errors.length) throw new AggregateError(errors, "Rig study retirement failed");
  };
  try {
  const actor: ReturnType<typeof createHumanPerformer> = createHumanPerformer({
    stature: 1.7, female: true, houseColor: 0x23553e,
  });
  owners.push(actor.dispose);
  scene.add(actor.object);
  const ground: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial> = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.02, 4), new THREE.MeshStandardMaterial({ color: 0x8a9298 }),
  );
  owners.push((): void => { ground.geometry.dispose(); ground.material.dispose(); });
  ground.position.y = -0.015;
  scene.add(ground);
  const target: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 12, 8), new THREE.MeshBasicMaterial({ color: 0xe5a127, wireframe: true }),
  );
  owners.push((): void => { target.geometry.dispose(); target.material.dispose(); });
  const hand: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> = new THREE.Mesh(
    new THREE.SphereGeometry(0.012, 12, 8), new THREE.MeshBasicMaterial({ color: 0x318bf0 }),
  );
  owners.push((): void => { hand.geometry.dispose(); hand.material.dispose(); });
  scene.add(target, hand);
  return {
    scene, camera,
    /** Derive the reach from absolute time without accumulated solver state. */
    seek(seconds: number): number {
      if (!Number.isFinite(seconds)) throw new Error("Rig study requires finite seconds");
      const phase: number = (1 - Math.cos(Math.max(0, seconds) * Math.PI / 4)) / 2;
      const point: [number, number, number] = [0.18 + phase * 0.28, 1.12 + phase * 0.12, -0.18];
      const seed: IAutoMovieHumanPose = {
        arms: { left: {}, right: { shoulder: { flexion: 35 }, elbow: { flexion: 70 } } },
      };
      const result: ReturnType<typeof actor.reach> = actor.reach(seed, "right", point);
      target.position.set(...point);
      hand.position.copy(actor.point("rightHand"));
      scene.userData.reachErrorMetres = result.error;
      scene.userData.clamped = result.output.clamped;
      scene.updateMatrixWorld(true);
      return seconds;
    },
    dispose: retire,
  };
  } catch (error: unknown) {
    try { retire(); } catch (cleanup: unknown) { throw new AggregateError([error, cleanup], "Rig construction and cleanup failed"); }
    throw error;
  }
}
