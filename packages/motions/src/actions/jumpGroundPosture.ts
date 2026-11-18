import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanArmClearance } from "../posture/HumanArmClearance";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { rangeSteppingFoot } from "./rangeSteppingFoot";

/**
 * Fit the reaching foot during push-off and clear the arms against the bent legs.
 *
 * @param body The jumping body's limb lengths and collision geometry.
 * @param posture The ground phase's actual lowered posture and world goals.
 * @param phase The reaching side during push-off, or the two-foot landing.
 * @param read The operation's FK reader, shared with lowering and fitting.
 * @returns Corrected ground-phase demands for both endpoint construction and playback.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the lowered frame, phase and consumers of the corrected demands.
 * @evidence contracts/development/implementation.md#principled-implementation A withdrawing foot rotates about its planned forefoot as the lowered hip bends its shank. Each arm clears the actual flexed thighs during both the push and the landing at the least shoulder abduction the shared clearance owner finds.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The landing delegates joint-space clearance; the reaching leg uses the existing ankle rocker, rigid forefoot pivot and reciprocal toe flexion.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the current pose, actual body, original support foot and authored forefoot path; the same demands enter the ballistic endpoint and ground playback.
 * @evidence contracts/development/implementation.md#efficient-algorithms Push needs a hip read and one bounded rocker solve; landing uses the existing posed-arm clearance solve.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Playback and both endpoints call this same geometry after lowering and borrow their current operation's FK reader.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the posture and stores no samples, workspace or handles.
 */
export function jumpGroundPosture(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  phase: "left" | "right" | "landing",
  read: ReturnType<typeof prepareHumanPoseResolution>,
): IAutoMovieMotionHumanPosture {
  const lowered: IAutoMovieMotionHumanPosture = phase === "landing" ? posture : rangeSteppingFoot(body, posture, phase, read);
  return HumanArmClearance.swung(body, lowered, ["left", "right"], read);
}
