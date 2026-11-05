import type { AutoMovieHumanSkeleton, IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import type { createCharacterPerformance } from "./createCharacterPerformance";
import type { createFootControls } from "./createFootControls";
import type { createHumanActor } from "./createHumanActor";

/**
 * Plan a crouch's hip translation from its actual proposed foot placements.
 *
 * @evidence contracts/common.md#implementation-and-ownership Interpolates the accepted leg controls toward an authored98hip/110knee/12ankle crouch, then observes both original anterior shoe witnesses through public FK. Their mean displacement supplies a fixed authoredXZ root course that keeps the original mean support location. It does not free per-frame root translation or assume a knee seed is achieved. The same full-foot fitter still owns actual floor/contact/ROM admission and finalY; actual supported shoulder/hand FK must reach the paper afterward. No private inverse-kinematics formula, anatomy or shoe change is introduced.
 * @evidence contracts/common.md#authoring-interface Supply the same actual actor/support descriptor and owned48s pose/root. at returns a fresh lower-pose seed and nominal world position for bounded0–1 depth. Zero returns the exact accepted root and pose; the intermediate course is derived from fixed clinical inputs. This producer plans contact preservation but is not an admitted crouch, balance or floor-reach certificate. It owns only plain fixed FK observations.
 */
export function createSupportedCrouch(actor: ReturnType<typeof createHumanActor>, feet: ReturnType<typeof createFootControls>, boundary: ReturnType<ReturnType<typeof createCharacterPerformance>["snapshot"]>): {
  at: (amount: number) => { pose: IAutoMovieHumanPose; position: THREE.Vector3 };
} {
  if (feet.owner !== actor.object) throw new Error("Crouch witnesses belong to another actual actor");
  if (boundary.pose.legs?.left === undefined || boundary.pose.legs.right === undefined) throw new Error("Crouch requires both actual accepted leg controls");
  const evaluate: AutoMovieHumanSkeleton.ProjectionEvaluator = actor.evaluate.project?.(["leftFoot", "rightFoot"]) ?? actor.evaluate;
  const rotation: THREE.Quaternion = new THREE.Quaternion(...boundary.root.rotation);

  /** Observe the exact prepared anterior points in the proposed body's frame. */
  function centre(pose: IAutoMovieHumanPose): THREE.Vector3 {
    const output: AutoMovieHumanSkeleton.IProjection = evaluate(pose);
    const sum: THREE.Vector3 = new THREE.Vector3();
    for (const side of ["left", "right"] as const) {
      const point: ReturnType<typeof createFootControls>["descriptor"]["contacts"][number] = feet.descriptor.contacts.find((entry: ReturnType<typeof createFootControls>["descriptor"]["contacts"][number]): boolean => entry.bone === `${side}Foot`)!;
      const at: AutoMovieHumanSkeleton.IPlacement = output.posed.find((entry: AutoMovieHumanSkeleton.IPlacement): boolean => entry.bone === `${side}Foot`)!;
      sum.add(new THREE.Vector3(...point.localPoint).applyQuaternion(new THREE.Quaternion(...at.rotation)).add(new THREE.Vector3(...at.position)));
    }
    return sum.multiplyScalar(0.5).applyQuaternion(rotation);
  }
  const base: IAutoMovieHumanPose = { legs: structuredClone(boundary.pose.legs), ...(boundary.pose.pelvis === undefined ? {} : { pelvis: structuredClone(boundary.pose.pelvis) }) };
  const origin: THREE.Vector3 = centre(base);
  return { at: (amount: number): { pose: IAutoMovieHumanPose; position: THREE.Vector3 } => {
    if (!Number.isFinite(amount) || amount < 0 || amount > 1) throw new Error("Crouch amount must lie within0–1");
    const pose: IAutoMovieHumanPose = structuredClone(base);
    for (const side of ["left", "right"] as const) {
      const leg: NonNullable<NonNullable<IAutoMovieHumanPose["legs"]>["left"]> = pose.legs![side]!;
      leg.hip = { ...leg.hip, flexion: (leg.hip?.flexion ?? 0) * (1 - amount) + 98 * amount };
      leg.knee = { ...leg.knee, flexion: (leg.knee?.flexion ?? 0) * (1 - amount) + 110 * amount };
      leg.ankle = { ...leg.ankle, dorsiflexion: (leg.ankle?.dorsiflexion ?? 0) * (1 - amount) + 12 * amount };
    }
    const displacement: THREE.Vector3 = origin.clone().sub(centre(pose));
    return { pose, position: new THREE.Vector3(boundary.root.translation[0] + displacement.x, 0, boundary.root.translation[2] + displacement.z) };
  } };
}
