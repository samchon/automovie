import { resolvePose } from "../../../../packages/engine/src/kinematics/resolvePose";
import { AutoMovieHumanRig } from "../../../../packages/human/src/skeleton/AutoMovieHumanRig";
import { HUMAN_STICKMAN_POSES } from "../../../../packages/playground/src/human-stickman/HUMAN_STICKMAN_POSES";
import { HumanPeople } from "../internal/HumanPeople";

/** Distance between the two kinematics a bone may show, metres. */
const SAME: number = 1e-6;

/**
 * A Human pose reaches the engine as its own clinical pose, not a cast.
 *
 * @evidence contracts/testing.md#behavioral-verification Converts evaluated poses through the public adapter and runs the engine's own forward kinematics on the rig, comparing every bone's world place with the Human skeleton's. It catches a wrong axis, order, handedness, angle unit or root.
 * @evidence contracts/testing.md#independent-expectations The Human skeleton's placements are computed by separate code from the engine's FK, so the two disagree if the adapter is wrong; the rig's composition is the premise both share.
 * @evidence contracts/testing.md#distinguishing-cases Runs the rest pose, the step-and-reach pose and the range-limit pose on a slender and a broad person, across forearms with their distal twist and every other joint. A bone the adapter reports as translated is exempt, because the engine's rig has no channel for it, and its descendants with it.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_engine_pose`, importing pure engine kinematics, reading the people `HumanPeople` generates once per run and starting no renderer or host.
 */
export const test_human_engine_pose = (): void => {
  const problems: string[] = [];
  for (const name of ["f1", "m2"]) {
    const { rig, evaluate } = HumanPeople.rigged(name);
    for (const label of ["rest", "demo", "limit"]) {
      const output = evaluate(HUMAN_STICKMAN_POSES[label]!);
      const { pose, translated } = AutoMovieHumanRig.enginePose(rig.skeleton, output);
      const skip = new Set<string>(translated);
      for (const bone of rig.skeleton.bones)
        if (bone.parent !== null && skip.has(bone.parent)) skip.add(bone.bone);
      const placed = new Map(output.posed.map((p) => [p.bone, p]));
      for (const r of resolvePose(pose, rig.skeleton)) {
        if (skip.has(r.bone)) continue;
        const want = placed.get(r.bone.endsWith("Toes") ? r.bone.replace("Toes", "HalluxProximal") : r.bone)!;
        const off: number = Math.hypot(
          r.worldPosition.x - want.position[0],
          r.worldPosition.y - want.position[1],
          r.worldPosition.z - want.position[2],
        );
        if (!(off < SAME)) problems.push(`${name} ${label} ${r.bone} off by ${off.toFixed(6)} m`);
      }
    }
  }
  if (problems.length !== 0)
    throw new Error(`${problems.length} bones disagree:\n${problems.join("\n")}`);
};
