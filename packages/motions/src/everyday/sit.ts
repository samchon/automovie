import {
  Vector3,
  bracketedRoot,
  minimumJerk,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
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
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanPhysics } from "../law/HumanPhysics";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanMountOn } from "../lexicon/HumanMountOn";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { HumanBalance } from "./HumanBalance";
import { prepareSitLowering } from "./prepareSitLowering";
import { prepareSitWorkingFeet } from "./prepareSitWorkingFeet";
import { seated } from "./seated";
import { seatedCourse } from "./seatedCourse";
import { sitHands } from "./sitHands";
import { sitPlace } from "./sitPlace";

/**
 * Sitting down on a chair, bench or stool from standing in front of it:
 * the body's seat socket is lowered onto the seat while the trunk leans
 * forward and the feet stay where they stand.
 *
 * Stand-to-sit is the rise reversed under eccentric control (Kralj, Jaeger
 * and Munih 1990, J Biomech 23:1123): the hips travel back and down, the
 * trunk flexes forward to keep the weight over the feet until the seat takes
 * it, then the trunk settles into the seated posture. The goal is the seat
 * socket on its point on the seat ({@link seated}); the root follows from
 * that goal and the trunk's pitch, the planted legs and the hands are solved
 * by inverse kinematics. The socket moves back over the first 70 % of the
 * descent, no further than keeps the centre of mass where it stands over
 * the feet until a pendulum's time constant before contact (Hof, Gazendam
 * and Sinke 2005), over which the body comes down onto the seat, and down
 * from 10 % to its end, so it reaches the seat from above;
 * the trunk pitches forward to its peak by 45 % of the descent and settles
 * after contact; each hand is brought to its rest along the arm trajectory
 * planner's path, onto its armrest as the seat takes the body, the two
 * supports loaded together where the armrest lies nearest the shoulder, or,
 * with none, onto its thigh from contact to seated, once the thighs no longer
 * rise under it, the fingers straightening to lie flat.
 *
 * Peak trunk flexion `35 + 50 (1 - r)` degrees and descent time
 * `2 (1 + 0.6 (1 - r))` seconds for a seat at `r` of the popliteal height
 * (provisional coefficients; a lower seat needs more trunk flexion and more
 * time, Janssen, Bussmann and Stam 2002, and sit-to-stand takes about 1.5 to
 * 2.5 s in healthy adults). Contact comes at 75 % of the descent. The seated
 * back is `upright` (pitch 0), `lean` (12 degrees back onto a backrest, which
 * the seat must have) or `slump` (pelvis 10 degrees back, chest 12 and spine
 * 8 flexed), all provisional.
 *
 * The performer must stand facing within 20 degrees of the seat's heading
 * with feet the legs can reach from the seat; otherwise the sit is refused
 * with the range of foot distances that work. Events `commit` (the last
 * instant the sitting can be abandoned for standing), `seatContact` and
 * `seated`; the seat window starts at contact.
 *
 * A seat above 1.2 of the popliteal height, or one sat astride, is got onto
 * instead ({@link HumanMountOn}): the feet leave the floor for the seat's
 * rests or hang, under the same parameters, events and cancel table.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal, the method, the timing, the events and the refusals, with sources and provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters and the plan the performance dispatches through, plus the helpers its tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, hand and frame types; no body is special-cased.
 */
export namespace sit {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "sit";

  /**
   * Cancel table. Sitting is abandoned for standing only until `commit`,
   * while both feet still stand on the floor: the seat's contact on a seat
   * inside the band, and the first foot leaving the floor on a high seat.
   * Past it the body is got down by `rise`.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      { window: [0, "commit"], kind: "inertialize", entry: 0, blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate },
    ],
    rise: [
      { window: ["seatContact", 1], kind: "inertialize", entry: 0, blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate },
    ],
    shift: [{ window: ["seated", 1], kind: "inertialize", entry: 0 }],
  };

  /** Largest heading difference from the seat's at which a sit starts, degrees (provisional: a small turn the descent absorbs). */
  const FACING: number = 20;

  /** Shares of the descent: the seat takes the body at `CONTACT`, the socket travels back over `ACROSS`, comes down from `DOWN` and the trunk peaks by `FLEXED` (provisional, as the namespace states). */
  const CONTACT: number = 0.75;

  /** See `CONTACT`. */
  const ACROSS: number = 0.7;

  /** See `CONTACT`. */
  const DOWN: number = 0.1;

  /** See `CONTACT`. */
  const FLEXED: number = 0.45;

  /** The share of the descent at which a hand leaves for its armrest (provisional). */
  const REACHING: number = 0.2;

  /** Where the crossed left foot sets down, by shares of the feet's rest spacing: `ahead` of the right ankle, `over` across it, and the `lift` of its swing (provisional). */
  const CROSSED: Readonly<Record<"ahead" | "over" | "lift", number>> = {
    ahead: 0.6,
    over: 0.4,
    lift: 0.3,
  };

  /** Seconds the left foot takes to cross over the right ankle once seated (provisional). */
  export const CROSS: number = 0.6;

  /** Shares of the descent before the fall onto the seat at which the balanced travel back is solved. */
  export const SHARES: number = 8;

  /**
   * Plan a sit.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the seat is too low for the body, the performer does not face away from it, the feet are out of reach of a seat inside the band, the body stands more than a leg's length from a high seat, or `lean` has no backrest.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States context/plan ownership and seat, facing, leg-reach and backrest refusals; the namespace gives world-metre socket goals, timing and contact conventions.
   * @evidence contracts/development/implementation.md#principled-implementation The seat socket follows its original descent/balanced travel while planted-leg and achieved hand goals retain canonical fitting; high seats delegate to the existing mount law.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed descent geometry and the original balance table feed one body base and two carried hand rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Original seat/facing/reach refusals, all balance samples/bracket trials, contact times and authored interpolation remain; no fit or tolerance is relaxed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Planning retains the original SHARES balance brackets and actual complete mass-centre fits, with no unused support geometry. Each query retains actual root lowering and hand trajectory/fits; fixed intervals, joint entries and frame coefficients prepare once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed descent/socket/joint metadata share across queries; balance construction lends one synchronous FK/ROM source and returns only scalar travel. Current base lowering and carried thigh goals borrow composition loans without sharing a posed answer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns finite clock/geometry/travel and arm plans until release. Construction/current-query FK/ROM sources end on synchronous return or throw and never enter those records.
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
    const back: NonNullable<IAutoMovieMotionHumanSit.IParams["back"]> = context.params.back ?? "upright";
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
        feasible: { kind: "range", minimum: -FACING, maximum: FACING, unit: "degrees" },
        reason: `stands ${turn.toFixed(1)} degrees off the seat's heading; turn to within ${FACING} degrees of facing away from the seat first`,
        fix: `turn to within ${FACING} degrees of facing away from the seat first, or turn the seat`,
      });
    if (seated.high(body, seat, under) || seat.astride === true)
      return HumanMountOn.plan(context, seat, sitPlace.BACKS[back], turn);
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
      ...standUpright.of(body).joints,
    };
    const adjusted: ReturnType<typeof prepareSitWorkingFeet> =
      prepareSitWorkingFeet(context, entered, goal, final.pitch, relaxed);
    const feet: Record<AutoMovieHumanSide, IAutoMovieVector3> = adjusted?.feet ?? entered;
    sitPlace.reach(body, seat, goal, feet, final.pitch);

    const r: number = seated.ratio(body, seat, under);
    const descent: number =
      seatedCourse.descent(r) *
      AutoMovieMotionManner.of(context, context.params.manner).tempo;
    const peak: number = seatedCourse.flexion(r);
    const contact: number = CONTACT * descent;
    const across: number = ACROSS * descent;
    const hold: number = context.params.seconds ?? 1;
    HumanBound.least("seconds", hold, 0, "s");
    const duration: number = descent + hold;
    const yaw0: number = context.entry.posture.yaw;
    const start: IAutoMovieVector3 = seated.socket(body, adjusted?.entry ?? context.entry.posture);

    // Crossed at the ankles: once seated the left foot lifts and is set down ahead of the right ankle and across it, by shares of the feet's own spacing at rest (provisional).
    const crossed: boolean = context.params.legs === "crossed";
    if (crossed) HumanBound.least("seconds", hold, CROSS, "s");
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
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = stand.legs(body, root, yaw, {
        left: {
          x: feet.left.x + (crossing.x - feet.left.x) * share,
          y: feet.left.y + CROSSED.lift * apart * Math.sin(Math.PI * share),
          z: feet.left.z + (crossing.z - feet.left.z) * share,
        },
        right: feet.right,
      });
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
        support: HumanSupportFrame.of(context),
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
          support: HumanSupportFrame.of(context),
        });
    // The body lowered over its feet and onto the seat, its arms hanging and
    // its fingers straightening as each hand comes to rest.
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
        return sitHands(
          lowered(t, travel(t), resolution),
          (side: "left" | "right"): number => hand(side, t),
        );
      },
    };

    // Each hand is brought to its rest and the arm's path is the trajectory
    // planner's (`AutoMovieMotionHumanArm.carried` over a span): a hand with
    // an armrest is brought onto it as the seat takes the body, where the
    // lowered shoulder is nearest it; a hand with none hangs while the thighs come up under it and
    // is laid on its thigh from contact to seated.
    const together: IAutoMovieMotionHumanArmPlanned.ITogether =
      AutoMovieMotionHumanArmPlanned.together(context.handover);
    const arm: (side: "left" | "right") => IAutoMovieMotionHumanPrimitive = (
      side: "left" | "right",
    ): IAutoMovieMotionHumanPrimitive => {
      const rest: IAutoMovieVector3 | undefined = seat.armrests?.[side];
      return AutoMovieMotionHumanArm.carried({
        body,
        side,
        from: 0,
        to: duration,
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
        weight: (seconds: number): number => hand(side, seconds),
        goal: (
          posture: IAutoMovieMotionHumanPosture,
          _seconds: number,
          resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
          projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
        ): IAutoMovieHumanLimbGoal =>
          rest === undefined
            ? seated.hands(body, posture, side, resolution, projection)[
                `${side}Arm`
              ]!
            : seated.armrest(body, posture, side, rest, seat.yaw),
        span: span(side),
        together,
      });
    };

    /** When a hand leaves its hanging rest and when it rests: on its armrest from `REACHING` of the descent to contact, on its thigh from contact to seated; it stays there. */
    function span(
      side: "left" | "right",
    ): IAutoMovieMotionHumanArmPlanned.ISpan {
      return seat.armrests?.[side] === undefined
        ? { start: contact, ready: descent, relax: duration, end: duration }
        : {
            start: REACHING * descent,
            ready: contact,
            relax: duration,
            end: duration,
          };
    }

    /** How far a hand is from hanging to resting, at a second. */
    function hand(side: "left" | "right", t: number): number {
      const s: IAutoMovieMotionHumanArmPlanned.ISpan = span(side);
      return minimumJerk.share((t - s.start) / (s.ready - s.start));
    }

    // The weight stays over the feet until the seat takes it (Kralj, Jaeger
    // and Munih 1990): until a pendulum's time constant before contact
    // (Hof, Gazendam and Sinke 2005, the time the body needs to fall onto
    // the seat), the seat socket goes back only as far as keeps the centre
    // of mass where it stands over the feet, read in the world along the
    // heading so a change of the base under it does not move the mark,
    // solved by bisection at shares of that time and read linearly between
    // them; over the last of it the socket comes back onto the seat, which
    // it reaches at contact.
    const fall: number = Math.min(
      contact,
      1 /
        resolveAutoMovieCenterOfMass.frequency(
          resolveAutoMovieCenterOfMass.pendulum(body.measure.hipHeight),
        ),
    );
    const held: number = contact - fall;
    // The weight-over-the-feet course is the balance option's
    // (`IAutoMovieMotionHumanBalance`); without it the seat socket goes
    // back on its own minimum-jerk progress and no centre of mass is read.
    const balancing: boolean = HumanPhysics.balanced(context.params);
    const reaches: number[] = !balancing ? [] : ((): number[] => {
      const heading: IAutoMovieVector3 = {
        x: Math.sin((yaw0 * Math.PI) / 180),
        y: 0,
        z: Math.cos((yaw0 * Math.PI) / 180),
      };
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      const project: ReturnType<typeof prepareHumanPostureProjection> =
        prepareHumanPostureProjection(body);
      const centre: ReturnType<typeof HumanBalance.prepareCentre> =
        HumanBalance.prepareCentre(body);
      const ahead: (t: number, back: number) => number = (
        t: number,
        back: number,
      ): number =>
        Vector3.dot(centre(lowered(t, back, read), read, project), heading);
      const stood: number = ahead(0, 0);

      // Keep every bracket trial and the original physical travel tolerance;
      // only this synchronous table construction borrows the shared readers.
      const way: number = Math.hypot(goal.x - start.x, goal.z - start.z);
      const balanced: (t: number) => number = (t: number): number => {
        const free: number = minimumJerk.share(t / across);
        const behind: (back: number) => number = (back: number): number =>
          ahead(t, back) - stood;
        const far: number = behind(free);
        if (far >= 0) return free;
        const near: number = behind(0);
        if (near <= 0 || way <= 0) return 0;
        return bracketedRoot(
          (trial: number): number =>
            trial === 0 ? near : trial === free ? far : behind(trial),
          0,
          free,
          HumanBalance.TOLERANCE / way,
        );
      };
      return Array.from(
        { length: SHARES + 1 },
        (_: unknown, k: number): number =>
          k === 0 ? 0 : balanced((held * k) / SHARES),
      );
    })();
    function travel(t: number): number {
      const free: number = minimumJerk.share(t / across);
      if (!balancing || t >= contact || held <= 0) return free;
      const kept: (at: number) => number = (at: number): number => {
        const x: number = (Math.max(0, Math.min(held, at)) / held) * SHARES;
        const k: number = Math.min(SHARES - 1, Math.floor(x));
        return reaches[k]! + (reaches[k + 1]! - reaches[k]!) * (x - k);
      };
      if (t <= held) return Math.min(free, kept(t));
      const from: number = Math.min(
        minimumJerk.share(held / across),
        kept(held),
      );
      return from + (free - from) * minimumJerk.share((t - held) / fall);
    }
    const composed: IAutoMovieMotionHumanActionPlan = composeAutoMovieMotionHumanAction({
      base: lowering,
      clock: AutoMovieMotionClock.of(duration, [
        { name: "commit", seconds: contact },
        { name: "seatContact", seconds: contact },
        { name: "seated", seconds: descent },
      ]),
      primitives: [arm("left"), arm("right")],
      contact: "seatContact",
    });
    const planned: IAutoMovieMotionHumanActionPlan = { ...composed, base: lowering.base };
    return adjusted === undefined ? planned : prepareSitWorkingFeet.prepend(adjusted.prefix, planned);
  }
}
