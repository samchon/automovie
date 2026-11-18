import type {
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanRefusal, seated } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { vclose } from "../internal/vclose";

/** Place one grounded action with the requested balance fields. */
type Action = (balance?: IAutoMovieMotionHumanBalance) => IAutoMovieMotionHumanChain;

/**
 * A grounded law that only shifts the pelvis can supply the balancing part.
 *
 * Scenarios:
 * 1. Sitting, kneeling, bowing and squatting produce the same pelvis course
 *    for an explicit hip request and an otherwise identical bounded request.
 * 2. Other parts and missing event bounds keep their field-specific refusals.
 * 3. Gestures and exercises without a hip correction keep their own refusals.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the four eligible actions and the independent part and bound checks.
 * @evidence contracts/development/testing.md#behavioral-verification Places real actions and observes their timed root and prepared balancing part.
 * @evidence contracts/development/testing.md#independent-expectations Each supported action can correct only the pelvis, so spelling hips produces the same displacement.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks absent, partial and explicit requests and two unsupported variants.
 * @evidence contracts/development/testing.md#execution-ownership Shares one canonical body and places each request on a fresh timeline.
 */
export function test_motion_grounded_balance_part(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const chair: IAutoMovieMotionHumanSeated.ISeat = {
    at: { x: 0, y: seated.popliteal(body), z: -0.1 }, yaw: 0, depth: 0.45,
  };
  const actor: IAutoMovieMotionHumanChain = HumanChain.subject("a");
  const actions: readonly Action[] = [
    (balance) => actor.sit({ seat: chair, balance }),
    (balance) => actor.kneel({ balance }),
    (balance) => actor.gesture({ kind: "bow", balance }),
    (balance) => actor.exercise({ kind: "squat", balance }),
  ];
  const bounded: IAutoMovieMotionHumanBalance = { from: { event: "start" }, to: { event: "end" } };
  function place(action: Action, balance?: IAutoMovieMotionHumanBalance): IAutoMovieMotionHumanSegment {
    return new HumanPerformance({
      seed: "grounded-balance-part",
      performers: [{ subject: "a", body, at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level: "trained" } }],
      composition: action(balance).node,
    }).segments("a")[0]!;
  }
  function refusal(action: Action, balance: IAutoMovieMotionHumanBalance): string | undefined {
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
    const named: IAutoMovieMotionHumanSegment = place(action, { ...bounded, by: "hips" });
    const quiet: IAutoMovieMotionHumanSegment = place(action);
    TestValidator.equals("omitting balance keeps the action kinematic", quiet.plan.balanceWindow, undefined);
    TestValidator.equals("the actual prepared correction moves the hips", implied.plan.balanceWindow?.by, "hips");
    for (const share of [0.25, 0.5, 0.75]) {
      const t: number = named.plan.duration * share;
      TestValidator.predicate("both requests produce the same hip position", vclose(
        implied.plan.posture(t).root, named.plan.posture(t).root,
      ));
      displaced ||= !vclose(implied.plan.posture(t).root, quiet.plan.posture(t).root);
    }
    TestValidator.equals("trunk is unsupported", refusal(action, { ...bounded, by: "trunk" }), "balance.by");
    TestValidator.equals("the author supplies the opening event", refusal(action, { to: bounded.to }), "balance.from");
    TestValidator.equals("the author supplies the closing event", refusal(action, { from: bounded.from }), "balance.to");
  }
  TestValidator.predicate("the bounded request produces an observable hip correction", displaced);
  TestValidator.equals("a wave has no hip recommendation",
    refusal((balance) => actor.gesture({ kind: "wave", balance }), bounded), "balance.by");
  TestValidator.equals("a lunge has no hip recommendation",
    refusal((balance) => actor.exercise({ kind: "lunge", balance }), bounded), "balance.by");
}
