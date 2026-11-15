import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type IHumanContactWindow,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The support planner (`support`) moves the body's weight across a sequence
 * of stances: every new support bears before an old one lets go, and a
 * contact no key posture reaches is refused with the contact named.
 *
 * The sequence is a hands-down landing from standing and back: standing on
 * both feet, the palms laid on the floor beside the feet (no place given,
 * so the fit lays them where the body reaches with the centre of mass over
 * the bearing parts), and standing again. The release rule is Escande,
 * Kheddar and Miossec 2013's transition configuration, a stance's new
 * contacts placed while the old still bear; the refusal is the planner's own
 * contract, a hand target 0.5 m past the arm's span.
 *
 * Scenarios, on the average man:
 * 1. The landing plans, and for each pair of consecutive stances no contact
 *    window of the first that the second lacks closes before every window
 *    the second adds has opened.
 * 2. Each palm's window opens after the move starts and closes before it
 *    ends: the palms bear only while the hands-down stance holds.
 * 3. A palm sent to a floor point 0.5 m past the arm's span ahead is refused
 *    as a `reach` refusal on the `stances` axis naming the hand.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans real sequences through the public chain and reads the plan's own windows; a release before the new support bears, a palm bearing outside its stance, or a contact silently missed fails with its numbers.
 * @evidence contracts/development/testing.md#independent-expectations The release order is the transition configuration of the cited planner; the refusal distance is the arm's span plus half a metre, read from the body.
 * @evidence contracts/development/testing.md#distinguishing-cases A met sequence and a refused one; getUp's routes are test_human_motion_floor_get_up's.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and plans two performances in memory; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the sequence, the rule with its source and the 3 scenarios.
 */
export function test_human_motion_support_sequence(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const body = motionHumanBody("m-average");
  const feet = [
    { part: "leftFoot", kind: "bear" },
    { part: "rightFoot", kind: "bear" },
  ] as const;
  const hands = [
    { part: "leftHand", kind: "bear" },
    { part: "rightHand", kind: "bear" },
  ] as const;
  const perform = (stances: unknown): HumanPerformance =>
    new HumanPerformance({
      seed: "support",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").act("support", { stances } as never)
        .node,
    });

  // 1. and 2. The landing and the order of its windows.
  const landing: HumanPerformance = perform([
    { contacts: feet },
    { contacts: [...feet, ...hands] },
    { contacts: feet },
  ]);
  const plan = landing.segments("a")[0]!.plan;
  const windows: readonly IHumanContactWindow[] = plan.contacts;
  const palm = windows.filter((w: IHumanContactWindow): boolean =>
    w.part.endsWith("Hand"),
  );
  all.check(`two palm windows, read ${palm.length}`, palm.length === 2);
  for (const w of palm)
    all.check(
      `the ${w.part} bears inside the move, ${w.from.toFixed(3)} to ${w.to.toFixed(3)}`,
      w.from > 0 && w.to < 1 && w.to > w.from,
    );
  const feetWindows = windows.filter((w: IHumanContactWindow): boolean =>
    w.part.endsWith("Foot"),
  );
  all.check(
    `each foot bears throughout, read ${feetWindows.map((w) => `${w.part} ${w.from}-${w.to}`).join(", ")}`,
    feetWindows.length === 2 &&
      feetWindows.every(
        (w: IHumanContactWindow): boolean => w.from === 0 && w.to === 1,
      ),
  );

  // 3. A palm past the arm's span is refused, naming the hand.
  const span: number = body.measure.upperArm + body.measure.forearm;
  let refusal: HumanRefusal | null = null;
  try {
    perform([
      { contacts: feet },
      {
        contacts: [
          ...feet,
          {
            part: "leftHand",
            kind: "bear",
            target: {
              kind: "point",
              at: { x: 0, y: 0, z: span * 2 + 0.5 },
              frame: "world",
            },
          },
        ],
      },
    ]);
  } catch (error) {
    if (error instanceof HumanRefusal) refusal = error;
    else throw error;
  }
  all.check(
    `a palm past the span is a reach refusal on the stances axis naming the hand, read ${refusal?.message ?? "none"}`,
    refusal !== null &&
      refusal.kind === "reach" &&
      refusal.axis === "stances" &&
      refusal.message.includes("leftHand"),
  );
  all.assert(
    "the support planner places new supports before it releases old ones",
  );
}
