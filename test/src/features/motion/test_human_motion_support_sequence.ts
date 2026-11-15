import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type IHumanContactWindow,
  crawl,
  support,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanStance } from "../internal/motionHumanStance";

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
 * contract, a hand target farther from feet held in place than the body
 * laid out reaches.
 *
 * Scenarios, on the average man:
 * 1. The landing plans; and down from standing onto the right knee, the
 *    right foot let go, the knee's window opens no later than the foot's
 *    closes, and the foot's closes before the end: a support the next
 *    stance adds bears before one it lacks lets go.
 * 2. Each palm's window opens after the move starts and closes before it
 *    ends: the palms bear only while the hands-down stance holds.
 * 3. A palm sent to a floor point the body's stature, its arm's span and
 *    half a metre ahead of its toes (past the body laid flat from the
 *    toes with the arm overhead), the feet held where the quiet stance has
 *    them, is refused as a
 *    `reach` refusal on the `stances` axis naming the hand.
 *
 * A step: both feet where the quiet stance has them, then the left foot one foot
 * length ahead with the right where it was; a part bearing in two stances
 * in a row on different places lets go, swings and sets down (a contact
 * broken, then made: Escande et al.). Bounds: the contact miss
 * (`support.MISS`, the audits' skin) and a stepping limb's rise
 * (`crawl.LIFT`), both the planner's owners.
 * 4. The step's events come in order: `lift1`, `bear1`, `stance1`.
 * 5. The left foot bears in two windows, the first closing at `lift1` and
 *    the second opening at `bear1` and lasting to the end; the right foot
 *    bears in one window over the whole step.
 * 6. At `lift1` the left toe joint stands `crawl.LIFT` above the floor over
 *    the middle of the step, within the miss on each axis.
 * 7. At `bear1` the left toe joint lies on its new place across the floor
 *    within the miss.
 * 8. The right toe joint stays on its place across the floor within the
 *    miss at every thirtieth of a second of the step.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans real sequences through the public chain and reads the plan's own windows; a release before the new support bears, a palm bearing outside its stance, or a contact silently missed fails with its numbers.
 * @evidence contracts/development/testing.md#independent-expectations The release order is the transition configuration of the cited planner; the refusal distance is the stature plus the arm's span plus half a metre beyond the toes, read from the body, past what the body laid out reaches with its feet held where the quiet stance has them.
 * @evidence contracts/development/testing.md#distinguishing-cases A met sequence, a refused one and a step of one part between two places, read at its lift, its set-down and throughout on the bearing foot; getUp's routes are test_human_motion_floor_get_up's.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and plans two performances in memory; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the sequences, the rules with their sources and the 8 scenarios.
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

  // 1. A move that adds one support and drops another: down onto the right
  // knee from standing, the right foot let go. The knee bears before the
  // foot releases.
  try {
    const kneel: HumanPerformance = perform([
      { contacts: feet },
      {
        contacts: [
          { part: "leftFoot", kind: "bear" },
          { part: "rightKnee", kind: "bear" },
        ],
      },
    ]);
    const w: readonly IHumanContactWindow[] = kneel.segments("a")[0]!.plan
      .contacts;
    const knee: IHumanContactWindow | undefined = w.find(
      (x: IHumanContactWindow): boolean => x.part === "rightLowerLeg",
    );
    const foot: IHumanContactWindow | undefined = w.find(
      (x: IHumanContactWindow): boolean => x.part === "rightFoot",
    );
    all.check(
      `the right knee bears (from ${knee?.from.toFixed(3)}) before the right foot lets go (at ${foot?.to.toFixed(3)})`,
      knee !== undefined && foot !== undefined && knee.from <= foot.to,
    );
    all.check(
      `the right foot lets go before the end, read ${foot?.to.toFixed(3)}`,
      foot !== undefined && foot.to < 1,
    );
  } catch (error) {
    all.check(`the half kneel plans, refused ${(error as Error).message}`, false);
  }

  // The feet where the quiet stance has them.
  const stance = motionHumanStance(body);
  const toes = (side: "left" | "right") =>
    stance.get(`${side}Toes`)!.worldPosition;
  const on = (x: number, z: number): object => ({
    kind: "point",
    at: { x, y: 0, z },
    frame: "world",
  });
  const planted = (["left", "right"] as const).map((side) => ({
    part: `${side}Foot`,
    kind: "bear",
    target: on(toes(side).x, toes(side).z),
  }));

  // 3. A palm past the arm's span is refused, naming the hand.
  const span: number = body.measure.upperArm + body.measure.forearm;
  let refusal: HumanRefusal | null = null;
  try {
    perform([
      { contacts: planted },
      {
        contacts: [
          ...planted,
          {
            part: "leftHand",
            kind: "bear",
            target: {
              kind: "point",
              at: {
                x: 0,
                y: 0,
                z: toes("left").z + body.measure.stature + span + 0.5,
              },
              frame: "world",
            },
          },
        ],
      },
    ]).segments("a");
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

  // 4 to 8. A step: the left foot one foot length ahead, the right bearing.
  const ahead: number = toes("left").z + body.measure.footLength;
  const right = {
    part: "rightFoot",
    kind: "bear",
    target: on(toes("right").x, toes("right").z),
  };
  let stepped: HumanPerformance | null = null;
  try {
    stepped = perform([
      {
        contacts: [
          {
            part: "leftFoot",
            kind: "bear",
            target: on(toes("left").x, toes("left").z),
          },
          right,
        ],
      },
      {
        contacts: [
          { part: "leftFoot", kind: "bear", target: on(toes("left").x, ahead) },
          right,
        ],
      },
    ]);
  } catch (error) {
    all.check(`the step plans, refused ${(error as Error).message}`, false);
  }
  if (stepped !== null) {
    const step = stepped.segments("a")[0]!;
    const at = (name: string): number | undefined => {
      const e = step.plan.events.find((x): boolean => x.name === name);
      return e === undefined
        ? undefined
        : step.start + e.share * step.plan.duration;
    };
    const lift: number | undefined = at("lift1");
    const bear: number | undefined = at("bear1");
    const held: number | undefined = at("stance1");
    // 4. The step's keys come in order: lifted, set down, held.
    all.check(
      `lift1 ${lift?.toFixed(3)} s, bear1 ${bear?.toFixed(3)} s and stance1 ${held?.toFixed(3)} s in order`,
      lift !== undefined &&
        bear !== undefined &&
        held !== undefined &&
        lift < bear &&
        bear < held,
    );
    // 5. The left foot bears twice, its first window closing at the lift and
    // its second opening as it is set down; the right bears throughout.
    const left = step.plan.contacts.filter(
      (w: IHumanContactWindow): boolean => w.part === "leftFoot",
    );
    const rightWindows = step.plan.contacts.filter(
      (w: IHumanContactWindow): boolean => w.part === "rightFoot",
    );
    const share = (t: number | undefined): number =>
      t === undefined ? NaN : (t - step.start) / step.plan.duration;
    all.check(
      `the left foot lets go at the lift and bears again as it is set down, read ${left.map((w) => `${w.from.toFixed(3)}-${w.to.toFixed(3)}`).join(", ")}`,
      left.length === 2 &&
        Math.abs(left[0]!.to - share(lift)) < 1e-9 &&
        Math.abs(left[1]!.from - share(bear)) < 1e-9 &&
        left[1]!.to === 1,
    );
    all.check(
      `the right foot bears throughout the step, read ${rightWindows.map((w) => `${w.from}-${w.to}`).join(", ")}`,
      rightWindows.length === 1 &&
        rightWindows[0]!.from === 0 &&
        rightWindows[0]!.to === 1,
    );
    const joint = (t: number, side: "left" | "right") =>
      stepped!.bones("a", t).get(`${side}Toes`)!.worldPosition;
    if (lift !== undefined && bear !== undefined) {
      // 6. At the top of the swing the left toe joint is over the step's
      // middle, a stepping limb's rise above the floor, within the miss.
      const top = joint(lift, "left");
      const middle: number = (toes("left").z + ahead) / 2;
      const miss: number = support.MISS / 1000;
      all.check(
        `the swing's top at ${(top.y * 1000).toFixed(1)} mm high and ${((top.z - middle) * 1000).toFixed(1)} mm from the step's middle, ${(crawl.LIFT * 1000).toFixed(0)} mm high and over it within ${support.MISS} mm`,
        Math.abs(top.y - crawl.LIFT) <= miss &&
          Math.abs(top.z - middle) <= miss &&
          Math.abs(top.x - toes("left").x) <= miss,
      );
      // 7. Set down, the left toe joint is on its new place across the floor.
      const down = joint(bear, "left");
      all.check(
        `set down ${(Math.hypot(down.x - toes("left").x, down.z - ahead) * 1000).toFixed(1)} mm from its place, within ${support.MISS} mm`,
        Math.hypot(down.x - toes("left").x, down.z - ahead) <= miss,
      );
      // 8. The bearing right foot does not slide over the step.
      let slide: number = 0;
      for (
        let t: number = step.start;
        t <= step.start + step.plan.duration;
        t += 1 / 30
      ) {
        const r = joint(t, "right");
        slide = Math.max(
          slide,
          Math.hypot(r.x - toes("right").x, r.z - toes("right").z),
        );
      }
      all.check(
        `the right toe joint keeps its place within ${support.MISS} mm, read ${(slide * 1000).toFixed(1)} mm`,
        slide <= miss,
      );
    }
  }
  all.assert(
    "the support planner places new supports before it releases old ones",
  );
}
