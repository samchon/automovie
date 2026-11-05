import { AutoMovieHumanClinicalIk, AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

/**
 * Keep a right wrist at an authored point while the carried wand aims at a world target.
 *
 * @evidence contracts/common.md#implementation-and-ownership The real rightHand carries the0.30m wand. Public clinical IK fits wrist and actual tip with all wrist channels. A16-update capped unresolved result receives at most one additional same-goal16-update preparation call; both actual seeds/results remain in preparation. Geometry is never independently rotated and only the final measured result is returned, without fabricated convergence.
 * @evidence contracts/common.md#authoring-interface Supply the matching fixed-body evaluator, authored pose, current body frame, wrist world point and distinct aim point in metres. The caller consumes the returned pose/output/error and must verify visible reach/contact. This fits one arm only and neither validates collision nor synthesizes a spell.
 */
export function solveDuelWandAim(
  evaluate: AutoMovieHumanSkeleton.PoseEvaluator,
  seed: IAutoMovieHumanPose,
  body: THREE.Object3D,
  wrist: THREE.Vector3,
  aim: THREE.Vector3,
  wandTipLocal: [number, number, number],
): AutoMovieHumanClinicalIk.IResult & { preparation: { totalIterations: number; passes: { seed: IAutoMovieHumanPose; result: Omit<AutoMovieHumanClinicalIk.IResult, "output"> }[] } } {
  if (![...wrist.toArray(), ...aim.toArray()].every(Number.isFinite) || wrist.distanceToSquared(aim) < 1e-8)
    throw new Error("Wand aim requires distinct finite world-metre points");
  body.updateWorldMatrix(true, false);
  const localWrist: THREE.Vector3 = body.worldToLocal(wrist.clone());
  const tip: THREE.Vector3 = wrist.clone().add(aim.clone().sub(wrist).normalize().multiplyScalar(0.30));
  const localTip: THREE.Vector3 = body.worldToLocal(tip);
  const request: AutoMovieHumanClinicalIk.IRequest = {
    channels: [...AutoMovieHumanRigControls.chain({ region: "arm", side: "right" }), "arms.right.wrist.flexion", "arms.right.wrist.radialDeviation"],
    targets: [
      { bone: "rightHand", position: [localWrist.x, localWrist.y, localWrist.z] },
      { bone: "rightHand", localPoint: wandTipLocal, position: [localTip.x, localTip.y, localTip.z] },
    ],
    iterations: 16,
    tolerance: 0.002,
  };
  let result: AutoMovieHumanClinicalIk.IResult = AutoMovieHumanClinicalIk.solve(evaluate, seed, request);
  const { output: _firstOutput, ...first } = result;
  const preparation: { totalIterations: number; passes: { seed: IAutoMovieHumanPose; result: Omit<AutoMovieHumanClinicalIk.IResult, "output"> }[] } = { totalIterations: result.iterations, passes: [structuredClone({ seed, result: first })] };
  if (result.error > request.tolerance! && result.iterations === 16) {
    const nextSeed: IAutoMovieHumanPose = structuredClone(result.pose);
    result = AutoMovieHumanClinicalIk.solve(evaluate, nextSeed, request);
    const { output: _secondOutput, ...second } = result;
    preparation.passes.push(structuredClone({ seed: nextSeed, result: second }));
    preparation.totalIterations += result.iterations;
  }
  return { ...result, preparation };
}
