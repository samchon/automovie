import type {
  AutoMovieMotionHumanChannelClaim,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/** A one-second overlay that bends the named joints of a hand and claims what it is given. */
const bend = (
  name: string,
  claims: readonly AutoMovieMotionHumanChannelClaim[],
  joints: IAutoMovieMotionHumanPosture["joints"],
): IAutoMovieMotionHumanActionLaw<object> => ({
  name,
  interrupts: {},
  overlay: true,
  plan: (
    context: IAutoMovieMotionHumanActionContext<object>,
  ): IAutoMovieMotionHumanActionPlan => ({
    duration: 1,
    events: [],
    contacts: [],
    channels: claims,
    posture: (): IAutoMovieMotionHumanPosture => ({
      ...context.entry.posture,
      joints: { ...context.entry.posture.joints, ...joints },
    }),
  }),
});

/**
 * Overlays that claim single digits of a hand (#3445).
 *
 * The average man stands for three seconds; overlays are performed over the
 * stand, which yields both hands.
 *
 * Scenarios:
 *
 * 1. Two disjoint digit overlays leave the unclaimed middle finger at its
 *    entry flexion despite both attempting to write it.
 * 2. Two overlays of one span claiming the thumb and the forefinger of the
 *    same hand compose: both plan, and each bends only its digit.
 * 3. An overlay claiming the whole right hand clashes with one claiming its
 *    thumb in the same span: refused, the refusal naming the thumb.
 * 4. Two overlays claiming the same digit in one span are refused.
 * 5. A digit of the other hand never clashes: the left thumb with the right
 *    hand's claim plans.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers overlay laws that claim digits, performs them over a stand and reads the displayed joints or the refusal.
 * @evidence contracts/development/testing.md#independent-expectations The hand-digit partition: a hand covers its digits, a digit only itself, two digits of one hand are disjoint.
 * @evidence contracts/development/testing.md#distinguishing-cases A rejected write to a neighbour, two disjoint digits, a hand against its digit, the same digit twice, and the other hand.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test preparing one polygon man; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the cast and the five scenarios.
 */
export function test_motion_catalogue_claim_conflict(): void {
  const complaints: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const laws: IAutoMovieMotionHumanActionLaw<never>[] = [
    bend("thumbBend", ["rightThumb"], {
      rightThumbProximal: [40, 0, 0],
      rightThumbDistal: [40, 0, 0],
      rightMiddleProximal: [40, 0, 0],
    }),
    bend("indexBend", ["rightIndex"], {
      rightIndexProximal: [60, 0, 0],
      rightIndexIntermediate: [60, 0, 0],
      rightMiddleProximal: [60, 0, 0],
    }),
    bend("handBend", ["rightHand"], { rightMiddleProximal: [60, 0, 0] }),
    bend("leftThumbBend", ["leftThumb"], { leftThumbProximal: [40, 0, 0] }),
  ] as unknown as IAutoMovieMotionHumanActionLaw<never>[];
  const perform = (
    over: readonly string[],
    sequential: boolean = false,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "claims",
      laws,
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: (sequential
        ? HumanChain.subject("a")
            .stand({ hold: 3 })
            .over((layer) =>
              over.reduce((chain, name) => chain.registered(name), layer),
            )
        : over.reduce(
            (
              chain: IAutoMovieMotionHumanChain,
              name: string,
            ): IAutoMovieMotionHumanChain =>
              chain.over((o) => o.registered(name)),
            HumanChain.subject("a").stand({ hold: 3 }),
          )
      ).node,
    });
  const flexion = (pose: IAutoMoviePose, bone: string): number =>
    pose.joints.find((joint) => joint.bone === bone)?.flexion ?? 0;

  // Two concurrent disjoint writes and an untouched neighbour are visible
  // on one midpoint. Each fixture also tries to write the unclaimed middle
  // finger, so preserving it proves the channel actually filters writes.
  // Sequential writes can share a digit when they meet at the same endpoint.
  const serial: IAutoMovieMotionHumanPerformance = perform(
    ["thumbBend", "thumbBend"],
    true,
  );
  const spans = serial.overlays("a");
  TestValidator.equals("two serial writes are accepted", spans.length, 2);
  TestValidator.predicate(
    "serial windows meet without overlap",
    Math.abs(spans[0]!.end - spans[1]!.start) < 1e-9,
  );
  const pair: IAutoMovieMotionHumanPerformance = perform([
    "thumbBend",
    "indexBend",
  ]);
  const entry: IAutoMoviePose = pair.pose("a", 0);
  const mid: IAutoMoviePose = pair.pose(
    "a",
    pair.overlays("a")[0]!.start + 0.5,
  );
  for (const [bone, expected] of [
    ["rightThumbProximal", 40],
    ["rightIndexProximal", 60],
    ["rightMiddleProximal", flexion(entry, "rightMiddleProximal")],
  ] as const) {
    const actual: number = flexion(mid, bone);
    if (!(Math.abs(actual - expected) <= 1e-6))
      complaints.push(`${bone} bends ${actual} degrees, expected ${expected}`);
  }
  // 3, 4. Clashes.
  for (const [over, digit] of [
    [["handBend", "thumbBend"], "rightThumb"],
    [["thumbBend", "thumbBend"], "rightThumb"],
  ] as const)
    try {
      perform(over);
      complaints.push(`${over.join(" + ")}: expected a refusal`);
    } catch (error) {
      if (
        !(error instanceof HumanRefusal) ||
        !(error as Error).message.includes(digit)
      )
        complaints.push(
          `${over.join(" + ")}: refused with "${(error as Error).message}", the clash on ${digit} expected`,
        );
    }

  // 5. The other hand's digit.
  try {
    perform(["handBend", "leftThumbBend"]);
  } catch (error) {
    complaints.push(
      `the right hand and the left thumb: expected to plan, got ${(error as Error).message}`,
    );
  }
  TestValidator.equals("overlays that claim single digits", complaints, []);
}
