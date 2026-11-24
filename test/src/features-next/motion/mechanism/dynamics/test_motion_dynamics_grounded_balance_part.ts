import type {
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSeat,
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import {
  AutoMovieMotionHumanLean,
  AutoMovieMotionHumanTrunk,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionComposeTrunk } from "../../../../features/internal/motionComposeTrunk";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { vclose } from "../../../../features/internal/vclose";

/** Place one grounded action with the requested balance fields. */
type Action = (
  balance?: IAutoMovieMotionHumanBalance,
) => IAutoMovieMotionHumanChain;

/**
 * A grounded law that only shifts the pelvis can supply the balancing part.
 *
 * Scenarios:
 * 1. Sitting, kneeling, bowing and squatting produce the same pelvis course
 *    for an explicit hip request and an otherwise identical bounded request.
 * 2. Other parts and missing event bounds keep their field-specific refusals.
 * 3. Gestures and exercises without a hip correction keep their own refusals.
 * 4. A direct bow, crouch and counterbalance accept the same bounded request
 *    as their explicit hip form, and omit mass work when unrequested.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the four eligible actions and the independent part and bound checks.
 * @evidence contracts/development/testing.md#behavioral-verification Places real actions and observes their timed root and prepared balancing part.
 * @evidence contracts/development/testing.md#independent-expectations Each supported action can correct only the pelvis, so spelling hips produces the same displacement.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks absent, partial and explicit requests and two unsupported variants.
 * @evidence contracts/development/testing.md#execution-ownership Shares one canonical body and places each request on a fresh timeline.
 */
export function test_motion_dynamics_grounded_balance_part(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const chair: IAutoMovieMotionHumanSeated.ISeat = {
    at: { x: 0, y: AutoMovieMotionHumanSeat.seated.popliteal(body), z: -0.1 },
    yaw: 0,
    depth: 0.45,
  };
  const actor: IAutoMovieMotionHumanChain = HumanChain.subject("a");
  const actions: readonly Action[] = [
    (balance) => actor.sit({ seat: chair, balance }),
    (balance) => actor.kneel({ balance }),
    (balance) => actor.gesture({ kind: "bow", balance }),
    (balance) => actor.exercise({ kind: "squat", balance }),
  ];
  const bounded: IAutoMovieMotionHumanBalance = {
    from: { event: "start" },
    to: { event: "end" },
  };
  function place(
    action: Action,
    balance?: IAutoMovieMotionHumanBalance,
  ): IAutoMovieMotionHumanSegment {
    return new HumanPerformance({
      seed: "grounded-balance-part",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: action(balance).node,
    }).segments("a")[0]!;
  }
  function refusal(
    action: Action,
    balance: IAutoMovieMotionHumanBalance,
  ): string | undefined {
    try {
      place(action, balance);
    } catch (error: unknown) {
      if (!(error instanceof HumanRefusal)) throw error;
      return error.axis;
    }
    return undefined;
  }
  let displaced: boolean = false;
  for (const action of actions) {
    const implied: IAutoMovieMotionHumanSegment = place(action, bounded);
    const named: IAutoMovieMotionHumanSegment = place(action, {
      ...bounded,
      by: "hips",
    });
    const quiet: IAutoMovieMotionHumanSegment = place(action);
    TestValidator.equals(
      "omitting balance keeps the action kinematic",
      quiet.plan.balanceWindow,
      undefined,
    );
    TestValidator.equals(
      "the actual prepared correction moves the hips",
      implied.plan.balanceWindow?.by,
      "hips",
    );
    for (const share of [0.25, 0.5, 0.75]) {
      const t: number = named.plan.duration * share;
      TestValidator.predicate(
        "both requests produce the same hip position",
        vclose(implied.plan.posture(t).root, named.plan.posture(t).root),
      );
      displaced ||= !vclose(
        implied.plan.posture(t).root,
        quiet.plan.posture(t).root,
      );
    }
    TestValidator.equals(
      "trunk is unsupported",
      refusal(action, { ...bounded, by: "trunk" }),
      "balance.by",
    );
    TestValidator.equals(
      "the author supplies the opening event",
      refusal(action, { to: bounded.to }),
      "balance.from",
    );
    TestValidator.equals(
      "the author supplies the closing event",
      refusal(action, { from: bounded.from }),
      "balance.to",
    );
  }
  TestValidator.predicate(
    "the bounded request produces an observable hip correction",
    displaced,
  );
  TestValidator.equals(
    "a wave has no hip recommendation",
    refusal((balance) => actor.gesture({ kind: "wave", balance }), bounded),
    "balance.by",
  );
  TestValidator.equals(
    "a lunge has no hip recommendation",
    refusal((balance) => actor.exercise({ kind: "lunge", balance }), bounded),
    "balance.by",
  );
  primitiveParts(body, bounded);
}

/** A primitive built directly from a body and an optional authored balance request. */
type Build = (
  body: IAutoMovieMotionHumanBody,
  balance?: IAutoMovieMotionHumanBalance,
) => IAutoMovieMotionHumanPrimitive;

/** Compare public builders on a planted body with its pelvis advanced by an ankle-to-toe length. */
function primitiveParts(
  body: IAutoMovieMotionHumanBody,
  bounded: IAutoMovieMotionHumanBalance,
): void {
  const { CLOCK, RISE, FALL, ORIGIN } = motionComposeTrunk;
  const stance: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, ORIGIN, 0);
  const forward: number = Math.abs(
    body.rest.get("leftToes")!.z - body.rest.get("leftFoot")!.z,
  );
  const standing: IAutoMovieMotionHumanPosture = {
    ...stance,
    root: { ...stance.root, z: stance.root.z + forward },
  };
  const builders: readonly Build[] = [
    (body, balance) =>
      AutoMovieMotionHumanLean.bow({
        body,
        standing,
        peak: 45,
        balance,
        from: 0,
        to: CLOCK.duration,
        weight: () => 1,
      }),
    (body, balance) =>
      AutoMovieMotionHumanTrunk.crouch({
        body,
        standing,
        balance,
        clock: CLOCK,
        rise: RISE,
        fall: FALL,
        depth: body.measure.hipHeight / 4,
        pitch: 45,
      }),
    (body, balance) =>
      AutoMovieMotionHumanTrunk.counterbalance(
        body,
        CLOCK,
        RISE,
        FALL,
        stance,
        balance,
      ),
  ];
  for (const build of builders) {
    const omitted: IAutoMovieMotionHumanPrimitive = build(body, bounded);
    const explicit: IAutoMovieMotionHumanPrimitive = build(body, {
      ...bounded,
      by: "hips",
    });
    const t: number = CLOCK.at("ready");
    TestValidator.predicate(
      "direct requests agree at the peak",
      vclose(omitted.write(standing, t).root, explicit.write(standing, t).root),
    );
    const quiet: IAutoMovieMotionHumanPrimitive = build(
      motionComposeTrunk.withoutMass(body),
    );
    TestValidator.predicate(
      "the optional primitive evaluates without mass",
      vclose(
        quiet.write(standing, t).root,
        build(body).write(standing, t).root,
      ),
    );
    let axis: string | undefined;
    try {
      build(body, { ...bounded, by: "trunk" });
    } catch (error: unknown) {
      if (!(error instanceof HumanRefusal)) throw error;
      axis = error.axis;
    }
    TestValidator.equals(
      "direct builders refuse a prescribed trunk",
      axis,
      "balance.by",
    );
  }
}
