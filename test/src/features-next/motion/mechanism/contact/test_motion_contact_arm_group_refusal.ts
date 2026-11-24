import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance, HumanRefusal } from "@automovie/motions";
import {
  AutoMovieMotionHumanArm,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/**
 * A group of planned arms whose one solve refuses keeps that refusal, so no
 * later read of any member solves the group again.
 *
 * Scenarios:
 * 1. Two arms join one group; the right arm's goal refuses the first time it is read, so preparing the right arm throws.
 * 2. Preparing the right arm again throws the very same refusal, and no goal is read again.
 * 3. Preparing the left arm of the same group, and writing either arm at an instant of the plan, each throw that same refusal without reading a goal.
 * 4. A group made outside any action's plan takes no handover and no ordinal.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A refused group solve is kept (`ITogether.refused`) and thrown again at every later read of any member, never solved again.
 * @evidence contracts/development/testing.md#independent-expectations A new solve would read a goal and build a new refusal, so a goal-read count of exactly one and the identity of the thrown object prove that no read after the first solves.
 * @evidence contracts/development/testing.md#distinguishing-cases The first read solves and refuses; the repeat read of the same member, the other member's prepare and the writes at a planned instant are each checked against that one refusal; a group made outside a plan's scope is checked for no handover.
 * @evidence contracts/development/testing.md#execution-ownership Runs the public carry primitive and group constructor in memory and observes their thrown refusals and the group record.
 * @evidence contracts/development/common.md#meaningful-documentation States what is kept, what each read must throw and how a re-solve would be seen.
 */
export function test_motion_contact_arm_group_refusal(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const rest: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const refusal: HumanRefusal = new HumanRefusal({
    kind: "reach",
    axis: "target",
    value: 1,
    feasible: null,
    reason: "the test's goal is out of reach",
    fix: "none: the test refuses on purpose",
  });
  let reads: number = 0;
  const goal = (): IAutoMovieHumanLimbGoal => {
    ++reads;
    throw refusal;
  };
  const group: IAutoMovieMotionHumanArmPlanned.ITogether =
    AutoMovieMotionHumanArm.together();
  const arm = (side: AutoMovieHumanSide): IAutoMovieMotionHumanPrimitive => {
    const angles: IAutoMovieMotionHumanArmAngles.IAngles =
      AutoMovieMotionHumanArm.angles(resolveHumanPosture(body, rest), side);
    return AutoMovieMotionHumanArm.carried({
      body,
      side,
      from: 0,
      to: 2,
      rest: angles,
      goal,
      weight: (time: number): number => Math.min(1, time),
      span: { start: 0, ready: 1, relax: 2, end: 2 },
      together: group,
    });
  };
  const right: IAutoMovieMotionHumanPrimitive = arm("right");
  const left: IAutoMovieMotionHumanPrimitive = arm("left");
  const before = (): IAutoMovieMotionHumanPosture => rest;
  const thrown = (title: string, run: () => unknown): void => {
    let caught: unknown;
    try {
      run();
    } catch (error: unknown) {
      caught = error;
    }
    TestValidator.predicate(
      `${title} throws the group's one refusal`,
      caught === refusal,
    );
  };

  // 1. The first read solves the group and refuses.
  thrown("the first prepare", () => right.prepare!(before));
  TestValidator.equals("goal reads after the first solve", reads, 1);
  TestValidator.predicate(
    "the group keeps its refusal",
    group.refused === refusal && group.solved === undefined,
  );

  // 2-3. Every later read throws the kept refusal and reads no goal.
  thrown("the repeat prepare", () => right.prepare!(before));
  thrown("the other member's prepare", () => left.prepare!(before));
  thrown("a planned write of the right arm", () =>
    right.write(rest, 1.5, before),
  );
  thrown("a planned write of the left arm", () =>
    left.write(rest, 1.5, before),
  );
  TestValidator.equals("goal reads after every later read", reads, 1);

  // 4. Outside an action's plan a group takes no handover.
  const outside: IAutoMovieMotionHumanArmPlanned.ITogether =
    AutoMovieMotionHumanArm.together();
  TestValidator.predicate(
    "a group made outside a plan has no handover or ordinal",
    outside.warm === undefined &&
      outside.last === undefined &&
      outside.ordinal === undefined,
  );
}
