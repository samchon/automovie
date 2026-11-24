import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionTarget,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanCare,
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

const { AutoMovieMotionHumanTouchEffector, touchEffectors } =
  AutoMovieMotionHumanTouch;

/** The touch contract's contact bound, metres. */
const TOUCH: number = 0.01;

/** The AHA 2020 adult compression rate band, per minute. */
const RATE: readonly [number, number] = [100, 120];

/** The least elbow angle of a straight arm, degrees (provisional: within 10 degrees of straight). */
const STRAIGHT: number = 170;

/** How far a shoulder may stand off the vertical over its hand, metres (provisional). */
const OVER: number = 0.1;

/** How far short of the lying partner's sternum line the knees come down, metres: half the partner's chest breadth and the carer's shank radius, the knee against the partner's side. */
function beside(
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
): number {
  return b.measure.chestBreadth / 2 + a.measure.shankRadius;
}

/** How far before the knee point the carer stands, metres (provisional: within one step). */
const STEP: number = 0.35;

/** A knee point beyond the reach of a lying partner's sternum, metres. */
const FAR: number = 2;

/** How far a knee may land from its named floor point, metres (provisional: the knee's own radius). */
const KNEE: number = 0.05;

/**
 * First aid on a lying partner: compressions, a pulse check and pressure on
 * a wound, from a carer kneeling beside them.
 *
 * Scenarios, for the average man caring for the small woman and the reverse:
 * 1. The carer kneels with the right knee at its point beside the partner,
 *    within 50 mm, and one compression cycle presses 30 times at 100 to 120 a minute with both
 *    palms on the partner's sternum within 10 mm, the elbows straight and
 *    the shoulders over the hands.
 * 2. A carotid pulse check holds the fingertips on the partner's neck for
 *    10 s within 10 mm.
 * 3. Pressure on a wounded thigh holds both palms on it.
 * 4. A partner out of the kneeling carer's reach is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the four cases and their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed palms, fingertips, arms and the partner's displayed regions at the acts' events; a wrong count or rate, a palm off the sternum, bent elbows, shoulders behind the hands, a short or misplaced pulse hold or an admitted unreachable partner fails.
 * @evidence contracts/development/testing.md#independent-expectations The count, rate and pulse hold are the AHA 2020 guideline's; the contact bound is the touch contract's.
 * @evidence contracts/development/testing.md#distinguishing-cases Both body pairs, all three acts and the reach refusal.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory two-performer performance through the public chain.
 */
export function test_motion_care_basic(): void {
  for (const [carer, patient] of [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ] as const) {
    const a: IAutoMovieMotionHumanBody = motionHumanBody(carer);
    const b: IAutoMovieMotionHumanBody = motionHumanBody(patient);
    const label: string = `${carer} cares for ${patient}`;
    const cpr: HumanPerformance = stage(
      a,
      b,
      beside(a, b),
      (
        chain: IAutoMovieMotionHumanChain,
        knee: IAutoMovieMotionTarget,
      ): IAutoMovieMotionHumanChain =>
        AutoMovieMotionHumanCare.compressions(
          AutoMovieMotionHumanCare.kneelBeside(chain, { at: knee }),
          { partner: "b" },
        ),
    );
    assertTakeClean(`${label}: compressions`, cpr);
    const press: IAutoMovieMotionHumanSegment = named(cpr, "touch");
    const from: number = event(press, "strokeStart");
    const to: number = event(press, "strokeEnd");
    const rate: number = (AutoMovieMotionHumanCare.COMPRESSION_CYCLE / (to - from)) * 60;
    TestValidator.predicate(
      `${label}: 30 compressions at ${rate.toFixed(1)} a minute`,
      rate >= RATE[0] && rate <= RATE[1],
    );
    const t: number = event(press, "ready");
    const sternum: IAutoMovieVector3 = place(b, cpr.bones("b", t), "sternum");
    const knee: IAutoMovieVector3 = cpr
      .bones("a", t)
      .get("rightLowerLeg")!.worldPosition;
    const off: number = Math.hypot(
      knee.x - (sternum.x + a.rest.get("rightFoot")!.x),
      knee.z - (sternum.z - beside(a, b)),
    );
    TestValidator.predicate(
      `${label}: the right knee is down ${(off * 1000).toFixed(1)} mm from its point beside the partner`,
      off <= KNEE,
    );
    for (const side of ["left", "right"] as const) {
      TestValidator.predicate(
        `${label}: the ${side} palm is on the sternum`,
        gap(cpr, a, b, side, "sternum", touchEffectors.TABLE.palm, t) <= TOUCH,
      );
      TestValidator.predicate(
        `${label}: the ${side} arm is straight with the shoulder over the hand`,
        straight(cpr.bones("a", t), side),
      );
    }

    const check: HumanPerformance = stage(
      a,
      b,
      beside(a, b),
      (
        chain: IAutoMovieMotionHumanChain,
        knee: IAutoMovieMotionTarget,
      ): IAutoMovieMotionHumanChain =>
        AutoMovieMotionHumanCare.pulse(
          AutoMovieMotionHumanCare.kneelBeside(chain, { at: knee }),
          { partner: "b", site: "carotid" },
        ),
    );
    assertTakeClean(`${label}: pulse`, check);
    const feel: IAutoMovieMotionHumanSegment = named(check, "touch");
    const felt: number = event(feel, "relax") - event(feel, "ready");
    TestValidator.predicate(
      `${label}: the pulse is felt for 10 s at the neck`,
      felt >= AutoMovieMotionHumanCare.PULSE_HOLD - 1e-6 &&
        [0, 0.5, 1].every(
          (share: number): boolean =>
            gap(
              check,
              a,
              b,
              "right",
              "neckLeft",
              touchEffectors.TABLE.fingertips,
              event(feel, "ready") + share * felt,
            ) <= TOUCH,
        ),
    );

    const wound: HumanPerformance = stage(
      a,
      b,
      beside(a, b),
      (
        chain: IAutoMovieMotionHumanChain,
        knee: IAutoMovieMotionTarget,
      ): IAutoMovieMotionHumanChain =>
        AutoMovieMotionHumanCare.pressWound(
          AutoMovieMotionHumanCare.kneelBeside(chain, { at: knee }),
          { partner: "b", region: "thighFrontLeft", hold: 2 },
        ),
    );
    assertTakeClean(`${label}: wound`, wound);
    const held: IAutoMovieMotionHumanSegment = named(wound, "touch");
    TestValidator.predicate(
      `${label}: both palms press the wound`,
      (["left", "right"] as const).every(
        (side: AutoMovieHumanSide): boolean =>
          gap(
            wound,
            a,
            b,
            side,
            "thighFrontLeft",
            touchEffectors.TABLE.palm,
            event(held, "ready"),
          ) <= TOUCH,
      ),
    );

    TestValidator.predicate(
      `${label}: a partner out of reach is refused`,
      (() => {
        try {
          stage(
            a,
            b,
            FAR,
            (
              chain: IAutoMovieMotionHumanChain,
              knee: IAutoMovieMotionTarget,
            ): IAutoMovieMotionHumanChain =>
              AutoMovieMotionHumanCare.compressions(
                AutoMovieMotionHumanCare.kneelBeside(chain, { at: knee }),
                { partner: "b" },
              ),
          ).bones("a", 3);
          return false;
        } catch (error: unknown) {
          return error instanceof HumanRefusal;
        }
      })(),
    );
  }
}

/** A care composition appended to the carer's chain, kneeling at the knee point. */
type Care = (
  chain: IAutoMovieMotionHumanChain,
  knee: IAutoMovieMotionTarget,
) => IAutoMovieMotionHumanChain;

/**
 * The patient `b` lies down on the floor first; the carer `a` faces the
 * patient's side and stands until the patient is down, `STEP` metres before
 * the right knee's point, which lies `beside` metres short of the lying
 * patient's sternum line under the carer's right hip, then performs the care.
 */
function stage(
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
  beside: number,
  care: Care,
): HumanPerformance {
  const patient = (
    at: IAutoMovieMotionHumanPerformer["at"],
  ): IAutoMovieMotionHumanPerformer => ({
    subject: "b",
    body: b,
    at,
    yaw: 90,
    proficiency: { level: "trained" },
  });
  const alone: HumanPerformance = new HumanPerformance({
    seed: "care",
    performers: [patient({ x: 0, y: 0, z: 0 })],
    composition: HumanChain.subject("b").act("lieDown", {}).node,
  });
  const sternum: IAutoMovieVector3 = place(
    b,
    alone.bones("b", alone.duration),
    "sternum",
  );
  const knee: IAutoMovieVector3 = {
    x: sternum.x + a.rest.get("rightFoot")!.x,
    y: 0,
    z: sternum.z - beside,
  };
  return new HumanPerformance({
    seed: "care",
    performers: [
      {
        subject: "a",
        body: a,
        at: { x: sternum.x, y: 0, z: knee.z - STEP },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      patient({ x: 0, y: 0, z: 0 }),
    ],
    // The patient is placed first, so the carer reads where the patient lies.
    composition: HumanChain.subject("b")
      .act("lieDown", {})
      .with(
        care(HumanChain.subject("a").stand({ hold: alone.duration }), {
          kind: "point",
          frame: "world",
          at: knee,
        }),
      ).node,
  });
}

/** A body region's displayed point, world metres. */
function place(
  body: IAutoMovieMotionHumanBody,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  region: AutoMovieHumanoidRegion,
): IAutoMovieVector3 {
  const frame: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
    body.surfaces.regions[region];
  return resolveAutoMovieHumanoidSurfaces.place(frame, bones.get(frame.bone)!)
    .point;
}
/** The carer's first segment of an action. */
function named(
  film: HumanPerformance,
  name: string,
): IAutoMovieMotionHumanSegment {
  return film
    .segments("a")
    .find(
      (segment: IAutoMovieMotionHumanSegment): boolean => segment.name === name,
    )!;
}

/** The film second of a segment's named event. */
function event(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find(
        (item: IAutoMovieMotionEvent): boolean => item.name === name,
      )!.share
  );
}

/** How far a carer's hand surface is from a region of the patient, metres. */
function gap(
  film: HumanPerformance,
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  region: AutoMovieHumanoidRegion,
  effector: Parameters<typeof AutoMovieMotionHumanTouchEffector.point>[3],
  t: number,
): number {
  return Vector3.distance(
    AutoMovieMotionHumanTouchEffector.point(
      a,
      film.bones("a", t),
      side,
      effector,
    ),
    place(b, film.bones("b", t), region),
  );
}

/** Whether an arm is straight at the elbow with its shoulder over its hand. */
function straight(
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  side: AutoMovieHumanSide,
): boolean {
  const shoulder: IAutoMovieVector3 = bones.get(
    `${side}UpperArm`,
  )!.worldPosition;
  const elbow: IAutoMovieVector3 = bones.get(`${side}LowerArm`)!.worldPosition;
  const hand: IAutoMovieVector3 = bones.get(`${side}Hand`)!.worldPosition;
  const upper: IAutoMovieVector3 = Vector3.subtract(shoulder, elbow);
  const lower: IAutoMovieVector3 = Vector3.subtract(hand, elbow);
  const angle: number =
    (Math.acos(
      Vector3.dot(upper, lower) /
        (Vector3.length(upper) * Vector3.length(lower)),
    ) *
      180) /
    Math.PI;
  return (
    angle >= STRAIGHT &&
    Math.hypot(shoulder.x - hand.x, shoulder.z - hand.z) <= OVER
  );
}
