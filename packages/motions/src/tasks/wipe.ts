import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { tags } from "typia";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanLeanInto } from "../compose/AutoMovieMotionHumanLeanInto";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";

/**
 * Wiping a table, counter or other level surface with the flat palm in
 * circles, standing before it: a household task (#3256) that the composed
 * laws lacked, the palm's circling stroke on a work surface.
 *
 * The goal is the palm flat on the surface, circling its centre with a
 * radius of a quarter of the forearm (provisional) `cycles` times. The hand
 * comes to the surface in the aimed movement time (McIntosh et al. 2018),
 * circles over `PERIOD` seconds a cycle (provisional) with the palm on the
 * surface throughout, and returns. A patch whose far side lies beyond the
 * standing arm is leaned into (`AutoMovieMotionHumanLeanInto`): the trunk
 * tips about the hips by the least pitch that keeps the wrist within `REACH`
 * of the arm's length; one still out of reach at the lean's limit is
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the reach share, the period and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The surface is a target; the circle is a share of the forearm.
 */
export namespace wipe {
  /** The action's name. */
  export const name: HumanActionName = "wipe";

  /** Cancel table: the hand lifts off and the body stands, walks or operates. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      { window: ["relax", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    walk: [{ window: ["relax", 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    operate: [
      { window: ["relax", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
  };

  /** May be performed over a carrier, such as seated or while another action carries the body: it claims only the parts it moves. */
  export const overlay: boolean = true;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its default.
   * @evidence contracts/development/design.md#principled-representation The surface's centre, the hand and the count.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No hand place is typed.
   */
  export interface IParams {
    /** The middle of the patch wiped, on the surface's top. */
    on: AutoMovieMotionTarget;

    /** The hand; `right` when absent. */
    hand?: HumanHand.Side;

    /** How many circles; 3 when absent. */
    cycles?: number & tags.Type<"uint32"> & tags.Minimum<1>;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** The share of the arm's length the wrist is kept within, so the elbow never locks straight on the surface (provisional). */
  export const REACH: number = 0.97;

  /** One circle's seconds (provisional). */
  export const PERIOD: number = 0.9;

  /**
   * The palm's place on the circle at a progress of the stroke.
   *
   * @param centre The patch's middle, world.
   * @param radius The circle's radius, metres.
   * @param yaw The heading, degrees.
   * @param cycles The circle count.
   * @param progress The stroke's progress in [0, 1].
   * @returns World metres.
   */
  export function circle(
    centre: IAutoMovieVector3,
    radius: number,
    yaw: number,
    cycles: number,
    progress: number,
  ): IAutoMovieVector3 {
    const a: number = 2 * Math.PI * cycles * progress;
    return HumanFrame.point(
      { origin: centre, yaw },
      { x: radius * Math.sin(a), y: 0, z: -radius * Math.cos(a) + radius },
    );
  }

  /**
   * Plan a wipe.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the cycle count is not a positive integer, or the patch lies beyond reach.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const m = body.measure;
    const side: HumanHand.Side = context.params.hand ?? "right";
    const cycles: number = context.params.cycles ?? 3;
    HumanBound.whole("cycles", cycles);
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const centre: IAutoMovieVector3 = context.aim(
      context.params.on,
      context.start,
    ).point;
    const radius: number = m.forearm / 4;
    const yaw: number = context.entry.posture.yaw;
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );
    const palm = (
      posture: IHumanPosture,
      progress: number,
    ): AutoMovieMotionHumanArm.ITarget =>
      AutoMovieMotionHumanTarget.hand(
        body,
        posture,
        side,
        {
          point: circle(centre, radius, yaw, cycles, progress),
          normal: { x: 0, y: 1, z: 0 },
        },
        { surface: "palm", shape: "flat", forward },
      );
    // The lean into a patch whose far side lies beyond the standing arm.
    const standing: IHumanPosture = stand
      .plan({ ...context, params: { seconds: 1 } })
      .posture(0);
    const lean: AutoMovieMotionHumanLeanInto.ILean =
      AutoMovieMotionHumanLeanInto.solve({
        body,
        standing,
        side,
        share: REACH,
        wrist: (posture: IHumanPosture, progress: number) => {
          const goal: AutoMovieMotionHumanArm.ITarget = palm(posture, progress);
          return HumanHand.place(
            body,
            side,
            goal.surface,
            goal.point,
            goal.rotation,
            goal.shape,
          ).point;
        },
        refuse: (beyond: number, limit: number): string =>
          `${context.subject}: the patch's far side stays ${(1000 * beyond).toFixed(0)} mm beyond the ${side} arm at a lean of ${limit} degrees; a surface this far is walked up to first`,
      });
    // Refuse at plan time a patch a circle of which leaves the reach.
    for (let k: number = 0; k <= 8; k++) lean.pitch(standing, k / (8 * cycles));
    const origin: AutoMovieMotionHumanArm.IOrigin =
      AutoMovieMotionHumanArm.origin(
        body,
        poseBones(body, context.entry.pose),
        { origin: context.entry.posture.root, yaw },
        side,
        "palm",
      );
    const travel: number = AutoMovieMotionHumanTiming.aimed(
      Vector3.length(
        Vector3.subtract(
          centre,
          AutoMovieMotionHumanArm.point(context.entry.posture, origin),
        ),
      ),
      0.1,
    );
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: travel,
        attack: PERIOD * cycles,
        retract: travel,
      }),
      modifiers,
    );
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.under(context, clock.duration),
      clock,
      contact: "stroke",
      primitives: [
        lean.primitive(clock),
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
          path: (posture: IHumanPosture, _: number, progress: number) =>
            palm(posture, progress),
        }),
      ],
    });
  }
}
