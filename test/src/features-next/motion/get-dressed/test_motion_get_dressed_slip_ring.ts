import {
  type AutoMovieArchetype,
  createFingerRing,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGetDressed,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { everydayTake } from "../../../features/internal/everydayTake";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The rigid custody bound: a worn ring's drift on its bone, metres. */
const RIGID: number = 0.001;

/**
 * How near the worn ring's centre lies to the finger's axis, metres: the ring's
 * own wire, a band seated round the finger.
 */
const SEATED: number = 0.005;

/**
 * How far apart the two stand, metres (staging: the presented hand before the
 * dresser, clear of the dresser's hips; provisional).
 */
const APART: number = 0.75;

/** A ring model. */
type Ring = AutoMovieArchetype<
  createFingerRing.Affordance,
  createFingerRing.Dimension
>;

/** One ring exchange: who gives, who receives, and with which hands. */
interface ICase {
  /** The dresser's body. */
  dresser: motionHumanBody.Name;

  /** The partner's body. */
  partner: motionHumanBody.Name;

  /** The dresser's ring hand. */
  side: AutoMovieHumanSide;

  /** The partner's presented hand. */
  hand: AutoMovieHumanSide;
}

/**
 * A ring exchange (#4015): the partner presents a hand, the dresser holds it
 * from below and slides a ring along the ring finger to its base.
 *
 * Scenarios, each take clean, the average man giving the small woman a ring
 * with his right hand on her left hand, the small woman giving the average man
 * one with her left hand on his right hand (the mirrored hands):
 *
 * 1. The ring is worn from the slide's end on the partner's ring proximal bone,
 *    its centre on the finger's axis, and the ring hand's grip on it ends at
 *    that instant.
 * 2. The worn ring keeps its offset on that bone through the rest of the take
 *    while the partner's arm returns.
 * 3. The other hand holds the partner's palm in a grip window on the partner.
 * 4. Naming the dresser as the partner is refused.
 *
 * Each exchange, each check and the refusal gather their own results, so a
 * refused exchange hides neither the other nor the refusal. The ring's grasp is
 * `test_motion_action_pick_up`'s and the presented hand's place
 * `test_motion_action_present_hand`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scenes, the bounds and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed ring against the partner's displayed finger bones and the plan's windows; a ring off the finger, sliding on it, a grip that outlasts the wear, a missing steadying hold or an admitted self dressing fails.
 * @evidence contracts/development/testing.md#independent-expectations A ring seated on a finger lies on its axis within its wire; a worn prop is rigid on its bone within 1 mm, the dressing specifications' bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Two body pairs with mirrored hands, and the refusal; the arm course's reach refusals are its own specification's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain.
 */
export function test_motion_get_dressed_slip_ring(): void {
  const cases: readonly ICase[] = [
    { dresser: "m-average", partner: "f-small", side: "right", hand: "left" },
    { dresser: "f-small", partner: "m-average", side: "left", hand: "right" },
  ];
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const c of cases) {
    const label: string = `${c.dresser} rings ${c.partner}'s ${c.hand} hand`;
    try {
      ring(checks, label, c);
    } catch (error: unknown) {
      checks.check(`${label}: ${everydayTake.describe(error)}`, false);
    }
  }
  const self: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  let refused: HumanRefusal | undefined;
  try {
    refused = everydayTake.refusal(() =>
      exchange(self, self, cases[0]!, "a").bones("a", 2),
    );
  } catch (error: unknown) {
    checks.check(`ringing oneself: ${everydayTake.describe(error)}`, false);
  }
  checks.check(
    `ringing oneself is refused (${refused === undefined ? "admitted" : `${refused.axis}: ${refused.message}`})`,
    refused !== undefined && refused.axis === "partner",
  );
  checks.assert("slip ring");
}

/** One exchange and its checks. */
function ring(
  checks: motionComplaints.IGatherer,
  label: string,
  c: ICase,
): void {
  const b: IAutoMovieMotionHumanBody = motionHumanBody(c.partner);
  const film: HumanPerformance = exchange(
    motionHumanBody(c.dresser),
    b,
    c,
    "b",
  );
  try {
    assertTakeClean(label, film);
  } catch (error: unknown) {
    checks.check(`${label}: ${everydayTake.describe(error)}`, false);
  }
  const act: IAutoMovieMotionHumanSegment = film
    .segments("a")
    .find((s: IAutoMovieMotionHumanSegment): boolean => s.name === "slipRing")!;
  const worn: number = mark(act, "strokeEnd");
  const grip: IAutoMovieMotionHumanContactWindow | undefined =
    act.plan.contacts.find(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.kind === "grip" &&
        w.support.kind === "prop" &&
        w.support.subject === "ring",
    );
  checks.check(
    `${label}: the ring hand lets go as the ring is worn`,
    grip !== undefined &&
      Math.abs(act.start + grip.to * act.plan.duration - worn) <= 1e-9,
  );
  checks.check(
    `${label}: the other hand holds the partner's palm`,
    act.plan.contacts.some(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.kind === "grip" &&
        w.support.kind === "person" &&
        w.support.subject === "b",
    ),
  );
  const bone: AutoMovieHumanoidBone = `${c.hand}RingProximal`;
  const middle: AutoMovieHumanoidBone = `${c.hand}RingIntermediate`;
  const at: number = worn + 0.02;
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = film.bones(
    "b",
    at,
  );
  const centre: IAutoMovieVector3 = film.prop("ring", at).position;
  const off: number = toAxis(
    centre,
    bones.get(bone)!.worldPosition,
    bones.get(middle)!.worldPosition,
  );
  checks.check(
    `${label}: the worn ring lies on the finger's axis (${(off * 1000).toFixed(1)} mm)`,
    off <= SEATED,
  );
  const first: IAutoMovieVector3 = local(
    film.prop("ring", at),
    bones.get(bone)!,
  );
  const drifts: readonly number[] = [0.5, 1].map((share: number): number => {
    const t: number = at + share * (film.duration - at);
    return Vector3.distance(
      local(film.prop("ring", t), film.bones("b", t).get(bone)!),
      first,
    );
  });
  checks.check(
    `${label}: the ring rides the finger (${drifts.map((d: number): string => (d * 1000).toFixed(2)).join(", ")} mm)`,
    drifts.every((d: number): boolean => d <= RIGID),
  );
}

/**
 * `b` presents a hand; `a` takes the ring up and slips it on `partner`'s
 * finger.
 */
function exchange(
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
  c: ICase,
  partner: string,
): HumanPerformance {
  const ring: Ring = createFingerRing({ id: "ring" });
  const out: number = c.side === "right" ? -1 : 1;
  return new HumanPerformance({
    seed: "slip-ring",
    laws: [
      AutoMovieMotionHumanGetDressed.slipRing,
      AutoMovieMotionHumanGetDressed.presentHand,
    ],
    performers: [
      {
        subject: "a",
        body: a,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body: b,
        at: { x: 0, y: 0, z: APART },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop("ring", ring, {
        // On a stand ahead of the ring hand, between the two.
        position: { x: out * 0.25, y: 1.1, z: 0.3 },
        rotation: Quaternion.identity(),
      }),
    ],
    // The partner presents first, so the dresser reads where the hand is.
    composition: HumanChain.subject("b")
      .registered(AutoMovieMotionHumanGetDressed.presentHand.name, {
        side: c.hand,
        hold: 8,
      })
      .with(
        HumanChain.subject("a")
          .pickUp({ prop: "ring", handle: "hold", hand: c.side, lift: 0.05 })
          .registered(AutoMovieMotionHumanGetDressed.slipRing.name, {
            prop: "ring",
            partner,
            hand: c.hand,
            side: c.side,
          }),
      ).node,
  });
}

/** A point's distance from the line through two points. */
function toAxis(
  p: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number {
  const axis: IAutoMovieVector3 = Vector3.normalize(Vector3.subtract(b, a));
  const d: IAutoMovieVector3 = Vector3.subtract(p, a);
  return Vector3.length(
    Vector3.subtract(d, Vector3.scale(axis, Vector3.dot(d, axis))),
  );
}

/** The film second of a segment's named event. */
function mark(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === name,
      )!.share
  );
}

/** A prop's position in a displayed bone's frame. */
function local(
  prop: IAutoMovieRigidTransform,
  bone: IAutoMovieResolvedBone,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(bone.worldRotation),
    Vector3.subtract(prop.position, bone.worldPosition),
  );
}
