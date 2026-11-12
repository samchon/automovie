import { planMotionCaptureInstants } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A motion case's labelled instants become the instants its capture draws and names: one per millisecond, in the case's order, with every distinct label of instants that coincide.
 *
 * Scenarios:
 *
 * 1. Instants at 0, 1.2575 and 2.42 with labels `start`, `grip closes` and `release` stay three, in order, with their labels and seconds unchanged.
 * 2. Two instants 5e-16 s apart, 1.886634915062088 `grip closed` and 1.8866349150620885 `release starts`, become one at the first second named `grip closed / release starts`.
 * 3. Two instants within one millisecond that share a label become one named once.
 * 4. Instants a millisecond apart, 1.000 and 1.001, stay two.
 * 5. No instant gives none.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the harness's instant planner on hand-written times and reads the instants; a planner that dropped a label, kept two instants that a capture would name alike, merged instants a millisecond apart or reordered the case fails.
 * @evidence contracts/development/testing.md#independent-expectations A capture names cells by second to the millisecond and refuses two of one name, so the merge resolution is that millisecond; the coinciding pair is the handover case's own grip and release instants.
 * @evidence contracts/development/testing.md#distinguishing-cases Distinct instants, a coinciding pair with two labels and with one, a pair one millisecond apart, and none. Captions of the named instants are owned by `test_capture_plan_instants`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_motion_capture_instants`; it maps plain data and starts no browser.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_motion_capture_instants(): void {
  // 1. Distinct instants.
  const distinct: { seconds: number; label: string }[] = [
    { seconds: 0, label: "start" },
    { seconds: 1.2575, label: "grip closes" },
    { seconds: 2.42, label: "release" },
  ];
  TestValidator.equals("distinct instants stay", planMotionCaptureInstants(distinct), distinct);

  // 2. A coinciding pair with two labels.
  TestValidator.equals(
    "one still named by both",
    planMotionCaptureInstants([
      { seconds: 1.886634915062088, label: "grip closed" },
      { seconds: 1.8866349150620885, label: "release starts" },
    ]),
    [{ seconds: 1.886634915062088, label: "grip closed / release starts" }],
  );

  // 3. A coinciding pair with one label.
  TestValidator.equals(
    "one label once",
    planMotionCaptureInstants([
      { seconds: 3.2, label: "end" },
      { seconds: 3.2000001, label: "end" },
    ]),
    [{ seconds: 3.2, label: "end" }],
  );

  // 4. A millisecond apart.
  TestValidator.equals(
    "a millisecond apart stays two",
    planMotionCaptureInstants([
      { seconds: 1, label: "a" },
      { seconds: 1.001, label: "b" },
    ]).length,
    2,
  );

  // 5. None.
  TestValidator.equals("none", planMotionCaptureInstants([]), []);
}
