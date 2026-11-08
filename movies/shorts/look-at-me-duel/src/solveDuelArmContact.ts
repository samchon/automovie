import { AutoMovieHumanClinicalIk, AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

/**
 * Fit one actual hand-bound surface point to a scene-space contact.
 *
 * @evidence contracts/common.md#implementation-and-ownership Human's clinical IK supplies bounded kinematics and honest target residuals. This adapter converts the world target through the current body frame exactly once and includes actual wrist channels when fitting a palm vertex. It never moves displayed geometry independently or substitutes a successful status. The caller owns the measured surface witness and decides whether the returned residual permits contact.
 * @evidence contracts/common.md#authoring-interface Supply the fixed evaluator, complete authored seed, current body Object3D, own-side hand and desired world-metre point. Optional localPoint is an actual rigid hand-local surface witness; omission targets the wrist joint centre. Only that arm's channels change. Returned pose/output/error belong to the same actual solve; world matrices are updated before conversion.
 */
export function solveDuelArmContact(
  evaluate: AutoMovieHumanSkeleton.PoseEvaluator,
  seed: IAutoMovieHumanPose,
  body: THREE.Object3D,
  side: "left" | "right",
  target: THREE.Vector3,
  localPoint?: [number, number, number],
): AutoMovieHumanClinicalIk.IResult {
  if (![target.x, target.y, target.z].every(Number.isFinite))
    throw new Error("Contact target requires finite world metres");
  body.updateWorldMatrix(true, false);
  const local: THREE.Vector3 = body.worldToLocal(target.clone());
  return AutoMovieHumanClinicalIk.solve(evaluate, seed, {
    channels: [...AutoMovieHumanRigControls.chain({ region: "arm", side }), `arms.${side}.wrist.flexion`, `arms.${side}.wrist.radialDeviation`],
    targets: [{ bone: side === "left" ? "leftHand" : "rightHand", position: [local.x, local.y, local.z], ...(localPoint === undefined ? {} : { localPoint }) }],
    iterations: 16,
    tolerance: 0.001,
  });
}
