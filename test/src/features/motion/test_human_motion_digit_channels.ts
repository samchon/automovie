import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { AutoMovieMotionHumanChannel } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A digit claim admits only writes to that digit. A hand claim contains its five digits.
 * @evidence contracts/development/common.md#meaningful-documentation Checks bone ownership, hand containment and joint/goal writes.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the channel predicates and merges two distinct joint/goal maps.
 * @evidence contracts/development/testing.md#independent-expectations Anatomical naming determines membership. A merged unclaimed entry comes from the base posture.
 * @evidence contracts/development/testing.md#distinguishing-cases Own digit, sibling digit, parent hand, opposite hand and non-digit wrist.
 * @evidence contracts/development/testing.md#execution-ownership Pure channel algebra needs no body or film.
 */
export function test_human_motion_digit_channels(): void {
  const complaints: string[] = [];
  const base: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const C = AutoMovieMotionHumanChannel;
  const facts: [string, boolean][] = [
    [
      "a hand covers its thumb's bone",
      C.covers(["rightHand"], "rightThumbDistal"),
    ],
    [
      "a hand covers its little finger's bone",
      C.covers(["rightHand"], "rightLittleProximal"),
    ],
    [
      "a thumb claim covers its own bone",
      C.covers(["rightThumb"], "rightThumbMetacarpal"),
    ],
    [
      "a thumb claim does not cover the forefinger",
      !C.covers(["rightThumb"], "rightIndexDistal"),
    ],
    [
      "a right claim does not cover the left",
      !C.covers(["rightHand"], "leftThumbDistal"),
    ],
    [
      "a hand's claim covers its digit's claim",
      C.claims(["leftHand"], "leftIndex"),
    ],
    [
      "a digit's claim does not cover its hand",
      !C.claims(["leftIndex"], "leftHand"),
    ],
    [
      "a digit names its bone",
      C.digit("leftMiddleIntermediate") === "leftMiddle",
    ],
    ["a wrist names no digit", C.digit("leftHand") === undefined],
  ];
  for (const [label, ok] of facts) if (!ok) complaints.push(label);

  // Merge by a digit claim.
  const under: IAutoMovieMotionHumanPosture = {
    ...base,
    joints: { rightIndexProximal: [10, 0, 0], rightThumbProximal: [10, 0, 0] },
  };
  const written: IAutoMovieMotionHumanPosture = {
    ...base,
    joints: { rightIndexProximal: [50, 0, 0], rightThumbProximal: [50, 0, 0] },
    digits: {
      rightThumb: { point: { x: 0, y: 1, z: 0 }, surface: "pad" },
      rightIndex: { point: { x: 1, y: 0, z: 0 }, surface: "tip" },
    },
  };
  const merged: IAutoMovieMotionHumanPosture = C.merge(under, written, [
    "rightThumb",
  ]);
  if (
    !(
      merged.joints.rightThumbProximal?.[0] === 50 &&
      merged.joints.rightIndexProximal?.[0] === 10
    )
  )
    complaints.push("a thumb claim did not take the thumb's joint alone");
  if (
    merged.digits?.rightThumb === undefined ||
    merged.digits?.rightIndex !== undefined
  )
    complaints.push("a thumb claim did not take the thumb's goal alone");

  TestValidator.equals("a digit takes only its own writes", complaints, []);
}
