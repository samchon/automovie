import { AutoMovieHumanClinicalIk, AutoMovieHumanRigControls, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";
import type { InspectionPerson } from "../InspectionPerson";
import { fitInspectionPose } from "../fitInspectionPose";

/**
 * Fit a compact bilateral cheek guard on the same original supported actor.
 * @evidence contracts/common.md#implementation-and-ownership Reuses the existing full-foot support fit, then applies public arm IK to the actual Hand-bound glove pads. Measured head sides and unchanged glove extents establish the lower-cheek targets; neither man carries both gloves in an extended forward queue. Arm fitting leaves the already fitted leg/root configuration unchanged. The returned support snapshot replaces its earlier FK with the final arm pose's exact public output, so fresh and cached resets describe the same state.
 * @evidence contracts/common.md#authoring-interface Numerical cheek height and slight forward bias are authored guard choices, not anatomical measurements or contact exemptions. Both actual glove/head surfaces and all subsequent entry surfaces remain available to inspection; residuals are retained rather than labelled success.
 */
export function fitLabGuard(person: InspectionPerson, seed: IAutoMovieHumanPose): ReturnType<typeof fitInspectionPose> {
  const fitted: ReturnType<typeof fitInspectionPose> = fitInspectionPose(person, seed, true);
  let pose: IAutoMovieHumanPose = structuredClone(fitted.support.pose);
  const head: THREE.Box3 = new THREE.Box3().setFromObject(person.drawing.head.object, true);
  const center: THREE.Vector3 = head.getCenter(new THREE.Vector3());
  const extent: THREE.Vector3 = head.getSize(new THREE.Vector3());
  const errors: number[] = [];
  for (const side of ["left", "right"] as const) {
    const glove: THREE.Object3D | undefined = person.object.getObjectByName(`${side}-glove`);
    if (!(glove instanceof THREE.Mesh)) throw new Error(`Missing actual ${side} guard glove`);
    const radius: number = Math.max(glove.scale.x, glove.scale.y, glove.scale.z);
    const target: THREE.Vector3 = new THREE.Vector3(center.x + extent.x * .12, head.min.y + extent.y * .32, side === "left" ? head.max.z + radius : head.min.z - radius);
    const local: THREE.Vector3 = person.object.worldToLocal(target);
    const result: AutoMovieHumanClinicalIk.IResult = AutoMovieHumanClinicalIk.solve(person.evaluate, pose, { chain: { region: "arm", side }, targets: [{ bone: AutoMovieHumanRigControls.joint(`${side}Hand`), localPoint: glove.position.toArray(), position: local.toArray() }], iterations: 16, tolerance: .00025 });
    pose = result.pose;
    errors.push(result.error);
  }
  person.pose(pose);
  person.object.updateWorldMatrix(true, true);
  return { support: { ...fitted.support, pose, output: person.output }, guardErrors: errors };
}
