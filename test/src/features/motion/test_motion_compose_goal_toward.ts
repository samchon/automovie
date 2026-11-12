import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanGoal,
  AutoMovieMotionHumanResolve,
  type IHumanPosture,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A limb's goal mixed toward another by a weight
 * (`AutoMovieMotionHumanGoal.toward`), and the solver's elbow table
 * (`AutoMovieMotionHumanResolve.swivel`).
 *
 * `toward` leaves the stated origin, or the goal the posture so far holds,
 * and arrives on the goal; its weight is clamped to [0, 1]. The table lists
 * one row per named place (`ahead`, `desk`, `floor`) and per grid place of
 * `stopPalm`, `wave`, `raiseHand` and a hand at the hip, one column per
 * body, each cell the swivel from the `hang` preset in whole degrees and the
 * strain of the solved elbow over the preset's; the solved elbow is the
 * place of least strain, so it never strains more than the preset does.
 *
 * Scenarios:
 * 1. `toward` at weight 0, 0.5 and 1 is on the posture's goal, half way and
 *    on the asked goal; a weight of 1.7 or -0.4 is the nearer end; an
 *    explicit origin replaces the posture's; a limb with neither throws.
 * 2. `swivel` on the lightest and the heaviest body has its header and the
 *    seven places; every cell is out of reach or an angle in [0, 180] whose
 *    solved strain is no more than the preset's.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls both functions; an origin not read from the posture, an unclamped weight, a missing refusal, a row lost or a solved elbow straining more than the preset fails.
 * @evidence contracts/development/testing.md#independent-expectations Ends and midpoints of stated points; the least-strain rule is the solver's document.
 * @evidence contracts/development/testing.md#distinguishing-cases Three weights inside and two outside [0, 1], with and without an origin, a limb without a goal; two bodies and seven places.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on two prepared bodies; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States both rules, the table's layout and the 2 scenarios.
 */
export function test_motion_compose_goal_toward(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const near = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
    Math.abs(a.x - b.x) <= 1e-9 &&
    Math.abs(a.y - b.y) <= 1e-9 &&
    Math.abs(a.z - b.z) <= 1e-9;
  const held: IHumanPosture.IGoal = {
    point: { x: 0.1, y: 1, z: 0.2 },
    bend: { x: 0.4, y: 0.8, z: 0 },
  };
  const posture: IHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: { leftArm: held },
  };
  const goal: IHumanPosture.IGoal = {
    point: { x: 0.3, y: 1.4, z: 0.6 },
    bend: { x: 0.4, y: 0.8, z: 0 },
  };
  const at = (
    weight: number,
    origin?: AutoMovieMotionHumanGoal.Frame,
    limb: IHumanPosture.Limb = "leftArm",
  ): IHumanPosture.IGoal =>
    AutoMovieMotionHumanGoal.toward(
      {
        limb,
        from: 0,
        to: 1,
        goal: () => goal,
        weight: () => weight,
        ...(origin === undefined ? {} : { origin }),
      },
      posture,
      0.5,
    );

  // 1. Toward.
  complaints.check(
    "toward leaves the posture's goal, passes half way and arrives",
    near(at(0).point, held.point) &&
      near(at(0.5).point, { x: 0.2, y: 1.2, z: 0.4 }) &&
      near(at(1).point, goal.point),
  );
  complaints.check(
    "a weight outside [0, 1] is the nearer end",
    near(at(1.7).point, goal.point) && near(at(-0.4).point, held.point),
  );
  complaints.check(
    "an explicit origin replaces the posture's",
    near(
      at(0, () => ({ point: { x: -1, y: 0, z: 2 }, bend: held.bend })).point,
      { x: -1, y: 0, z: 2 },
    ),
  );
  complaints.refuses("a limb with no goal to leave", () =>
    at(0.5, undefined, "rightLeg"),
  );

  // 2. The swivel table.
  const table: string[] = AutoMovieMotionHumanResolve.swivel([
    { name: "f-small", body: motionHumanBody("f-small") },
    { name: "m-large", body: motionHumanBody("m-large") },
  ]).split("\n");
  complaints.equals("the table's header", table[0]!.split("\t"), [
    "place (swivel from hang, strain solved / hang)",
    "f-small",
    "m-large",
  ]);
  complaints.equals(
    "the table's places",
    table.slice(1).map((row: string): string => row.split("\t")[0]!),
    [
      "ahead",
      "desk",
      "floor",
      "shoulder inside far",
      "eye outside near",
      "overhead shoulder close",
      "hip outside close",
    ],
  );
  for (const row of table.slice(1))
    for (const cell of row.split("\t").slice(1)) {
      if (cell === "out of reach") continue;
      const m: RegExpMatchArray | null = cell.match(
        /^(\d+) deg, (\S+) \/ (\S+)$/,
      );
      const angle: number = Number(m?.[1]);
      const solved: number = Number(m?.[2]);
      const preset: number = m?.[3] === "Infinity" ? Infinity : Number(m?.[3]);
      complaints.check(
        `${row.split("\t")[0]}: "${cell}" is an angle in [0, 180] with no more strain than the preset`,
        m !== null && angle >= 0 && angle <= 180 && solved <= preset + 5e-4,
      );
    }
  complaints.assert("toward and the swivel table hold as documented");
}
