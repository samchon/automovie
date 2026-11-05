import { AutoMovieHumanClinicalIk, AutoMovieHumanRigControls, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import type { createDuelActor } from "./createDuelActor";
import type { DuelContactPoint } from "./DuelContactPoint";

/**
 * Fit one actual left-arm surface through bounded public IK and retain its original request.
 * @evidence contracts/common.md#implementation-and-ownership Only the left arm/girdle changes. Real hand witnesses additionally use registered wrist controls; lower-arm/shoulder points do not pretend wrist controls can move their carriers. World goals enter the actor frame once. The raw seed/request/result remains available, including unresolved errors. No visual point is moved independently.
 * @evidence contracts/common.md#authoring-interface Supply the currently placed fixed actor, full seed, actual carrier-local material witness and world-metre target. Returned output belongs to that public16-update/1mm solve. The caller inspects final contact and preserves unrelated legs/right wand; no convergence is promised.
 */
export function fitDuelLeftContact(actor: ReturnType<typeof createDuelActor>, seed: IAutoMovieHumanPose, point: DuelContactPoint, target: THREE.Vector3): {
  input: { seed: IAutoMovieHumanPose; root: { translation: [number, number, number]; rotation: [number, number, number, number] }; request: AutoMovieHumanClinicalIk.IRequest };
  result: AutoMovieHumanClinicalIk.IResult;
} {
  actor.object.updateWorldMatrix(true, true);
  const local: THREE.Vector3 = actor.object.worldToLocal(target.clone());
  const request: AutoMovieHumanClinicalIk.IRequest = { channels: [...AutoMovieHumanRigControls.chain({ region: "arm", side: "left" }), ...(point.bone === "leftHand" ? ["arms.left.wrist.flexion", "arms.left.wrist.radialDeviation"] as const : [])], targets: [{ ...point, position: [local.x, local.y, local.z] }], iterations: 16, tolerance: 0.001 };
  const position: THREE.Vector3 = actor.object.getWorldPosition(new THREE.Vector3());
  const rotation: THREE.Quaternion = actor.object.getWorldQuaternion(new THREE.Quaternion());
  return { input: { seed: structuredClone(seed), root: { translation: [position.x, position.y, position.z], rotation: [rotation.x, rotation.y, rotation.z, rotation.w] }, request: structuredClone(request) }, result: AutoMovieHumanClinicalIk.solve(actor.evaluate, seed, request) };
}
