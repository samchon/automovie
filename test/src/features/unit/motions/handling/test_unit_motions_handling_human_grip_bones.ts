import { HumanGrip } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanGrip.bones` names a digit's three bones, proximal to distal: a finger's
 * proximal, intermediate and distal phalanges, the thumb's metacarpal, proximal
 * and distal (the humanoid rig's thumb has no intermediate).
 *
 * Scenarios: the left index and the right thumb.
 */
export function test_unit_motions_handling_human_grip_bones(): void {
  TestValidator.equals(
    "the digits",
    [HumanGrip.bones("left", "Index"), HumanGrip.bones("right", "Thumb")],
    [
      ["leftIndexProximal", "leftIndexIntermediate", "leftIndexDistal"],
      ["rightThumbMetacarpal", "rightThumbProximal", "rightThumbDistal"],
    ],
  );
}
