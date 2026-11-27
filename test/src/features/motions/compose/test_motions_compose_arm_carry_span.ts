import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmCarry,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import {
  motionHumanArmCarrySpan
} from "../../../../../packages/motions/src/compose/internal/motionHumanArmCarrySpan";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";

/** The rest angles of a member's arm. */
const REST: IAutoMovieMotionHumanArmAngles.IAngles = {
  upper: [0, 0, 0],
  lower: [0, 0, 0],
  hand: [0, 0, 0],
  fingers: {},
};

/**
 * `motionHumanArmCarrySpan` is the span one group problem is solved
 * over: the group's span where every member's own span is it, else from the
 * earliest start and reach to the latest release and end; its knots every
 * member's, once each and sorted, absent where no member has any.
 *
 * The body is built whole (`humanFixtureBody`) only to type a member.
 *
 * Scenarios, the group's span 0, 1, 2, 3:
 *
 * 1. Members without their own spans: the group's span itself.
 * 2. Members on the group's span with knots 2, 0.5 and 0.5, 1.5: the span with
 *    knots 0.5, 1.5, 2.
 * 3. A hold handed over, one member 0, 1, 1.5, 2 and the other 0.5, 1.2, 2.5, 3:
 *    0, 1, 2.5, 3.
 */
export async function test_motions_compose_arm_carry_span(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const member = (
    own?: IAutoMovieMotionHumanArmPlanned.ISpan,
  ): IAutoMovieMotionHumanArmCarry.ICarry => ({
    body,
    side: "left",
    from: 0,
    to: 3,
    rest: REST,
    goal: (): IAutoMovieHumanLimbGoal => ({
      point: { x: 0, y: 1, z: 0 },
      bend: { x: 0, y: 1, z: 0 },
    }),
    weight: (): number => 0,
    ...(own === undefined ? {} : { span: own }),
  });
  const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: 0,
    ready: 1,
    relax: 2,
    end: 3,
  };

  // 1. The group's span.
  TestValidator.predicate(
    "no own spans, the group's",
    motionHumanArmCarrySpan([member(), member()], span) === span,
  );

  // 2. The knots merged.
  TestValidator.equals(
    "every member's knots once, sorted",
    motionHumanArmCarrySpan(
      [
        member({ ...span, knots: [2, 0.5] }),
        member({ ...span, knots: [0.5, 1.5] }),
      ],
      span,
    ),
    { ...span, knots: [0.5, 1.5, 2] },
  );

  // 3. A hold handed over.
  TestValidator.equals(
    "the hull of the members' spans",
    motionHumanArmCarrySpan(
      [
        member({ start: 0, ready: 1, relax: 1.5, end: 2 }),
        member({ start: 0.5, ready: 1.2, relax: 2.5, end: 3 }),
      ],
      span,
    ),
    { start: 0, ready: 1, relax: 2.5, end: 3 },
  );
}
