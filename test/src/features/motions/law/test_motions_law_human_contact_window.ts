import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  HumanContactWindow
} from "../../../../../packages/motions/src/law/internal/HumanContactWindow";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/**
 * The normalized input times, linear toe path and offset sums use under 16
 * binary64 operations with values of magnitude at most two. Sixty-four rounding
 * units at that magnitude bound the comparison in shares or metres.
 */
const ROUNDING: number = 64 * Number.EPSILON * 2;

/**
 * Check detection of toe-bearing windows and application of declared locks.
 *
 * Scenarios:
 *
 * 1. Track a slow left toe below the movement threshold. Lock its horizontal
 *    point and shift to the supplied floor, leave the undeclared right foot
 *    free and preserve the hand grip interval.
 * 2. Leave a faster toe without a bearing interval. Admit four frames and
 *    read the translated stationary path across the whole span. Refuse a
 *    shorter path before reading toes.
 * 3. Interpolate offsets for world limb goals while keeping bone-framed goals
 *    at their local coordinates.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify detection speed, floor frame, minimum sampling length and kept local goals.
 * @evidence contracts/development/testing.md#behavioral-verification The contact lock implementation receives deterministic toe readers and typed authored contact windows.
 * @evidence contracts/development/testing.md#independent-expectations The 0.149 m/s fixture gives a known per-frame shift. Literal floor height, offsets and hand timing supply the other expectations.
 */
export function test_motions_law_human_contact_window(): void {
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
      leftFoot: { x: 1 + 0.149 * seconds, y: 0, z: 0 },
      rightFoot: { x: 0, y: 0, z: 1 },
    }),
    floor: (part: HumanContactWindow.Foot): number =>
      part === "leftFoot" ? 0.0625 : 0,
  };
  const contacts: HumanContactWindow.IContacts =
    HumanContactWindow.fromPath(path);
  const [kept, detected] = contacts.windows;
  TestValidator.predicate(
    "the hand grip stays on its authored window",
    kept !== undefined &&
      kept.part === "rightHand" &&
      kept.kind === "grip" &&
      nclose(kept.from, 0.25, ROUNDING) &&
      nclose(kept.to, 0.75, ROUNDING),
  );
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
        vclose(offset, { x: (-0.149 * index) / 60, y: 0.0625, z: 0 }, ROUNDING),
      ) &&
      contacts.offsets.rightFoot.every((offset): boolean =>
        vclose(offset, { x: 0, y: 0, z: 0 }, ROUNDING),
      ),
  );

  const moving: HumanContactWindow.IContacts = HumanContactWindow.fromPath({
    ...path,
    toes: (seconds: number): HumanContactWindow.Toes => ({
      leftFoot: { x: 0, y: 0, z: 0.151 * seconds },
      rightFoot: { x: 0, y: 0, z: 1 },
    }),
  });
  TestValidator.predicate(
    "a moving toe cannot create a foot window",
    moving.windows.length === 1 && moving.windows[0]?.part === "rightHand",
  );
  const stationaryShort: HumanContactWindow.IContacts =
    HumanContactWindow.fromPath({
      duration: 0.05,
      windows: [{ ...foot, from: 0, to: 1 }],
      toes: (): HumanContactWindow.Toes => ({
        leftFoot: { x: 1, y: 0, z: 0 },
        rightFoot: { x: 0, y: 0, z: 0 },
      }),
    });
  TestValidator.predicate(
    "the shortest admitted path keeps the stationary toe at its first frame",
    stationaryShort.windows.length === 1 &&
      nclose(stationaryShort.windows[0]!.from, 0, ROUNDING) &&
      nclose(stationaryShort.windows[0]!.to, 1, ROUNDING),
  );
  TestValidator.predicate(
    "a short path fails before sampling",
    throwsError(
      (): HumanContactWindow.IContacts =>
        HumanContactWindow.fromPath({
          ...path,
          duration: 1 / 30,
          toes: (): never => {
            throw new Error("Unexpected toe sample");
          },
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
        leftFoot: [
          { x: 0, y: 0, z: 0 },
          { x: 0.25, y: 0.5, z: 0.75 },
        ],
        rightFoot: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 1, z: 1 },
        ],
      },
    },
    1 / 120,
    1 / 60,
  );
  TestValidator.predicate(
    "the half-frame offset moves both world goal coordinates",
    sampled.limbs.leftLeg !== undefined &&
      vclose(
        sampled.limbs.leftLeg.point,
        { x: 1.125, y: 0.25, z: 0.375 },
        ROUNDING,
      ) &&
      vclose(
        sampled.limbs.leftLeg.bend,
        { x: 1.125, y: 1.25, z: 0.375 },
        ROUNDING,
      ) &&
      sampled.limbs.leftLeg.planted === true &&
      sampled.limbs.rightLeg === right &&
      posture.limbs.leftLeg === left,
  );
}
