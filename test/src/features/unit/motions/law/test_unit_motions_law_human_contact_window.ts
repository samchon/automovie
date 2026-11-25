import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { HumanContactWindow } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/**
 * The normalized input times, linear toe path and offset sums use under 16
 * binary64 operations with values of magnitude at most two. Sixty-four
 * rounding units at that magnitude bound the comparison in shares or metres.
 */
const ROUNDING: number = 64 * Number.EPSILON * 2;

/**
 * Detect foot-bearing windows in the toe path and lock only declared contacts.
 *
 * Scenarios:
 *
 * 1. A slow toe below the detection threshold stays locked at its original
 *    horizontal point and at the supplied floor. The other foot has no
 *    declared contact and the authored hand grip keeps its own timing.
 * 2. A fast linear toe has no bearing window even with declared intent.
 * 3. A sub-four-frame path is refused before reading toe locations.
 * 4. World goals receive interpolated offsets, while a bone-framed goal
 *    retains its original coordinates.
 */
export function test_unit_motions_law_human_contact_window(): void {
  const hand: IAutoMovieMotionHumanContactWindow = {
    part: "rightHand",
    kind: "grip",
    from: 0.25,
    to: 0.75,
    support: { kind: "prop", subject: "rail" },
  };
  const foot: IAutoMovieMotionHumanContactWindow = {
    part: "leftFoot",
    kind: "pivot",
    from: 0.25,
    to: 0.5,
    support: { kind: "prop", subject: "step" },
    socket: "heel",
  };
  const path: HumanContactWindow.IPath = {
    windows: [hand, foot],
    duration: 0.25,
    toes: (seconds: number): HumanContactWindow.Toes => ({
      leftFoot: { x: 1 + seconds / 8, y: 0, z: 0 },
      rightFoot: { x: 0, y: 0, z: 1 },
    }),
    floor: (part: HumanContactWindow.Foot): number =>
      part === "leftFoot" ? 0.25 : 0,
  };
  const contacts: HumanContactWindow.IContacts = HumanContactWindow.fromPath(path);
  const [kept, detected] = contacts.windows;
  TestValidator.equals("the hand grip stays on its authored window", kept, hand);
  TestValidator.predicate(
    "the detected run extends the intent without changing its contact",
    contacts.windows.length === 2 &&
      detected !== undefined &&
      detected.part === "leftFoot" &&
      detected.kind === "pivot" &&
      detected.support.kind === "prop" &&
      detected.support.subject === "step" &&
      detected.socket === "heel" &&
      nclose(detected.from, 0, ROUNDING) &&
      nclose(detected.to, 1, ROUNDING),
  );
  TestValidator.predicate(
    "the slow left toe holds its initial horizontal point and the floor",
    contacts.offsets.leftFoot.length === 16 &&
      contacts.offsets.leftFoot.every((offset, index): boolean =>
        vclose(offset, { x: -index / 480, y: 0.25, z: 0 }, ROUNDING),
      ) &&
      contacts.offsets.rightFoot.every((offset): boolean =>
        vclose(offset, { x: 0, y: 0, z: 0 }, ROUNDING),
      ),
  );

  const moving: HumanContactWindow.IContacts = HumanContactWindow.fromPath({
    ...path,
    toes: (seconds: number): HumanContactWindow.Toes => ({
      leftFoot: { x: 0, y: 0, z: seconds / 2 },
      rightFoot: { x: 0, y: 0, z: 1 },
    }),
  });
  TestValidator.equals("a moving toe cannot create a foot window", moving.windows, [hand]);
  TestValidator.predicate(
    "a short path fails before sampling",
    throwsError(
      (): HumanContactWindow.IContacts => HumanContactWindow.fromPath({
        ...path,
        duration: 1 / 30,
        toes: (): never => { throw new Error("Unexpected toe sample"); },
      }),
      "fewer than the four samples",
    ),
  );

  const left: IAutoMovieHumanLimbGoal = {
    point: { x: 1, y: 0, z: 0 },
    bend: { x: 1, y: 1, z: 0 },
    planted: true,
  };
  const right: IAutoMovieHumanLimbGoal = { ...left, on: "hips" };
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: { leftLeg: left, rightLeg: right },
  };
  const sampled: IAutoMovieMotionHumanPosture = HumanContactWindow.locked(
    posture,
    {
      windows: [],
      offsets: {
        leftFoot: [{ x: 0, y: 0, z: 0 }, { x: 0.25, y: 0.5, z: 0.75 }],
        rightFoot: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }],
      },
    },
    1 / 120,
    1 / 60,
  );
  TestValidator.predicate(
    "the half-frame offset moves both world goal coordinates",
    sampled.limbs.leftLeg !== undefined &&
      vclose(sampled.limbs.leftLeg.point, { x: 1.125, y: 0.25, z: 0.375 }, ROUNDING) &&
      vclose(sampled.limbs.leftLeg.bend, { x: 1.125, y: 1.25, z: 0.375 }, ROUNDING) &&
      sampled.limbs.leftLeg.planted === true &&
      sampled.limbs.rightLeg === right &&
      posture.limbs.leftLeg === left,
  );
}
