import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanSignature } from "../internal/motionHumanSignature";
import { motionKneelSignature } from "../internal/motionKneelSignature";
import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * A half-kneel keeps a knee and its opposite foot in support through the hold.
 *
 * Scenarios:
 * 1. The one-knee default and the explicit left knee exercise either support side.
 * 2. At the held posture the bearing knee sits below the front knee, the
 *    front foot bears, and the trunk and joint angles match the half-kneel.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law's distinguishing inputs and preserves their staged context.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the actual public law and applies the timing, contact, range, spin and display audits to its staged performances.
 * @evidence contracts/development/testing.md#independent-expectations The skin and plant bounds apply across each change of bearing parts. The half-kneel geometry comes from the independent joint bounds in motionKneelSignature.
 * @evidence contracts/development/testing.md#distinguishing-cases The one-knee default and an explicit left knee exercise either support side at opposite stature extremes. The held one-knee exit is verified by the takeAKnee pose.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test shares each real film between the full-interval audit and the held geometry.
 */
export function test_human_motion_law_sweep_posture_kneel(): void {
  const signature: motionComplaints.IGatherer = motionComplaints();
  const findings: string[] = motionPostureBranches(
    [
      ["kneel", "default", "m-large"],
      ["kneel", "kind=one,knee=left", "f-small"],
    ],
    (film, [, row, name]): void => {
      motionKneelSignature(signature, film, name, "one", row === "default" ? "right" : "left");
    },
  );
  signature.list.push(
    ...findings,
    ...motionHumanSignature.calibrate("m-large"),
    ...motionHumanSignature.calibrate("f-small"),
  );
  signature.assert("A half-kneel has the prescribed held geometry and contact throughout");
}
