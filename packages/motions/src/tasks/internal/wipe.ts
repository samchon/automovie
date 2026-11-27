import { AutoMovieEngineVector3 } from "@automovie/engine";
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
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLeanInto,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanWipe,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPhrase } from "../../compose/internal/AutoMovieMotionHumanArmPhrase";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLeanInto } from "../../compose/internal/AutoMovieMotionHumanLeanInto";
import { AutoMovieMotionHumanTarget } from "../../compose/internal/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { prepareGroundedBalance } from "../../everyday/internal/prepareGroundedBalance";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanPhysics } from "../../law/internal/HumanPhysics";
import { HumanPreparedPlayback } from "../../perform/internal/HumanPreparedPlayback";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { HumanHandTarget } from "../../posture/internal/HumanHandTarget";
import { poseBones } from "../../posture/internal/poseBones";
import { useTool } from "./useTool";

/*
 * Wiping a table, counter or other level surface with the flat palm in circles,
 * standing before it: a household task that the composed laws lacked, the
 * palm's circling stroke on a work surface.
 *
 * The goal is the palm flat on the surface, circling its centre with a radius
 * of a quarter of the forearm (provisional) `cycles` times. The hand comes to
 * the surface in the aimed movement time (McIntosh et al. 2018), circles at a
 * tool stroke's hand speed (`useTool.STROKE_SPEED`) with the palm on the
 * surface throughout, and returns. A patch whose far side lies beyond the
 * standing arm is leaned into (`AutoMovieMotionHumanLeanInto`): the trunk tips
 * about the hips by the least pitch that keeps the wrist within the reach of an
 * elbow kept at `ELBOW` degrees (`reach`); one still out of reach at the lean's
 * limit is refused, since it is walked up to first. The preferred working
 * height lies 200 to 250 mm below the elbow (Li, Chang and Zhang 2024, Sensors
 * 24:7056); the law accepts any reachable height and the author places the
 * surface. Events: the phrase's `ready` (palm down), `strokeStart`,
 * `strokeEnd`, `relax` (palm lifted).
 *
 * Not yet: leaning on the counter with the free hand (Iwakiri et al. 2007), a
 * held cloth as a prop, and the task sequences (dishwashing, laundry, bed
 * making) that chain this with the grasp, affordance and bend laws.
 */
export namespace wipe {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "wipe";

  /*
   * Cancel table: the hand lifts off and the body stands, walks or operates.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: { start: "relax", end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    walk: [
      {
        window: { start: "relax", end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    operate: [
      {
        window: { start: "relax", end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

  /*
   * May be performed over a carrier, such as seated or while another action
   * carries the body: it claims only the parts it moves.
   */
  export const overlay: boolean = true;

  /*
   * The least flexion the elbow keeps on the surface, degrees: the lower end of
   * the functional elbow arc of Morrey, Askew and Chao 1981 (J Bone Joint Surg
   * Am 63:872, 30 to 130 degrees), so the elbow never locks straight.
   */
  export const ELBOW: number = 30;

  /*
   * The circle about the centre in the heading's floor frame: starting at its
   * point nearest the performer, `cycles` turns over the progress.
   * Parameter radius: The circle's radius, metres.
   * Parameter cycles: The turns.
   * Parameter progress: The stroke's progress, 0 to 1.
   * Returns: The point, heading-frame metres about the centre.
   */
  export function local(
    radius: number,
    cycles: number,
    progress: number,
  ): IAutoMovieVector3 {
    const a: number = 2 * Math.PI * cycles * progress;
    return { x: radius * Math.sin(a), y: 0, z: -radius * Math.cos(a) };
  }
  /*
   * The share of the arm's length the wrist reaches with the elbow kept at
   * `ELBOW`: the law of cosines over the body's own upper arm and forearm,
   * `sqrt(u^2 + f^2 + 2 u f cos ELBOW) / (u + f)`.
   * Parameter body: The body.
   * Returns: The share, in (0, 1].
   */
  export function reach(body: {
    measure: Pick<IAutoMovieMotionHumanBody["measure"], "upperArm" | "forearm">;
  }): number {
    const u: number = body.measure.upperArm;
    const f: number = body.measure.forearm;
    const bent: number = (ELBOW * Math.PI) / 180;
    return Math.sqrt(u * u + f * f + 2 * u * f * Math.cos(bent)) / (u + f);
  }

  /*
   * The palm's place on the circle at a progress of the stroke.
   * Parameter centre: The patch's middle, world.
   * Parameter radius: The circle's radius, metres.
   * Parameter yaw: The heading, degrees.
   * Parameter cycles: The circle count.
   * Parameter progress: The stroke's progress in [0, 1].
   * Returns: World metres.
   */
  export function circle(
    centre: IAutoMovieVector3,
    radius: number,
    yaw: number,
    cycles: number,
    progress: number,
  ): IAutoMovieVector3 {
    return HumanFrame.point(
      { origin: centre, yaw },
      local(radius, cycles, progress),
    );
  }

  /*
   * Plan a wipe.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When the cycle count is not a positive integer, or
   * the patch lies beyond reach.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWipe.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const side: AutoMovieHumanSide = context.params.hand ?? "right";
    // Three circles when the author names none, the contract's default
    // (`IAutoMovieMotionHumanWipe.IParams.cycles`).
    const cycles: number = HumanBound.whole("count", context.params.count ?? 3);
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      context.params.manner,
    );
    const centre: IAutoMovieVector3 = context.aim(
      context.params.on,
      context.start,
    ).point;
    const radius: number = m.forearm / 4;
    const yaw: number = context.entry.posture.yaw;
    const frame: HumanFrame.IPrepared = HumanFrame.prepare({
      origin: centre,
      yaw,
    });
    const point: (progress: number) => IAutoMovieVector3 = (
      progress: number,
    ): IAutoMovieVector3 => frame.point(local(radius, cycles, progress));
    const forward: IAutoMovieVector3 = frame.direction({ x: 0, y: 0, z: 1 });
    const targetAt: ReturnType<typeof AutoMovieMotionHumanTarget.prepareHand> =
      AutoMovieMotionHumanTarget.prepareHand(
        body,
        side,
        { x: 0, y: 1, z: 0 },
        { surface: "palm", shape: "flat", forward },
      );
    const wristAt: ReturnType<typeof HumanHandTarget.prepareFrame> =
      HumanHandTarget.prepareFrame(
        body,
        side,
        { x: 0, y: 1, z: 0 },
        { surface: "palm", shape: "flat", forward },
      );
    const palm: (
      posture: IAutoMovieMotionHumanPosture,
      progress: number,
    ) => IAutoMovieMotionHumanArmTarget.ITarget = (
      posture: IAutoMovieMotionHumanPosture,
      progress: number,
    ): IAutoMovieMotionHumanArmTarget.ITarget =>
      targetAt(posture, point(progress));
    // The lean into a patch whose far side lies beyond the standing arm.
    const standing: IAutoMovieMotionHumanPosture = stand
      .plan({ ...context, params: { hold: 1 } })
      .posture(0);
    const lean: IAutoMovieMotionHumanLeanInto.ILean =
      AutoMovieMotionHumanLeanInto.solve({
        body,
        standing,
        side,
        share: reach(body),
        wrist: (
          posture: IAutoMovieMotionHumanPosture,
          progress: number,
        ): IAutoMovieVector3 => wristAt(posture).place(point(progress)).point,
        // The arm on the circle's start, as the stroke lays the palm there.
        arm: (posture: IAutoMovieMotionHumanPosture): IAutoMovieHumanLimbGoal =>
          AutoMovieMotionHumanArm.goal(body, side, palm(posture, 0)),
        refuse: (beyond: number, limit: number): string =>
          `${context.subject}: the patch's far side stays ${(1000 * beyond).toFixed(0)} mm beyond the ${side} arm at a lean of ${limit} degrees; a surface this far is walked up to first`,
      });
    // Refuse at plan time a patch a circle of which leaves the reach: nine
    // places an eighth of a turn apart cover one whole circle, which every
    // later circle repeats.
    for (let k: number = 0; k <= 8; k++) lean.pitch(standing, k / (8 * cycles));
    const origin: IAutoMovieMotionHumanArmTarget.IOrigin =
      AutoMovieMotionHumanArm.origin(
        body,
        poseBones(
          body,
          context.entry.pose,
          undefined,
          HumanHand.frameBones(body, side, "palm"),
        ),
        { origin: context.entry.posture.root, yaw },
        side,
        "palm",
      );
    const travel: number = AutoMovieMotionHumanTiming.aimed(
      AutoMovieEngineVector3.length(
        AutoMovieEngineVector3.subtract(
          point(0),
          AutoMovieMotionHumanArm.point(context.entry.posture, origin),
        ),
      ),
      // The palm lands on the patch it wipes, a circle's width across.
      2 * radius,
    );
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: travel,
        // Each circle takes its length at a tool stroke's hand speed.
        attack: ((2 * Math.PI * radius) / useTool.STROKE_SPEED) * cycles,
        retract: travel,
      }),
      modifiers,
    );
    const window: HumanPhysics.Window = HumanPhysics.fromClock(
      context.params,
      {},
      context.start,
      clock,
      context.instant,
    );
    const adjust: ReturnType<typeof prepareGroundedBalance> =
      prepareGroundedBalance(body, window);
    const reachLean: ReturnType<typeof lean.primitive> = lean.primitive(clock);
    const base: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, clock.duration);
    const balance: typeof reachLean =
      window === null
        ? reachLean
        : {
            ...reachLean,
            write: (posture, seconds, before, resolution, projection) =>
              adjust(
                reachLean.write(
                  posture,
                  seconds,
                  before,
                  resolution,
                  projection,
                ),
                seconds,
                before,
                resolution,
                projection,
              ),
          };
    const stroke: IAutoMovieMotionHumanArmPhrase.IStrokeProps & IPlanStroke = {
      body,
      clock,
      side,
      origin,
      contact: {
        kind: "plant",
        support:
          context.params.on.kind === "prop"
            ? { kind: "prop", subject: context.params.on.subject }
            : { kind: "ground" },
      },
      path: (
        posture: IAutoMovieMotionHumanPosture,
        _: number,
        progress: number,
      ): IAutoMovieMotionHumanArmTarget.ITarget => palm(posture, progress),
    };
    const compose = (arm: typeof reachLean): IAutoMovieMotionHumanActionPlan =>
      composeAutoMovieMotionHumanAction({
        base,
        clock,
        contact: "stroke",
        primitives: [balance, arm],
      });
    const plan: IAutoMovieMotionHumanActionPlan = {
      ...compose(AutoMovieMotionHumanArm.stroke(stroke)),
      ...HumanPhysics.declared(context.params, window),
    };
    if (context.carrier === undefined) {
      // The palm is planted. Its fixed circular onset cannot scale the
      // current target, whose bend, lean and balance still use this instant.
      const prepared: IAutoMovieMotionHumanActionPlan = compose(
        AutoMovieMotionHumanArmPhrase.preparedStroke(stroke),
      );
      const sample: IAutoMovieMotionHumanPlayback.IPhase["sample"] = (
        ...args
      ) => ({ posture: prepared.posture(...args) });
      HumanPreparedPlayback.attach(plan, body, {
        mode: "posture",
        phases: [
          { from: clock.at("strokeStart"), to: clock.at("strokeEnd"), sample },
          { from: clock.at("strokeEnd"), to: clock.at("relax"), sample },
          { from: clock.at("relax"), to: clock.duration, sample },
        ],
      });
    }
    return plan;
  }
}

/*
 * The record of `IPlanStroke`'s site.
 */
type IPlanStroke = {
  contact: NonNullable<IAutoMovieMotionHumanArmPhrase.IStrokeProps["contact"]>;
};
