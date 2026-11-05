import { projectileAt } from "@automovie/engine";
import * as THREE from "three";
import { createDuelCapFloor } from "./createDuelCapFloor";

/** A rigid cap placement and its actual centre in the court frame. */
interface CapState {
  position: THREE.Vector3;
  rotationX: number;
  centre: THREE.Vector3;
  landed: boolean;
}

/**
 * Prepare the one cap's retained bearing, release, free fall and broad-face stop.
 *
 * @evidence contracts/common.md#implementation-and-ownership Actual finite bearing geometry owns retained contact and complete rear-edge exit. Retained creep and supported slide are authored constraint approximations, not calibrated support-force calculations. Constant-angle slide supplies zero release spin; torque-free flight preserves it while public Engine projectileAt advances the COM under gravity. The tilted box's lowest corner sets first floor impact. Real floor and finite-base contacts then change velocity/spin; no imposed flat pose or magic turns the principal block.
 * @evidence contracts/common.md#authoring-interface Supply restored unrotated cap/bearing, the actual floor-supported base spanning its width and release after35.25seconds. Returns distinct web break, bearing exit, first impact, rest and physical diagnostics. The consumer must clear whole bodies/props before web break and refuse unadmitted contact response. FloorY0/gravity9.81m/s²; actual geometry, continuity and assembled observations remain required. No fracture or measured mass/material certificate is implied.
 */
export function createDuelCapMotion(cap: THREE.Group, releaseSeconds: number, bearing: THREE.Mesh, base: THREE.Mesh): { at: (seconds: number) => CapState; webBreakSeconds: number; impactSeconds: number; settledSeconds: number; physics: { retained: string; gravity: number; releaseAngularVelocity: number; floor: ReturnType<typeof createDuelCapFloor>["diagnostics"] } } {
  if (!Number.isFinite(releaseSeconds) || releaseSeconds <= 35.25 || cap.rotation.x !== 0 || cap.rotation.y !== 0 || cap.rotation.z !== 0)
    throw new Error("Cap preparation requires its unrotated initial state and release after35.25seconds");
  cap.updateWorldMatrix(true, true);
  const solids: THREE.Object3D[] = cap.children.filter((item: THREE.Object3D): boolean => item instanceof THREE.Mesh);
  if (solids.length !== 1 || !(solids[0] instanceof THREE.Mesh) || !(solids[0].geometry instanceof THREE.BoxGeometry)) throw new Error("Cap inertia requires the actual single uniform rectangular stone");
  const bounds: THREE.Box3 = new THREE.Box3().setFromObject(cap);
  const origin: THREE.Vector3 = cap.getWorldPosition(new THREE.Vector3());
  const bearingBounds: THREE.Box3 = new THREE.Box3().setFromObject(bearing);
  const pivot: THREE.Vector3 = new THREE.Vector3(origin.x, bearingBounds.max.y, bearingBounds.max.z);
  const pivotLocal: THREE.Vector3 = cap.worldToLocal(pivot.clone());
  const centreLocal: THREE.Vector3 = cap.worldToLocal(bounds.getCenter(new THREE.Vector3()));
  const size: THREE.Vector3 = bounds.getSize(new THREE.Vector3());
  const baseBounds: THREE.Box3 = new THREE.Box3().setFromObject(base);
  if (baseBounds.min.x > bounds.min.x || baseBounds.max.x < bounds.max.x || Math.abs(baseBounds.min.y) > 1e-8) throw new Error("Planar base response requires the actual floor-supported base spanning the cap width");
  const halfThickness: number = size.y / 2;
  if (!(halfThickness > 0) || ![...pivot.toArray(), ...centreLocal.toArray(), halfThickness].every(Number.isFinite) || pivotLocal.z < 0 || pivotLocal.z >= centreLocal.z || Math.abs(pivotLocal.y) > 1e-8) throw new Error("Cap requires an actual rear-underside bearing contact");
  const releaseAngle: number = 0.24;
  const slideSeconds: number = 0.25;
  const webBreakSeconds: number = releaseSeconds - slideSeconds;
  const slideDistance: number = pivotLocal.z * Math.cos(releaseAngle);
  const slideDrop: number = slideDistance * Math.tan(releaseAngle);
  const relativeCentre: THREE.Vector3 = centreLocal.clone().sub(pivotLocal);
  const tippedCentre: THREE.Vector3 = relativeCentre.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), releaseAngle).add(pivot);
  const releaseCentre: THREE.Vector3 = tippedCentre.clone().add(new THREE.Vector3(0, -slideDrop, slideDistance));
  const gravity: number = 9.81;
  const verticalSpeed: number = -2 * slideDrop / slideSeconds;
  const southSpeed: number = 2 * slideDistance / slideSeconds;
  const angularVelocity: number = 0;
  const firstContactHeight: number = halfThickness * Math.cos(releaseAngle) + size.z / 2 * Math.sin(releaseAngle);
  const flight: number = (verticalSpeed + Math.sqrt(verticalSpeed * verticalSpeed + 2 * gravity * (releaseCentre.y - firstContactHeight))) / gravity;
  const impactSeconds: number = releaseSeconds + flight;
  const impact: ReturnType<typeof projectileAt> = projectileAt({ origin: { x: releaseCentre.x, y: releaseCentre.y, z: releaseCentre.z }, velocity: { x: 0, y: verticalSpeed, z: southSpeed }, gravity: { x: 0, y: -gravity, z: 0 } }, flight);
  const floor: ReturnType<typeof createDuelCapFloor> = createDuelCapFloor(new THREE.Vector3(impact.position.x, impact.position.y, impact.position.z), new THREE.Vector3(impact.velocity.x, impact.velocity.y, impact.velocity.z), releaseAngle, angularVelocity, size.y, size.z, impactSeconds, 4800, { minZ: baseBounds.min.z, maxZ: baseBounds.max.z, top: baseBounds.max.y });

  /** Ease one finite phase to its exact end state. */
  function ease(value: number): number {
    const clipped: number = Math.max(0, Math.min(1, value));
    return clipped * clipped * (3 - 2 * clipped);
  }

  return {
    webBreakSeconds, impactSeconds, settledSeconds: floor.settledSeconds,
    physics: { retained: "Authored creep and supported-slide constraint approximation; no measured support force, friction, fracture or torque proof", gravity, releaseAngularVelocity: angularVelocity, floor: floor.diagnostics },
    at: (seconds: number): CapState => {
      if (!Number.isFinite(seconds)) throw new Error("Cap time must be finite");
      const released: boolean = seconds >= releaseSeconds;
      const elapsed: number = Math.max(0, seconds - releaseSeconds);
      let rotationX: number = released ? releaseAngle + angularVelocity * elapsed : 0.16 * ease((seconds - 25.5) / 9.5) + 0.08 * ease((seconds - 35) / (webBreakSeconds - 35));
      let centre: THREE.Vector3;
      let landed: boolean = false;
      if (seconds >= impactSeconds) {
        const state: ReturnType<typeof floor.at> = floor.at(seconds);
        centre = state.centre;
        rotationX = state.rotationX;
        landed = state.landed;
      } else if (released) {
        const state: ReturnType<typeof projectileAt> = projectileAt({ origin: { x: releaseCentre.x, y: releaseCentre.y, z: releaseCentre.z }, velocity: { x: 0, y: verticalSpeed, z: southSpeed }, gravity: { x: 0, y: -gravity, z: 0 } }, elapsed);
        centre = new THREE.Vector3(state.position.x, state.position.y, state.position.z);
      } else if (seconds >= webBreakSeconds) {
        const fraction: number = Math.min(1, (seconds - webBreakSeconds) / slideSeconds);
        centre = tippedCentre.clone().add(new THREE.Vector3(0, -slideDrop * fraction * fraction, slideDistance * fraction * fraction));
      } else centre = relativeCentre.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), rotationX).add(pivot);
      const position: THREE.Vector3 = rotationX === 0 && !released ? origin.clone() : centre.clone().sub(centreLocal.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), rotationX));
      return { position, rotationX, centre, landed };
    },
  };
}
