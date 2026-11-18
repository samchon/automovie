import { HumanChain } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionFloorRise } from "../internal/motionFloorRise";

/**
 * An explicit supine rotation rolls onto the hands and knees before standing.
 *
 * Scenarios:
 * 1. The small body crosses its lower-leg seam continuously.
 * 2. The large body reaches the rotating route's stance-three foot target
 *    and finishes standing on its soles, within the same spatial limits.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the request, the two different failures and their specimens.
 * @evidence contracts/development/testing.md#behavioral-verification Measures the entire displayed roll at 120 Hz, its contact with the floor, and both terminal feet and hips.
 * @evidence contracts/development/testing.md#independent-expectations Uses the unchanged quiet hips, collider floor and finite-difference limits in motionFloorRise.
 * @evidence contracts/development/testing.md#distinguishing-cases The small specimen exposes the lower-leg seam and the large one the former 11.2 mm refusal at stance three.
 * @evidence contracts/development/testing.md#execution-ownership Two rolls retain their original independent body, seed and lying entry.
 */
export function test_human_motion_floor_get_up_rotation(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["f-small", "m-large"] as const)
    motionFloorRise(all, name, "supine rotation",
      HumanChain.subject("a").lieDown({ position: "supine", hold: 0.3 }).getUp({ pattern: "rotation" }));
  all.assert("the explicit rolling rise reaches its supports and stands");
}
