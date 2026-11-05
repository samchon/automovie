import { projectileAt } from "@automovie/engine";
import * as THREE from "three";

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
 * @evidence contracts/common.md#implementation-and-ownership Actual finite bearing geometry defines the retained rear-region contact. After the upper web breaks, the cap slides along its tilted underside until its rear lower edge clears the bearing's south edge. The geometry-derived slide distance and its final centre velocity enter public Engine projectileAt; free fall does not begin while bearing contact remains. An authored continuous angular path ends broad-face down at floor contact. This is a kinematic hint with ballistic translation, not a fracture simulation or permanent hinge.
 * @evidence contracts/common.md#authoring-interface Supply restored unrotated cap/bearing and free-flight release after35.25seconds. Return placements, separate webBreakSeconds0.25seconds before that release and derived impact. Retained/sliding contact, upper strip relation, positive solid separation and centre position/velocity joins require assembled checks. FloorY=0 and gravity9.81m/s². The consuming scene must clear both bodies before webBreakSeconds, hide the web then, and apply this controller without independently resetting its cap.
 */
export function createDuelCapMotion(cap: THREE.Group, releaseSeconds: number, bearing: THREE.Mesh): { at: (seconds: number) => CapState; webBreakSeconds: number; impactSeconds: number } {
  if (!Number.isFinite(releaseSeconds) || releaseSeconds <= 35.25 || cap.rotation.x !== 0 || cap.rotation.y !== 0 || cap.rotation.z !== 0)
    throw new Error("Cap preparation requires its unrotated initial state and release after35.25seconds");
  cap.updateWorldMatrix(true, true);
  const bounds: THREE.Box3 = new THREE.Box3().setFromObject(cap);
  const origin: THREE.Vector3 = cap.getWorldPosition(new THREE.Vector3());
  const bearingBounds: THREE.Box3 = new THREE.Box3().setFromObject(bearing);
  const pivot: THREE.Vector3 = new THREE.Vector3(origin.x, bearingBounds.max.y, bearingBounds.max.z);
  const pivotLocal: THREE.Vector3 = cap.worldToLocal(pivot.clone());
  const centreLocal: THREE.Vector3 = cap.worldToLocal(bounds.getCenter(new THREE.Vector3()));
  const halfThickness: number = bounds.getSize(new THREE.Vector3()).y / 2;
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
  const flight: number = (verticalSpeed + Math.sqrt(verticalSpeed * verticalSpeed + 2 * gravity * (releaseCentre.y - halfThickness))) / gravity;
  const impactSeconds: number = releaseSeconds + flight;

  /** Ease one finite phase to its exact end state. */
  function ease(value: number): number {
    const clipped: number = Math.max(0, Math.min(1, value));
    return clipped * clipped * (3 - 2 * clipped);
  }

  return {
    webBreakSeconds, impactSeconds,
    at: (seconds: number): CapState => {
      if (!Number.isFinite(seconds)) throw new Error("Cap time must be finite");
      const released: boolean = seconds >= releaseSeconds;
      const elapsed: number = seconds >= impactSeconds ? flight : Math.max(0, seconds - releaseSeconds);
      const rotationX: number = released ? releaseAngle + (Math.PI - releaseAngle) * ease(elapsed / flight) : 0.16 * ease((seconds - 25.5) / 9.5) + 0.08 * ease((seconds - 35) / (webBreakSeconds - 35));
      let centre: THREE.Vector3;
      if (released) {
        const state: ReturnType<typeof projectileAt> = projectileAt({ origin: { x: releaseCentre.x, y: releaseCentre.y, z: releaseCentre.z }, velocity: { x: 0, y: verticalSpeed, z: southSpeed }, gravity: { x: 0, y: -gravity, z: 0 } }, elapsed);
        centre = new THREE.Vector3(state.position.x, state.position.y, state.position.z);
      } else if (seconds >= webBreakSeconds) {
        const fraction: number = Math.min(1, (seconds - webBreakSeconds) / slideSeconds);
        centre = tippedCentre.clone().add(new THREE.Vector3(0, -slideDrop * fraction * fraction, slideDistance * fraction * fraction));
      } else centre = relativeCentre.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), rotationX).add(pivot);
      const position: THREE.Vector3 = rotationX === 0 ? origin.clone() : centre.clone().sub(centreLocal.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), rotationX));
      return { position, rotationX, centre, landed: seconds >= impactSeconds };
    },
  };
}
