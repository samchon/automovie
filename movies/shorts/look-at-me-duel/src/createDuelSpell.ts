import * as THREE from "three";

import { duelEvents } from "./duelEvents";

/**
 * Show one finite blue-white streak meeting the actual deflecting wand tip.
 *
 * @evidence contracts/common.md#implementation-and-ownership The scene supplies the actual baked launch and deflection endpoints. One directed streak follows those two straight authored magical legs and vanishes at the lower mortar impact; it is not a ballistic simulation or a replacement for Harry's physical sweep. Fixed global frame events supply continuous position at the bend and deterministic seeking.
 * @evidence contracts/common.md#authoring-interface Add the owned object once, call seek with global seconds and actual world-metre endpoints, then dispose. The half-open visible interval is frame536 through578 at24fps; frame560 changes direction and frame579 is the mortar impact. No random particles or external generation run during playback.
 */
export function createDuelSpell(): { object: THREE.Group; seek: (seconds: number, launch: THREE.Vector3, deflect: THREE.Vector3, impact: THREE.Vector3) => void; dispose: () => void } {
  const object: THREE.Group = new THREE.Group();
  const geometry: THREE.CapsuleGeometry = new THREE.CapsuleGeometry(0.012, 0.14, 3, 8);
  const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0xc3efff });
  const streak: THREE.Mesh = new THREE.Mesh(geometry, material);
  object.add(streak);
  object.visible = false;
  return {
    object,
    seek: (seconds: number, launch: THREE.Vector3, deflect: THREE.Vector3, impact: THREE.Vector3): void => {
      object.visible = seconds >= duelEvents.shotLaunch && seconds < duelEvents.mortarImpact;
      if (!object.visible) return;
      const first: boolean = seconds < duelEvents.shotDeflect;
      const origin: THREE.Vector3 = first ? launch : deflect;
      const target: THREE.Vector3 = first ? deflect : impact;
      const start: number = first ? duelEvents.shotLaunch : duelEvents.shotDeflect;
      const end: number = first ? duelEvents.shotDeflect : duelEvents.mortarImpact;
      object.position.copy(origin).lerp(target, (seconds - start) / (end - start));
      const direction: THREE.Vector3 = target.clone().sub(origin).normalize();
      object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    },
    dispose: (): void => { object.removeFromParent(); geometry.dispose(); material.dispose(); },
  };
}
