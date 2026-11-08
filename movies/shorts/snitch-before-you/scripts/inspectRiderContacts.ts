import { AutoMovieHumanClinicalIk, AutoMovieHumanSkeleton, type IAutoMovieHumanPose } from "@automovie/human";

import { humanParameters } from "../src/humanParameters";

/**
 * Compare fixed clinical seeds for one reachable contact before changing its
 * production adapter. This is numerical inspection, not a film controller.
 *
 * @evidence contracts/common.md#implementation-and-ownership Calls the installed Human FK and IK with fixed inputs and reports every seed's actual residual and fitted pose; does not change solver internals, geometry or limits.
 * @evidence contracts/common.md#authoring-interface Returns owned diagnostic records in metres/degrees. Browser import permits inspection against the same Vite-loaded Human runtime; no DOM or persistent state is changed.
 */
export function inspectRiderContacts(): { seed: number[]; error: number; pose: IAutoMovieHumanPose }[] {
  const evaluate: AutoMovieHumanSkeleton.PoseEvaluator = AutoMovieHumanSkeleton.prepare(humanParameters(1.72, true));
  const hip: AutoMovieHumanSkeleton.IPlacement | undefined = evaluate({}).posed.find((p: AutoMovieHumanSkeleton.IPlacement): boolean => p.bone === "hips");
  if (!hip) throw new Error("Missing hips");
  const results: { seed: number[]; error: number; pose: IAutoMovieHumanPose }[] = [];
  for (const shoulder of [0, 45, 90]) {
    for (const rotation of [-45, 0, 60]) {
      for (const elbow of [15, 70, 130]) {
        const pose: IAutoMovieHumanPose = {
          spine: { lumbar: { flexion: 21 }, thoracic: { flexion: 8 } },
          arms: { left: {}, right: { shoulder: { flexion: shoulder, rotation }, elbow: { flexion: elbow } } },
        };
        const solved: AutoMovieHumanClinicalIk.IResult = AutoMovieHumanClinicalIk.solve(evaluate, pose, {
          chain: { region: "arm", side: "right" }, targets: [{ bone: "rightHand", position: [0.48, hip.position[1] - 0.04, -0.045] }], iterations: 16, tolerance: 0.004,
        });
        results.push({ seed: [shoulder, rotation, elbow], error: solved.error, pose: solved.pose });
      }
    }
  }
  return results.sort((a: { error: number }, b: { error: number }): number => a.error - b.error);
}
