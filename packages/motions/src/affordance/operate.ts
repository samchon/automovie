import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPhrase,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLeanInto,
  IAutoMovieMotionHumanOperate,
  IAutoMovieMotionHumanOperateDrive,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionManner,
  IAutoMovieMotionTarget,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPhrase } from "../compose/AutoMovieMotionHumanArmPhrase";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLeanInto } from "../compose/AutoMovieMotionHumanLeanInto";
import { AutoMovieMotionHumanReach } from "../compose/AutoMovieMotionHumanReach";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanPhysics } from "../law/HumanPhysics";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { operateCorrection } from "./operateCorrection";
import { operateDrive } from "./operateDrive";
import { operateHand } from "./operateHand";
import { operateInsert } from "./operateInsert";
import { operateInsertRoute } from "./operateInsertRoute";
import { operateState } from "./operateState";

/** The record of `IPlanStroke`'s site. */
type IPlanStroke = {
  contact: NonNullable<IAutoMovieMotionHumanArmPhrase.IStrokeProps["contact"]>;
};

/** The record of `IPACEItem`'s site. */
type IPACEItem = {
  press: number;
  turn: number;
  slide: number;
  swing: number;
};

/**
 * Operating an articulated thing with one hand while standing: pressing a
 * button along its axis, turning a knob about its axis, pulling or pushing a
 * drawer along its slide, or swinging a hinged door by its handle.
 *
 * The goal is the hand on the thing's moving part, and the part's motion is the
 * mechanism's own: a button's face goes in along its axis, a knob turns about
 * its axis, a slider's handle travels along its axis, a leaf's handle turns
 * about its hinge line: a door's vertical line through the point it names, or
 * the prop's own hinge axis (a cock's cross pin, `operateDrive.hinge`). The
 * hand is shaped to the part (the index fingertip on a button, a closed grip on
 * a knob, a drawer handle or a door handle) and laid on it by
 * `AutoMovieMotionHumanTarget.hand`. A part on an upright face is grasped with
 * the hand along the face's normal: a handle overhand, the palm on its top; a
 * knob with that grasp rolled about the axis, and the hand rolls with the knob
 * as it turns, the forearm's pronation and supination (Magermans et al. 2005,
 * Clin Biomech 20:591, give the ranges daily tasks use), the grip starting half
 * the turn before the forearm's neutral so the turn is centred in that range; a
 * crank's knob spins free on its pin, so the hand keeps its attitude and only
 * orbits. A lid's knob, its axis nearer the vertical than `UPRIGHT`, takes the
 * palm from above. Each part's place is a target, so it can be a prop's point;
 * the part's outward normal is its axis. A part beyond the standing arm is
 * leaned into (`AutoMovieMotionHumanLeanInto`): the trunk tips about the hips
 * by the least pitch that keeps the wrist within `REACH` of the arm's length
 * and straightens as the part comes nearer (a drawer pulled out); a part still
 * out of reach at the lean's limit is refused, since it is walked up to first.
 *
 * The action is one arm phrase (`AutoMovieMotionHumanArm.stroke`): the hand
 * reaches the part by `ready` in the aimed movement time to its width (McIntosh
 * et al. 2018), waits a brief moment for the grip, moves the part from
 * `strokeStart` to `strokeEnd` at the mechanism's pace (`PACE`, provisional),
 * holds it until `relax`, and returns to where it hung. Events: the phrase's
 * `ready` (contact or grip closed), `strokeStart`, `stroke`, `strokeEnd`
 * (bottom out, travel end, swing end) and `relax` (release).
 *
 * On a prop that articulates (`IHumanProp.articulate`), the operated contact
 * names the articulation it is or rides, the amount is that articulation's
 * travel in its own unit and sign, the hand follows the contact of the prop
 * posed at the travel the stroke has reached, and the plan drives the
 * articulation by the same function (`operateDrive`,
 * `IHumanActionPlan.drives`), so the door stays open after the hand lets go and
 * the hand cannot drift off the handle. The `insert` mechanism moves a held
 * prop's working point along a socket's axis instead (`operateInsert`), hand
 * over hand when deeper than its grip reaches (`operateLongInsert`).
 *
 * Not yet: the A8 affordance kinds (`hinge`, `slider`, `knob`, `button`) in the
 * interface, which the core owns, so the mechanism is stated here; the body
 * stepping round a door and through it; power grips; pouring about a lip.
 */
export namespace operate {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "operate";

  /**
   * The hand drives the part from strokeStart to strokeEnd. The caller selects
   * the body part that supplies the balancing motion.
   */
  export const balance: IAutoMovieMotionHumanBalance = {
    from: { event: "strokeStart" },
    to: { event: "strokeEnd" },
  };

  /** Cancel table: the hand lets go of the part and the body stands or walks. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: ["relax", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    walk: [
      {
        window: ["relax", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

  /**
   * May be performed over a carrier, such as seated or while another action
   * carries the body: it claims only the parts it moves.
   */
  export const overlay: boolean = true;

  /**
   * The pace of each mechanism's movement (provisional): a button's press in
   * 0.25 s, a knob at 180 degrees a second, a slider at 0.4 m/s, a door's
   * handle at 0.6 m/s along its arc.
   */
  export const PACE: Readonly<IPACEItem> = {
    press: 0.25,
    turn: 180,
    slide: 0.4,
    swing: 0.6,
  };

  /**
   * The share of the arm's length the wrist is kept within, so the elbow never
   * locks straight on a part (provisional).
   */
  export const REACH: number = 0.97;

  /**
   * The vertical share of a knob's axis from which it counts as a lid's, turned
   * with the fingers ahead instead of up.
   */
  export const UPRIGHT: number = Math.SQRT1_2;

  /**
   * The most a stoop to a part below the hips adds to the trunk's pitch,
   * degrees: about the straight-legged hip flexion the hamstrings allow, as a
   * normal straight-leg raise reaches roughly 80 degrees (provisional).
   */
  export const STOOP: number = 80;

  /** The width of each part a hand aims at, metres (provisional). */
  export const WIDTH: Readonly<
    Record<IAutoMovieMotionHumanOperate.Mechanism["kind"], number>
  > = {
    button: 0.02,
    knob: 0.05,
    slider: 0.03,
    hinge: 0.03,
    insert: 0.03,
  };

  /** The moving part's place at a progress of its movement (operateState.at). */
  export const state: typeof operateState.at = operateState.at;
  /**
   * Plan an operation.
   *
   * @param entered The action's context.
   * @returns The plan.
   */
  export function plan(
    entered: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanOperate.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const routed: operateInsertRoute.IRouted = operateInsertRoute(entered, {
      reach: REACH,
      pace: PACE.slide,
      width: WIDTH.insert,
    });
    if (routed.plan !== undefined) return routed.plan;
    const context: typeof entered = routed.context;
    const body: IAutoMovieMotionHumanBody = context.body;
    const mechanism: IAutoMovieMotionHumanOperate.Mechanism =
      context.params.kind;
    const side: AutoMovieHumanSide = context.params.hand ?? "right";
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      context.params.manner,
    );
    const at: IAutoMovieMotionTarget =
      mechanism.kind === "insert" ? mechanism.into : mechanism.at;
    const place: ReturnType<typeof context.aim> = context.aim(
      at,
      context.start,
    );

    // On a prop that articulates, the hand follows the part the prop poses
    // and the operation drives that articulation; a held prop inserted into
    // a socket is moved by the hand that holds it.
    const part: IAutoMovieMotionHumanOperateDrive.IPart | undefined =
      mechanism.kind === "insert"
        ? undefined
        : operateDrive.part(
            context,
            at,
            operateDrive.amount(mechanism),
            mechanism.kind,
          );

    const hinge: IAutoMovieMotionHumanOperateDrive.IHinge | undefined =
      mechanism.kind === "hinge"
        ? operateDrive.hinge(context, mechanism, part)
        : undefined;

    // The movement's length by the mechanism's pace.
    const operating: number = ((): number => {
      switch (mechanism.kind) {
        case "button":
          return PACE.press;
        case "knob":
          return Math.abs(mechanism.turn) / PACE.turn;
        case "slider":
          return Math.abs(mechanism.travel) / PACE.slide;
        case "hinge":
          return (
            (((Math.abs(mechanism.swing) * Math.PI) / 180) *
              operateDrive.radius(hinge!, place.point)) /
            PACE.swing
          );
        case "insert":
          return operateInsert.travel(mechanism) / PACE.slide;
      }
    })();

    const inserted: IAutoMovieMotionHumanStrikingHeld.ITool | undefined =
      mechanism.kind === "insert"
        ? operateInsert.tool(context, mechanism, side)
        : undefined;
    const origin: IAutoMovieMotionHumanArmTarget.IOrigin =
      AutoMovieMotionHumanArm.origin(
        body,
        poseBones(
          body,
          context.entry.pose,
          undefined,
          HumanHand.frameBones(
            body,
            side,
            mechanism.kind === "button" ? "indexTip" : "grip",
          ),
        ),
        { origin: context.entry.posture.root, yaw: context.entry.posture.yaw },
        side,
        mechanism.kind === "button" ? "indexTip" : "grip",
      );
    const distance: number = Vector3.length(
      Vector3.subtract(
        place.point,
        AutoMovieMotionHumanArm.point(context.entry.posture, origin),
      ),
    );
    const reach: number = AutoMovieMotionHumanTiming.aimed(
      distance,
      WIDTH[mechanism.kind],
    );
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: reach,
        wait: AutoMovieMotionHumanTiming.PAUSES.brief,
        attack: operating,
        hold: AutoMovieMotionHumanTiming.PAUSES.brief,
        retract: reach,
      }),
      modifiers,
    );
    const duration: number = clock.duration;
    const base: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, duration);
    const hand: ReturnType<typeof operateHand> = operateHand(context, {
      clock,
      place,
      part,
      hinge,
      inserted,
      upright: UPRIGHT,
    });
    const target: ReturnType<typeof operateHand>["target"] = hand.target;

    // The lean into a part beyond the standing arm.
    const standing: IAutoMovieMotionHumanPosture = base.posture(0);
    const lean: IAutoMovieMotionHumanLeanInto.ILean =
      AutoMovieMotionHumanLeanInto.solve({
        body,
        standing,
        side,
        share: REACH,
        // A part below the hips is stooped to, further than a standing reach.
        limit:
          place.point.y < body.measure.hipHeight
            ? operate.STOOP
            : AutoMovieMotionHumanReach.LEAN_LIMIT,
        wrist: hand.wrist,
        // The arm on the part at the stroke's start, as the stroke grips it.
        arm: (posture: IAutoMovieMotionHumanPosture): IAutoMovieHumanLimbGoal =>
          AutoMovieMotionHumanArm.goal(body, side, target(posture, 0)),
        refuse: (beyond: number, limit: number): string =>
          `${context.subject}: the ${mechanism.kind} stays ${(1000 * beyond).toFixed(0)} mm beyond the ${side} arm at a lean of ${limit} degrees; a part this far is walked up to first`,
      });
    // Refuse at plan time a part whose movement leaves the reach. Over a
    // carrier the trunk is the carrier's (`overlay`: it claims only the
    // parts it moves), so the part is worked by the arm alone, and one that
    // would need a lean is refused there instead of leaned to.
    const grounded: boolean = context.carrier === undefined;
    for (let k: number = 0; !grounded && k <= 8; k++) {
      const needed: number = lean.pitch(standing, k / 8);
      if (needed > 1e-6)
        throw new HumanRefusal({
          kind: "reach",
          axis: "at",
          value: needed,
          feasible: { kind: "range", minimum: 0, maximum: 0, unit: "deg" },
          reason: `${context.subject}: the ${mechanism.kind} needs a lean of ${needed.toFixed(1)} degrees to reach, and the action it is performed over keeps the trunk for itself`,
          fix: "operate it as an action of its own, or bring the body nearer first",
        });
    }
    const window: HumanPhysics.Window = HumanPhysics.prepare(
      context.params,
      operate,
      context.start,
      { duration, events: clock.events() },
      context.instant,
    );
    const reachLean: IAutoMovieMotionHumanPrimitive | undefined = grounded
      ? lean.primitive(clock)
      : undefined;
    const corrections: IAutoMovieMotionHumanPrimitive[] =
      window === null
        ? []
        : [operateCorrection(body, window, base, clock, duration, reachLean)];
    const stroke: IAutoMovieMotionHumanArmPhrase.IStrokeProps & IPlanStroke = {
      body,
      clock,
      side,
      origin,
      contact: {
        kind: "grip",
        support:
          mechanism.kind === "insert"
            ? { kind: "prop", subject: mechanism.prop }
            : at.kind === "prop"
              ? { kind: "prop", subject: at.subject, carries: false }
              : { kind: "ground" },
      },
      // The part read at the write's own second: a moving part is
      // intercepted where it is, from the ready pose on.
      path: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
        progress: number,
      ): IAutoMovieMotionHumanArmTarget.ITarget =>
        target(posture, progress, seconds),
    };
    const compose = (
      arm: IAutoMovieMotionHumanPrimitive,
    ): IAutoMovieMotionHumanActionPlan =>
      composeAutoMovieMotionHumanAction({
        base,
        clock,
        contact: "strokeEnd",
        primitives: [
          ...(window === null && reachLean !== undefined
            ? [reachLean]
            : corrections),
          arm,
        ],
      });
    const plan: IAutoMovieMotionHumanActionPlan = {
      ...compose(AutoMovieMotionHumanArm.stroke(stroke)),
      ...HumanPhysics.declared(context.params, window),
      ...(part === undefined
        ? {}
        : { drives: [operateDrive.drive(part, clock)] }),
    };
    if (grounded && (part === undefined || mechanism.kind === "hinge")) {
      // A bearing stroke discards its onset elbow. A hinged part still
      // observes zero progress at the current film second, and an insertion
      // still validates its starting roll against the current trunk.
      const prepared: IAutoMovieMotionHumanActionPlan = compose(
        AutoMovieMotionHumanArmPhrase.preparedStroke(
          stroke,
          part !== undefined || mechanism.kind === "insert"
            ? (posture, seconds): void => {
                hand.wrist(posture, 0, seconds);
              }
            : undefined,
        ),
      );
      const sample: IAutoMovieMotionHumanPlayback.IPhase["sample"] = (
        ...args
      ) => ({ posture: prepared.posture(...args) });
      HumanPreparedPlayback.attach(plan, body, {
        mode: "posture",
        phases: [
          { from: clock.at("strokeStart"), to: clock.at("strokeEnd"), sample },
          { from: clock.at("strokeEnd"), to: clock.at("relax"), sample },
          { from: clock.at("relax"), to: duration, sample },
        ],
      });
    }
    return plan;
  }
}
