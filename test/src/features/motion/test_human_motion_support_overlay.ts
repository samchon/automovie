import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSupport,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanRefusal } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { qclose } from "../internal/qclose";
import { vclose } from "../internal/vclose";

/**
 * A support sequence can carry an overlay on one arm while it bears on
 * the other hand (#3418, #3575). An overlay may only take the free arm
 * and hand, so the loaded contact and the preparation for it remain owned
 * by the support action.
 *
 * Scenarios, on the average man:
 * 1. The left hand signals after the right palm is placed on the floor.
 *    The bearing wrist is in the same world pose at the stroke midpoint
 *    as in the support sequence alone.
 * 2. The same signal performed by the right hand at that event is refused
 *    on the overlay axis, naming the reserved arm and hand.
 * 3. A signal started over a stand cannot keep the arm when a braced
 *    support sequence takes over, at either a contiguous join or a cut.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes the free hand and the one reserved by a support window.
 * @evidence contracts/development/testing.md#behavioral-verification Schedules both hand choices through the public chain, reads the active support window and displayed wrist, and inspects typed refusals at entry and carrier changes.
 * @evidence contracts/development/testing.md#independent-expectations The contact owner keeps its hand in the same pose whether the other arm moves, so the unlayered sequence supplies the expected wrist transform.
 * @evidence contracts/development/testing.md#distinguishing-cases Signals use opposite sides in the same support sequence. The carrier-change cases cover a contiguous join and a cut while the prior carrier can still hold the signal.
 * @evidence contracts/development/testing.md#execution-ownership The motion runner discovers this CPU-only spec, which reads two displayed poses and plans each signal through the public schedule.
 */
export function test_human_motion_support_overlay(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const leftFoot: IAutoMovieMotionHumanSupport.IContact = {
    part: "leftFoot",
    kind: "bear",
  };
  const bracedContacts: IAutoMovieMotionHumanSupport.IParams = {
    stances: [
      { contacts: [leftFoot, { part: "rightFoot", kind: "bear" }] },
      {
        contacts: [leftFoot, { part: "rightHand", kind: "bear" }],
        seconds: 4,
      },
    ],
  };
  const braced: IAutoMovieMotionHumanChain = HumanChain.subject("person").support(
    bracedContacts,
    "braced",
  );
  const onBrace = (side: "left" | "right"): IAutoMovieMotionHumanChain =>
    braced.over(
      (upper: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
        upper
          .gesture({ kind: "stopPalm", side })
          .sync({ of: "braced", event: "bear1" }),
    );

  try {
    const supported: IAutoMovieMotionHumanPerformance = perform(
      body,
      onBrace("left"),
    );
    const plain: IAutoMovieMotionHumanPerformance = perform(body, braced);
    const carrier: IAutoMovieMotionHumanSegment =
      supported.segments("person")[0]!;
    const signal: IAutoMovieMotionHumanSegment.IOverlay =
      supported.overlays("person")[0]!;
    const stroke: number =
      (instant(signal, "strokeStart") + instant(signal, "strokeEnd")) / 2;
    const share: number = (stroke - carrier.start) / carrier.plan.duration;
    all.check(
      "the right hand bears during the left-hand stroke",
      carrier.plan.contacts.some(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.part === "rightHand" &&
          c.kind === "plant" &&
          c.support.kind === "ground" &&
          c.from <= share &&
          share <= c.to,
      ),
    );
    all.equals(
      "the signal takes the arm opposite the planted hand",
      [...signal.channels].sort((a: string, b: string): number => a.localeCompare(b)),
      ["leftArm", "leftHand"],
    );
    const posed: IAutoMovieResolvedBone = supported
      .bones("person", stroke)
      .get("rightHand")!;
    const alone: IAutoMovieResolvedBone = plain
      .bones("person", stroke)
      .get("rightHand")!;
    all.check(
      "the right hand keeps the same supported pose under the left signal",
      vclose(posed.worldPosition, alone.worldPosition) &&
        qclose(posed.worldRotation, alone.worldRotation),
    );
  } catch (error) {
    all.check(
      `the free hand can signal when the right bears: ${String(error)}`,
      false,
    );
  }

  let caught: unknown;
  try {
    perform(body, onBrace("right"));
  } catch (error) {
    caught = error;
  }
  all.check(
    `the right arm and hand stay reserved, received ${String(caught)}`,
    caught instanceof HumanRefusal &&
      caught.kind === "channel" &&
      caught.axis === "over" &&
      Array.isArray(caught.value) &&
      caught.value.includes("rightArm") &&
      caught.value.includes("rightHand"),
  );

  for (const [join, standSeconds] of [
    ["contiguous join", 0.25],
    ["cut", 2],
  ] as const) {
    let overlap: unknown;
    try {
      perform(
        body,
        HumanChain.subject("person")
          .stand({ seconds: standSeconds }, "before")
          .over((upper: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
            upper.gesture({ kind: "stopPalm", side: "right", hold: 1 }),
          )
          .support(bracedContacts, "after")
          .sync({ of: "before", event: "start", offset: 0.25 }),
      );
    } catch (error) {
      overlap = error;
    }
    all.check(
      `the support reserves its palm after a ${join}, received ${String(overlap)}`,
      overlap instanceof HumanRefusal &&
        overlap.kind === "channel" &&
        overlap.axis === "over" &&
        Array.isArray(overlap.value) &&
        overlap.value.includes("rightArm") &&
        overlap.value.includes("rightHand") &&
        overlap.message.includes("after"),
    );
  }
  all.assert("overlays respect the carrier's hand contacts");
}

/** Builds each variant with identical body, entry and seed. */
function perform(
  body: IAutoMovieMotionHumanBody,
  chain: IAutoMovieMotionHumanChain,
): IAutoMovieMotionHumanPerformance {
  return new HumanPerformance({
    seed: "support-overlay",
    performers: [
      {
        subject: "person",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: chain.node,
  });
}

/** Converts an event share to its film second. */
function instant(segment: IAutoMovieMotionHumanSegment, event: string): number {
  const share: number = segment.plan.events.find(
    (each): boolean => each.name === event,
  )!.share;
  return segment.start + share * segment.plan.duration;
}
