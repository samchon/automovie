import { AutoMovieHumanClinicalIk, AutoMovieHumanRigControls } from "@automovie/human";
import * as THREE from "three";

import type { createDuelActor } from "./createDuelActor";
import type { DuelContactPoint } from "./DuelContactPoint";
import type { fitDuelLeftContact } from "./fitDuelLeftContact";
import type { solveDuelWandAim } from "./solveDuelWandAim";

/**
 * Own the held palm and carried right wand together at the final supported body.
 * @evidence contracts/common.md#implementation-and-ownership One public clinical IK call receives actual left palm/peer forearm and right wrist/rigid tip together. Each arm supplies shoulder3, elbow1 and wrist2, totaling the supported12 channels. Girdle/forearm controls, body placement, lower controls and reserved support remain fixed. The original16-update/contact1mm request is retained without retries, range changes, proxy geometry or local solver. Raw maximum covers three targets; final3mm grip and2mm wand measurements separately decide admission, not a new1mm completion gate.
 * @evidence contracts/common.md#authoring-interface Supply the current placed actor, full supported pose, real leftHand-local palm, actual peer world point and distinct world-metre wrist/aim. The first retained target is the real palm, followed by wrist and tip. World goals enter the current body frame once. Returned preparation records exactly one actual call; it promises neither convergence nor support, and the scene must measure the same final pose's full floor, original soles, ROM and both hands.
 */
export function fitDuelHeldWand(actor: ReturnType<typeof createDuelActor>, seed: Parameters<typeof fitDuelLeftContact>[1], palm: DuelContactPoint, forearm: THREE.Vector3, wrist: THREE.Vector3, aim: THREE.Vector3): ReturnType<typeof fitDuelLeftContact> & { result: ReturnType<typeof solveDuelWandAim> } {
  if (palm.bone !== "leftHand" || ![...palm.localPoint, ...forearm.toArray(), ...wrist.toArray(), ...aim.toArray()].every(Number.isFinite) || wrist.distanceToSquared(aim) < 1e-8) throw new Error("Paired hold requires actual left palm and finite distinct wand goals");
  actor.object.updateWorldMatrix(true, true);
  const tip: THREE.Vector3 = wrist.clone().add(aim.clone().sub(wrist).normalize().multiplyScalar(0.30));
  const local: THREE.Vector3[] = [forearm, wrist, tip].map((point: THREE.Vector3): THREE.Vector3 => actor.object.worldToLocal(point.clone()));
  const channels: AutoMovieHumanRigControls.DegreeChannel[] = (["left", "right"] as const).flatMap((side: "left" | "right"): AutoMovieHumanRigControls.DegreeChannel[] => [
    `arms.${side}.shoulder.flexion`, `arms.${side}.shoulder.abduction`, `arms.${side}.shoulder.rotation`, `arms.${side}.elbow.flexion`, `arms.${side}.wrist.flexion`, `arms.${side}.wrist.radialDeviation`,
  ]);
  const request: AutoMovieHumanClinicalIk.IRequest = {
    channels,
    targets: [{ ...palm, position: local[0]!.toArray() }, { bone: "rightHand", position: local[1]!.toArray() }, { bone: "rightHand", localPoint: actor.wandTipLocal, position: local[2]!.toArray() }],
    iterations: 16, tolerance: 0.001,
  };
  const result: AutoMovieHumanClinicalIk.IResult = AutoMovieHumanClinicalIk.solve(actor.evaluate, seed, request);
  const { output: _output, ...raw } = result;
  const position: THREE.Vector3 = actor.object.getWorldPosition(new THREE.Vector3());
  const rotation: THREE.Quaternion = actor.object.getWorldQuaternion(new THREE.Quaternion());
  return { input: { seed: structuredClone(seed), root: { translation: position.toArray(), rotation: rotation.toArray() }, request: structuredClone(request) }, result: { ...result, preparation: { totalIterations: result.iterations, passes: [{ seed: structuredClone(seed), result: raw }] } } };
}
