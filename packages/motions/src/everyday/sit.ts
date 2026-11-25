import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSit,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { standUpright } from "../actions/standUpright";
import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanPhysics } from "../law/HumanPhysics";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanMountOn } from "../lexicon/HumanMountOn";
import { prepareSeatedPalms } from "./prepareSeatedPalms";
import { prepareSitBalance } from "./prepareSitBalance";
import { prepareSitLowering } from "./prepareSitLowering";
import { prepareSitWorkingFeet } from "./prepareSitWorkingFeet";
import { seated } from "./seated";
import { seatedCourse } from "./seatedCourse";
import { sitCarried } from "./sitCarried";
import { sitHandSpans } from "./sitHandSpans";
import { sitHands } from "./sitHands";
import { sitPlace } from "./sitPlace";

/** The alternatives of `CROSSEDEntryItem`'s site. */
type CROSSEDEntryItem = "ahead" | "over" | "lift";

/**
 * Sitting down on a chair, bench or stool from standing in front of it: the
 * body's seat socket is lowered onto the seat while the trunk leans forward and
 * the feet stay where they stand.
 *
 * Stand-to-sit is the rise reversed under eccentric control (Kralj, Jaeger and
 * Munih 1990, J Biomech 23:1123): the hips travel back and down, the trunk
 * flexes forward to keep the weight over the feet until the seat takes it, then
 * the trunk settles into the seated posture. The goal is the seat socket on its
 * point on the seat ({@link seated}); the root follows from that goal and the
 * trunk's pitch, the planted legs and the hands are solved by inverse
 * kinematics. The socket moves back over the first 70 % of the descent, no
 * further than keeps the centre of mass where it stands over the feet until a
 * pendulum's time constant before contact (Hof, Gazendam and Sinke 2005), over
 * which the body comes down onto the seat, and down from 10 % to its end, so it
 * reaches the seat from above; the trunk pitches forward to its peak by 45 % of
 * the descent and settles after contact; each hand is brought to its rest along
 * the arm trajectory planner's path, onto its armrest as the seat takes the
 * body, the two supports loaded together where the armrest lies nearest the
 * shoulder, or, with none, onto its thigh from contact to seated, once the
 * thighs no longer rise under it, the fingers straightening to lie flat.
 *
 * Peak trunk flexion `35 + 50 (1 - r)` degrees and descent time `2 (1 + 0.6 (1
 *
 * - R))`seconds for a seat at`r`of the popliteal height (provisional
 *   coefficients; a lower seat needs more trunk flexion and more time, Janssen,
 *   Bussmann and Stam 2002, and sit-to-stand takes about 1.5 to 2.5 s in
 *   healthy adults). Contact comes at 75 % of the descent. The seated back
 *   is`upright`(pitch 0),`lean`(12 degrees back onto a backrest, which the seat
 *   must have) or`slump` (pelvis 10 degrees back, chest 12 and spine 8 flexed),
 *   all provisional.
 *
 * The performer must stand facing within 20 degrees of the seat's heading with
 * feet the legs can reach from the seat; otherwise the sit is refused with the
 * range of foot distances that work. Events `commit` (the last instant the
 * sitting can be abandoned for standing), `seatContact` and `seated`; the seat
 * window starts at contact.
 *
 * A seat above 1.2 of the popliteal height, or one sat astride, is got onto
 * instead ({@link HumanMountOn}): the feet leave the floor for the seat's rests
 * or hang, under the same parameters, events and cancel table.
 */
export namespace sit {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "sit";

  /**
   * Cancel table. Sitting is abandoned for standing only until `commit`, while
   * both feet still stand on the floor: the seat's contact on a seat inside the
   * band, and the first foot leaving the floor on a high seat. Past it the body
   * is got down by `rise`.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: [0, "commit"],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    rise: [
      {
        window: ["seatContact", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    shift: [{ window: ["seated", 1], kind: "inertialize", entry: 0 }],
  };

  /**
   * Largest heading difference from the seat's at which a sit starts, degrees
   * (provisional: a small turn the descent absorbs).
   */
  const FACING: number = 20;

  /**
   * Shares of the descent: the seat takes the body at `CONTACT`, the socket
   * travels back over `ACROSS`, comes down from `DOWN` and the trunk peaks by
   * `FLEXED` (provisional, as the namespace states).
   */
  const CONTACT: number = 0.75;

  /** See `CONTACT`. */
  const ACROSS: number = 0.7;

  /** See `CONTACT`. */
  const DOWN: number = 0.1;

  /** See `CONTACT`. */
  const FLEXED: number = 0.45;

  /**
   * The share of the descent at which a hand leaves for its armrest
   * (provisional).
   */
  const REACHING: number = 0.2;

  /**
   * Where the crossed left foot sets down, by shares of the feet's rest
   * spacing: `ahead` of the right ankle, `over` across it, and the `lift` of
   * its swing (provisional).
   */
  const CROSSED: Readonly<Record<CROSSEDEntryItem, number>> = {
    ahead: 0.6,
    over: 0.4,
    lift: 0.3,
  };

  /**
   * Seconds the left foot takes to cross over the right ankle once seated
   * (provisional).
   */
  export const CROSS: number = 0.6;

  /**
   * Plan a sit.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the seat is too low for the body, the performer
   *   does not face away from it, the feet are out of reach of a seat inside
   *   the band, the body stands more than a leg's length from a high seat, or
   *   `lean` has no backrest.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSit.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const seat: IAutoMovieMotionHumanSeated.ISeat = context.params.seat;
    // The seat's height is measured from the floor the feet stand on, a
    // boat's or a stage's as well as the ground.
    const under: number = seated.floor(body, context.entry);
    seated.check(body, seat, under);
    const back: NonNullable<IAutoMovieMotionHumanSit.IParams["back"]> =
      context.params.back ?? "upright";
    if (back === "lean" && seat.back === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "back",
        value: "lean",
        feasible: { kind: "alternatives", values: ["upright", "slump"] },
        reason: `leaning back needs a seat with a backrest`,
        fix: "give the seat a back, or sit upright",
      });
    const turn: number = sitPlace.turn(seat.yaw - context.entry.posture.yaw);
    if (Math.abs(turn) > FACING)
      throw new HumanRefusal({
        kind: "base",
        axis: "seat",
        value: turn,
        feasible: {
          kind: "range",
          minimum: -FACING,
          maximum: FACING,
          unit: "degrees",
        },
        reason: `stands ${turn.toFixed(1)} degrees off the seat's heading; turn to within ${FACING} degrees of facing away from the seat first`,
        fix: `turn to within ${FACING} degrees of facing away from the seat first, or turn the seat`,
      });
    if (seated.high(body, seat, under) || seat.astride === true)
      return sitCarried(
        context,
        seat,
        HumanMountOn.plan(context, seat, sitPlace.BACKS[back], turn),
        true,
      );
    // The feet stand on that floor.
    const entered: Record<AutoMovieHumanSide, IAutoMovieVector3> = stand.feet(
      body,
      context.entry,
      context.entry.posture.yaw,
    );
    const goal: IAutoMovieVector3 = seated.point(body, seat);
    const final: (typeof sitPlace.BACKS)[typeof back] = sitPlace.BACKS[back];
    const relaxed: IAutoMovieMotionHumanPosture["joints"] = {
      ...stand.relaxed(body),
      ...standUpright(body).joints,
    };
    const adjusted: ReturnType<typeof prepareSitWorkingFeet> =
      prepareSitWorkingFeet(context, entered, goal, final.pitch, relaxed);
    const feet: Record<AutoMovieHumanSide, IAutoMovieVector3> =
      adjusted?.feet ?? entered;
    sitPlace.reach(body, seat, goal, feet, final.pitch);

    const r: number = seated.ratio(body, seat, under);
    const descent: number =
      seatedCourse.descent(r) *
      AutoMovieMotionManner(context, context.params.manner).tempo;
    const peak: number = seatedCourse.flexion(r);
    const contact: number = CONTACT * descent;
    const across: number = ACROSS * descent;
    const hold: number = context.params.hold ?? 1;
    HumanBound.least("hold", hold, 0, "s");
    const duration: number = descent + hold;
    const yaw0: number = context.entry.posture.yaw;
    const start: IAutoMovieVector3 = seated.socket(
      body,
      adjusted?.entry ?? context.entry.posture,
    );

    // Crossed at the ankles: once seated the left foot lifts and is set down ahead of the right ankle and across it, by shares of the feet's own spacing at rest (provisional).
    const crossed: boolean = context.params.legs === "crossed";
    if (crossed) HumanBound.least("hold", hold, CROSS, "s");
    const apart: number = Math.abs(
      body.rest.get("leftFoot")!.x - body.rest.get("rightFoot")!.x,
    );
    const crossing: IAutoMovieVector3 = {
      x:
        feet.right.x +
        CROSSED.ahead * apart * Math.sin((seat.yaw * Math.PI) / 180) -
        CROSSED.over * apart * Math.cos((seat.yaw * Math.PI) / 180),
      y: feet.left.y,
      z:
        feet.right.z +
        CROSSED.ahead * apart * Math.cos((seat.yaw * Math.PI) / 180) +
        CROSSED.over * apart * Math.sin((seat.yaw * Math.PI) / 180),
    };
    const legsAt: (
      root: IAutoMovieVector3,
      yaw: number,
      t: number,
    ) => IAutoMovieMotionHumanPosture["limbs"] = (
      root: IAutoMovieVector3,
      yaw: number,
      t: number,
    ): IAutoMovieMotionHumanPosture["limbs"] => {
      const share: number = crossed
        ? minimumJerk.share((t - descent) / CROSS)
        : 0;
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = stand.legs(
        body,
        root,
        yaw,
        {
          left: {
            x: feet.left.x + (crossing.x - feet.left.x) * share,
            y: feet.left.y + CROSSED.lift * apart * Math.sin(Math.PI * share),
            z: feet.left.z + (crossing.z - feet.left.z) * share,
          },
          right: feet.right,
        },
      );
      return share > 0 && share < 1
        ? { ...limbs, leftLeg: { ...limbs.leftLeg!, planted: false } }
        : limbs;
    };
    const lowered: ReturnType<typeof prepareSitLowering> = prepareSitLowering({
      body,
      yaw: yaw0,
      turn,
      descent,
      contact,
      across,
      down: DOWN * descent,
      flexed: FLEXED * descent,
      peak,
      start,
      goal,
      joints: relaxed,
      final,
      feet,
      legs: legsAt,
    });
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      {
        part: "leftFoot",
        kind: "plant",
        from: 0,
        to: crossed ? descent / duration : 1,
        support: HumanSupportFrame.contact(context, "leftFoot"),
      },
      ...(crossed
        ? [
            {
              part: "leftFoot" as const,
              kind: "plant" as const,
              from: (descent + CROSS) / duration,
              to: 1,
              support: HumanSupportFrame.contact(context, "leftFoot"),
            },
          ]
        : []),
      {
        part: "rightFoot",
        kind: "plant",
        from: 0,
        to: 1,
        support: HumanSupportFrame.contact(context, "rightFoot"),
      },
      {
        part: "seat",
        kind: "seat",
        from: contact / duration,
        to: 1,
        support: HumanSupportFrame(context),
      },
    ];

    // Each hand that has an armrest bears on it from contact, with the seat.
    for (const side of ["left", "right"] as const)
      if (seat.armrests?.[side] !== undefined)
        contacts.push({
          part: `${side}Hand`,
          kind: "plant",
          from: contact / duration,
          to: 1,
          support: HumanSupportFrame(context),
        });
    // The body lowered over its feet and onto the seat, its arms hanging and
    // its fingers straightening as each hand comes to rest.
    // After the hands have arrived and any ankle crossing has completed,
    // the planted lower body is the delivered seat key for the entire hold.
    const settled = (t: number): boolean =>
      t >= descent && (!crossed || (t - descent) / CROSS >= 1);
    const seatedKey: IAutoMovieMotionHumanPosture | undefined = settled(
      duration,
    )
      ? lowered(duration, 1)
      : undefined;
    const lowering: IAutoMovieMotionHumanActionPlan = {
      duration,
      events: [
        { name: "commit", share: contact / duration },
        { name: "seatContact", share: contact / duration },
        { name: "seated", share: descent / duration },
      ],
      contacts,
      contact,
      base: { kind: "seated", seat },
      posture: (
        seconds: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        // The legs at the sit's own course (`sitHandSpans`).
        return spans.legs(
          sitHands(
            body,
            seatedKey !== undefined && settled(t) && resolution !== undefined
              ? structuredClone(seatedKey)
              : lowered(t, travel(t), resolution),
            (side: AutoMovieHumanSide): number => spans.hand(side, t),
          ),
          t,
        );
      },
    };

    // Each hand is brought to its rest and the arm's path is the trajectory
    // planner's (`AutoMovieMotionHumanArm.carried` over a span): a hand with
    // an armrest is brought onto it as the seat takes the body, where the
    // lowered shoulder is nearest it; a hand with none hangs while the thighs come up under it and
    // is laid on its thigh from contact to seated.
    const together: IAutoMovieMotionHumanArmPlanned.ITogether =
      AutoMovieMotionHumanArmPlanned.together(
        context.handover,
        true,
        context.tempo,
      );
    const palms: ReturnType<typeof prepareSeatedPalms> | undefined =
      seat.armrests?.left === undefined || seat.armrests.right === undefined
        ? prepareSeatedPalms(body, context.entry.posture)
        : undefined;
    const arm: (side: AutoMovieHumanSide) => IAutoMovieMotionHumanPrimitive = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanPrimitive => {
      const rest: IAutoMovieVector3 | undefined = seat.armrests?.[side];
      return AutoMovieMotionHumanArm.carried({
        body,
        side,
        from: 0,
        to: duration,
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
        weight: (seconds: number): number => spans.hand(side, seconds),
        goal: (
          posture: IAutoMovieMotionHumanPosture,
          _seconds: number,
          resolution?: Parameters<
            IAutoMovieMotionHumanActionPlan["posture"]
          >[2],
          projection?: Parameters<
            IAutoMovieMotionHumanActionPlan["posture"]
          >[3],
        ): IAutoMovieHumanLimbGoal =>
          rest === undefined
            ? seated.hands(body, posture, side, resolution, projection, palms)[
                `${side}Arm`
              ]!
            : seated.armrest(body, posture, side, rest, seat.yaw),
        span: spans.span(side),
        together,
      });
    };

    const { clock, window, travel }: ReturnType<typeof prepareSitBalance> =
      prepareSitBalance({
        context,
        start,
        goal,
        yaw0,
        across,
        contact,
        descent,
        duration,
        prefix: adjusted?.prefix.duration ?? 0,
        lowered,
      });

    // The legs planned once over the sit, and when each hand leaves its hang
    // and rests on the thighs they place (`sitHandSpans`).
    const spans: sitHandSpans.ISpans = sitHandSpans({
      body,
      lowered: (seconds: number): IAutoMovieMotionHumanPosture =>
        lowered(seconds, travel(seconds)),
      entry: context.entry.pose,
      armrest: (side: AutoMovieHumanSide): boolean =>
        seat.armrests?.[side] !== undefined,
      contact,
      descent,
      duration,
      reaching: REACHING,
    });
    const composed: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: lowering,
        clock,
        primitives: [arm("left"), arm("right")],
        contact: "seatContact",
      });
    const planned: IAutoMovieMotionHumanActionPlan = {
      ...composed,
      base: lowering.base,
      ...HumanPhysics.declared(context.params, window),
    };
    // A seat on a prop that may move carries the sit with it (`sitCarried`).
    return sitCarried(
      context,
      seat,
      adjusted === undefined
        ? planned
        : prepareSitWorkingFeet.prepend(adjusted.prefix, planned),
    );
  }
}
