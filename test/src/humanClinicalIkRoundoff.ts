import { AutoMovieHumanClinicalIk as Ik, type AutoMovieHumanSkeleton as Skeleton, type IAutoMovieHumanPose } from "@automovie/human";

import { test_human_clinical_ik_roundoff } from "./features/human/test_human_clinical_ik_roundoff";
import { test_human_clinical_ik } from "./features/motion/test_human_clinical_ik";
import { test_human_clinical_ik_admission } from "./features/motion/test_human_clinical_ik_admission";
import { test_human_clinical_ik_conditioned_pose } from "./features/motion/test_human_clinical_ik_conditioned_pose";
import { test_human_clinical_ik_constraints } from "./features/motion/test_human_clinical_ik_constraints";

/** Run the complete focused clinical round without discovering unrelated Human geometry suites. */
function main(): void {
  if (process.argv.includes("--step-cap-only")) {
    observeStepCap();
    return;
  }
  const failures: string[] = [];
  for (const run of [test_human_clinical_ik_roundoff, test_human_clinical_ik, test_human_clinical_ik_admission, test_human_clinical_ik_conditioned_pose, test_human_clinical_ik_constraints]) {
    try {
      run();
      console.log(`PASS ${run.name}`);
    } catch (error) {
      failures.push(`${run.name}: ${String(error)}`);
      console.error(`FAIL ${run.name}:`, error);
    }
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}

/** Observe the unchanged existing constraint unit's one-update case without changing its oracle. */
function observeStepCap(): void {
  const evaluate: Skeleton.PoseEvaluator = (pose: IAutoMovieHumanPose = {}): Skeleton.IOutput => {
    const shoulder: number = pose.arms?.left.shoulder?.flexion ?? 0;
    const elbow: number = pose.arms?.left.elbow?.flexion ?? 0;
    const origin: number = 1 + elbow / 1000;
    const posed: Skeleton.IPlacement[] = [
      { bone: "leftShoulder", position: [origin, 0.3, 0], rotation: [0, 0, 0, 1] },
      { bone: "leftLowerArm", position: [origin + 0.5, 0.29 + shoulder / 100, 0], rotation: [0, 0, 0, 1] },
      { bone: "leftHand", position: [origin + (shoulder + elbow) / 100, 0.3, 0], rotation: [0, 0, 0, 1] },
    ];
    return { bones: posed.map((row: Skeleton.IPlacement): Skeleton.IBone => ({ bone: row.bone, parent: null, position: [0, 0, 0], tip: null, radius: 0.01 })), posed, clamped: [] };
  };
  const seed: IAutoMovieHumanPose = { arms: { left: { shoulder: { flexion: 4.6 }, elbow: { flexion: 14 }, wrist: { flexion: 7 } }, right: {} } };
  const result: Ik.IResult = Ik.solve(evaluate, seed, {
    channels: ["arms.left.shoulder.flexion", "arms.left.elbow.flexion"],
    targets: [{ bone: "leftHand", position: [1.2, 0.3, 0] }],
    constraints: [{ kind: "channel", channel: "arms.left.shoulder.flexion", minimum: 40, maximum: 40 }],
    iterations: 1, tolerance: 0.00001,
  });
  console.log("Existing step-cap raw observation", JSON.stringify({ result, delta: result.pose.arms!.left.shoulder!.flexion! - 4.6, decimalArithmeticDelta: 4.6 + 12 - 4.6 }));
}

main();

