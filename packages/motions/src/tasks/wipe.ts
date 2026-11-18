import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLeanInto,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanWipe,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLeanInto } from "../compose/AutoMovieMotionHumanLeanInto";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { prepareGroundedBalance } from "../everyday/prepareGroundedBalance";
import { HumanBound } from "../law/HumanBound";
import { HumanPhysics } from "../law/HumanPhysics";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { HumanHandTarget } from "../posture/HumanHandTarget";
import { poseBones } from "../posture/poseBones";
import { useTool } from "./useTool";

/**
 * Wiping a table, counter or other level surface with the flat palm in
 * circles, standing before it: a household task (#3256) that the composed
 * laws lacked, the palm's circling stroke on a work surface.
 *
 * The goal is the palm flat on the surface, circling its centre with a
 * radius of a quarter of the forearm (provisional) `cycles` times. The hand
 * comes to the surface in the aimed movement time (McIntosh et al. 2018),
 * circles at a tool stroke's hand speed (`useTool.STROKE_SPEED`) with the palm on the
 * surface throughout, and returns. A patch whose far side lies beyond the
 * standing arm is leaned into (`AutoMovieMotionHumanLeanInto`): the trunk
 * tips about the hips by the least pitch that keeps the wrist within the
 * reach of an elbow kept at `ELBOW` degrees (`reach`); one still out of reach at the lean's limit is
 * refused, since it is walked up to first. The preferred working height lies
 * 200 to 250 mm below the elbow (Li, Chang and Zhang 2024, Sensors 24:7056);
 * the law accepts any reachable height and the author places the surface.
 * Events: the phrase's `ready` (palm down), `strokeStart`, `strokeEnd`,
 * `relax` (palm lifted).
 *
 * Not yet: leaning on the counter with the free hand (Iwakiri et al. 2007),
 * a held cloth as a prop, and the task sequences (dishwashing, laundry, bed
 * making) that chain this with the grasp, affordance and bend laws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal, the stroke, the refusal, the working height's source, the events and what is missing.
 * @evidence contracts/development/design.md#principled-representation A law record of one arm stroke over a standing base.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the kept elbow and its reach share, the circle and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The surface is a target; the circle is a share of the forearm.
 */
export namespace wipe {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "wipe";

  /** Cancel table: the hand lifts off and the body stands, walks or operates. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      { window: ["relax", 1], kind: "inertialize", entry: 0, blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate },
    ],
    walk: [{ window: ["relax", 1], kind: "inertialize", entry: 0, blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate }],
    operate: [
      { window: ["relax", 1], kind: "inertialize", entry: 0, blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate },
    ],
  };

  /** May be performed over a carrier, such as seated or while another action carries the body: it claims only the parts it moves. */
  export const overlay: boolean = true;

  /**
   * The least flexion the elbow keeps on the surface, degrees: the lower end
   * of the functional elbow arc of Morrey, Askew and Chao 1981 (J Bone Joint
   * Surg Am 63:872, 30 to 130 degrees), so the elbow never locks straight.
   */
  export const ELBOW: number = 30;

  /**
   * The share of the arm's length the wrist reaches with the elbow kept at
   * `ELBOW`: the law of cosines over the body's own upper arm and forearm,
   * `sqrt(u^2 + f^2 + 2 u f cos ELBOW) / (u + f)`.
   *
   * @param body The body.
   * @returns The share, in (0, 1].
   */
  export function reach(body: IAutoMovieMotionHumanBody): number {
    const u: number = body.measure.upperArm;
    const f: number = body.measure.forearm;
    const bent: number = (ELBOW * Math.PI) / 180;
    return Math.sqrt(u * u + f * f + 2 * u * f * Math.cos(bent)) / (u + f);
  }

  /**
   * The palm's place on the circle at a progress of the stroke.
   *
   * @param centre The patch's middle, world.
   * @param radius The circle's radius, metres.
   * @param yaw The heading, degrees.
   * @param cycles The circle count.
   * @param progress The stroke's progress in [0, 1].
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's frame and unit and the returned world point.
   * @evidence contracts/development/implementation.md#principled-implementation The phase `2 pi cycles progress` on a circle of the radius about the centre, starting at its point nearest the performer, in the heading's floor frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One local circle (`localCircle`) and one floor-frame transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The point is computed for any progress, never sampled or clamped.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan's own circle uses the same `localCircle`, so the case kit's check and the stroke agree.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function circle(
    centre: IAutoMovieVector3,
    radius: number,
    yaw: number,
    cycles: number,
    progress: number,
  ): IAutoMovieVector3 {
    return HumanFrame.point({ origin: centre, yaw }, localCircle(radius, cycles, progress));
  }

  /**
   * Plan a wipe.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the cycle count is not a positive integer, or the patch lies beyond reach.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the refusals and the plan; the namespace gives the goal, the stroke, the lean, the timing and the sources.
   * @evidence contracts/development/implementation.md#principled-implementation The palm's goal is its place on the circle at the stroke's progress, laid flat with the fingers ahead; a patch beyond the standing arm is leaned into by the least pitch that keeps the wrist within `REACH` (`AutoMovieMotionHumanLeanInto`), checked at plan time over one whole circle; the reach takes the aimed movement time of the hand's way to the circle's start, onto the patch the circle covers (McIntosh et al. 2018).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Circle and palm geometry, the lean with its refusal, the entry hand, the clock, then the lean and the planted stroke.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A patch out of reach at the lean's limit is refused, never clamped; the palm is planted on the surface's own support.
   * @evidence contracts/development/implementation.md#efficient-algorithms The heading's frame and the palm's alignment are prepared once; the plan-time reach check reads nine places of one circle, each a wrist read with no elbow search; each stroke second costs one palm target.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The circle (`localCircle`), the frame (`HumanFrame.prepare`) and the palm targets (`AutoMovieMotionHumanTarget.prepareHand`, `HumanHandTarget.prepareFrame`) are prepared once for the plan's fixed hand, surface and heading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds the prepared geometry and the lean for its lifetime; nothing grows with the seconds evaluated.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWipe.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const side: AutoMovieHumanSide = context.params.hand ?? "right";
    // Three circles when the author names none, the contract's default
    // (`IAutoMovieMotionHumanWipe.IParams.cycles`).
    const cycles: number = context.params.cycles ?? 3;
    HumanBound.whole("cycles", cycles);
    const modifiers: IAutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const centre: IAutoMovieVector3 = context.aim(
      context.params.on,
      context.start,
    ).point;
    const radius: number = m.forearm / 4;
    const yaw: number = context.entry.posture.yaw;
    const frame: HumanFrame.IPrepared = HumanFrame.prepare({ origin: centre, yaw });
    const point: (progress: number) => IAutoMovieVector3 = (progress: number): IAutoMovieVector3 =>
      frame.point(localCircle(radius, cycles, progress));
    const forward: IAutoMovieVector3 = frame.direction({ x: 0, y: 0, z: 1 });
    const targetAt: ReturnType<typeof AutoMovieMotionHumanTarget.prepareHand> =
      AutoMovieMotionHumanTarget.prepareHand(body, side, { x: 0, y: 1, z: 0 },
        { surface: "palm", shape: "flat", forward });
    const wristAt: ReturnType<typeof HumanHandTarget.prepareFrame> =
      HumanHandTarget.prepareFrame(body, side, { x: 0, y: 1, z: 0 },
        { surface: "palm", shape: "flat", forward });
    const palm: (posture: IAutoMovieMotionHumanPosture, progress: number) => IAutoMovieMotionHumanArmTarget.ITarget = (
      posture: IAutoMovieMotionHumanPosture,
      progress: number,
    ): IAutoMovieMotionHumanArmTarget.ITarget =>
      targetAt(posture, point(progress));
    // The lean into a patch whose far side lies beyond the standing arm.
    const standing: IAutoMovieMotionHumanPosture = stand
      .plan({ ...context, params: { seconds: 1 } })
      .posture(0);
    const lean: IAutoMovieMotionHumanLeanInto.ILean =
      AutoMovieMotionHumanLeanInto.solve({
        body,
        standing,
        side,
        share: reach(body),
        wrist: (posture: IAutoMovieMotionHumanPosture, progress: number): IAutoMovieVector3 =>
          wristAt(posture).place(point(progress)).point,
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
        poseBones(body, context.entry.pose, undefined, HumanHand.frameBones(body, side, "palm")),
        { origin: context.entry.posture.root, yaw },
        side,
        "palm",
      );
    const travel: number = AutoMovieMotionHumanTiming.aimed(
      Vector3.length(
        Vector3.subtract(
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
    const window: HumanPhysics.Window = HumanPhysics.fromClock(context.params, {}, context.start, clock, context.instant);
    const adjust: ReturnType<typeof prepareGroundedBalance> = prepareGroundedBalance(body, window);
    const reachLean: ReturnType<typeof lean.primitive> = lean.primitive(clock);
    const plan: IAutoMovieMotionHumanActionPlan = composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.under(context, clock.duration),
      clock,
      contact: "stroke",
      primitives: [
        window === null ? reachLean : {
          ...reachLean,
          write: (posture, seconds, before, resolution, projection) => adjust(
            reachLean.write(posture, seconds, before, resolution, projection),
            seconds, before, resolution, projection,
          ),
        },
        AutoMovieMotionHumanArm.stroke({
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
          path: (posture: IAutoMovieMotionHumanPosture, _: number, progress: number): IAutoMovieMotionHumanArmTarget.ITarget =>
            palm(posture, progress),
        }),
      ],
    });
    return { ...plan, ...HumanPhysics.declared(context.params, window) };
  }
}

/** The circle about the centre in the heading's floor frame: starting at its point nearest the performer, `cycles` turns over the progress. */
function localCircle(radius: number, cycles: number, progress: number): IAutoMovieVector3 {
  const a: number = 2 * Math.PI * cycles * progress;
  return { x: radius * Math.sin(a), y: 0, z: -radius * Math.cos(a) };
}
