import { AutoMovieEngineKinematics } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `alternateRigJointAngles(rig, placement, handed)` is the second Euler chart
 * of a joint rotation: (180 - f, a + 180, t + 180 handed) for a distal twist,
 * (f + 180, 180 - a, t + 180 handed) for a proximal one (also when absent).
 *
 * Scenarios:
 *
 * 1. (10, 20, 30) distal, right-handed: (170, 200, 210).
 * 2. Proximal and absent, right-handed: (190, 160, 210).
 * 3. Left-handed distal: twist 30 - 180 = -150.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers the alternate Euler chart for distal, proximal and default placement, with both handed signs.
 * @evidence contracts/development/testing.md#behavioral-verification Calls alternateRigJointAngles on one numerical angle triple and varies placement and handedness directly.
 * @evidence contracts/development/testing.md#independent-expectations For (10, 20, 30), the reflected coordinate is 180 minus 10 or 180 minus 20 depending on twist placement. The remaining axes take half-turn offsets, with the left clinical twist subtracting 180.
 */
export function test_engine_kinematics_alternate_rig_joint_angles(): void {
  const rig = { flexion: 10, abduction: 20, twist: 30 };

  // 1.
  TestValidator.equals("distal", AutoMovieEngineKinematics.alternateRigJointAngles(rig, "distal", 1), {
    flexion: 170,
    abduction: 200,
    twist: 210,
  });

  // 2.
  TestValidator.equals(
    "proximal",
    AutoMovieEngineKinematics.alternateRigJointAngles(rig, "proximal", 1),
    { flexion: 190, abduction: 160, twist: 210 },
  );
  TestValidator.equals("absent", AutoMovieEngineKinematics.alternateRigJointAngles(rig, undefined, 1), {
    flexion: 190,
    abduction: 160,
    twist: 210,
  });

  // 3.
  TestValidator.equals(
    "left",
    AutoMovieEngineKinematics.alternateRigJointAngles(rig, "distal", -1).twist,
    -150,
  );
}
