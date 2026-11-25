import { alternateRigJointAngles } from "@automovie/engine";
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
 */
export function test_unit_engine_kinematics_alternate_rig_joint_angles(): void {
  const rig = { flexion: 10, abduction: 20, twist: 30 };

  // 1.
  TestValidator.equals("distal", alternateRigJointAngles(rig, "distal", 1), {
    flexion: 170,
    abduction: 200,
    twist: 210,
  });

  // 2.
  TestValidator.equals(
    "proximal",
    alternateRigJointAngles(rig, "proximal", 1),
    { flexion: 190, abduction: 160, twist: 210 },
  );
  TestValidator.equals("absent", alternateRigJointAngles(rig, undefined, 1), {
    flexion: 190,
    abduction: 160,
    twist: 210,
  });

  // 3.
  TestValidator.equals(
    "left",
    alternateRigJointAngles(rig, "distal", -1).twist,
    -150,
  );
}
