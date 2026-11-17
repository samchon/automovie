import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieMotionHumanWalkStanceCourse,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkReach } from "../actions/walkReach";
import { walkReachHeld } from "../actions/walkReachHeld";
import { AutoMovieMotionHumanAuditContact } from "../audit/AutoMovieMotionHumanAuditContact";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { HumanBalance } from "../everyday/HumanBalance";
import { HumanFrame } from "../posture/HumanFrame";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingStance } from "../striking/StrikingStance";
import { StrikingTarget } from "../striking/StrikingTarget";
import { staggerBounds } from "./staggerBounds";
import type { staggerRecover } from "./staggerRecover";

/**
 * The knots of a stagger's stance course (`walkStanceCourse`): the feet as
 * the recovery's steps place them, the centre of mass's course, the points
 * the feet bear, and the frame the pelvis stands in, at `KNOTS` a second;
 * with the trunk's shift of the centre of mass, the knee's hint and the
 * share of a swing a foot rises in, which the plan reads too.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the knots hold and who reads them.
 * @evidence contracts/development/design.md#principled-representation The course's knots with each one's pelvis frame, built once per solve.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The knots, their type and the readings the plan shares with them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every reading is the body's own; the reference tilt and the knot rate are `staggerBounds`'.
 */
export namespace staggerKnots {
  /**
   * The centre of mass's shift per sine of the trunk's tilt about the hips,
   * on the entry's feet: the posture tilted `REFERENCE` degrees in pitch and
   * in roll (`AutoMovieMotionHumanLean.pivot`) and its centre of mass read
   * (`HumanBalance.support`).
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @returns The horizontal shift per sine of the pitch and of the roll, metres.
   */
  export function bending(
    body: IAutoMovieMotionHumanActionContext["body"],
    entry: IAutoMovieMotionHumanActionContext["entry"],
  ): Record<"pitch" | "roll", IAutoMovieVector3> {
    const standing: IAutoMovieMotionHumanPosture = {
      ...entry.posture,
      limbs: {
        ...entry.posture.limbs,
        ...StrikingStance.legs(body, StrikingTarget.feet(entry)),
      },
    };
    const upright: IAutoMovieVector3 = HumanBalance.support(
      body,
      standing,
    ).centre;
    const sine: number = Math.sin((staggerBounds.REFERENCE * Math.PI) / 180);
    const shift = (more: {
      pitch: number;
      roll: number;
    }): IAutoMovieVector3 => {
      const tilted: IAutoMovieMotionHumanPosture =
        AutoMovieMotionHumanLean.pivot(body, standing, more);
      const centre: IAutoMovieVector3 = HumanBalance.support(body, {
        ...tilted,
        root: resolveHumanPosture.lower(body, tilted).root,
      }).centre;
      return {
        x: (centre.x - upright.x) / sine,
        y: 0,
        z: (centre.z - upright.z) / sine,
      };
    };
    return {
      pitch: shift({ pitch: staggerBounds.REFERENCE, roll: 0 }),
      roll: shift({ pitch: 0, roll: staggerBounds.REFERENCE }),
    };
  }

  /**
   * A stance course's pelvis at an instant: the upright root carries the
   * centre of mass's travel less the shift the trunk's tilt makes of it
   * (`bending`), so the centre keeps its course whatever the trunk does, and
   * the pelvis turns toward its stances (`walkReach.pelvis`) and tilts with
   * the trunk about the hips (`walkReachHeld.tilt`).
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param bend The shift per sine of the trunk's tilt.
   * @param travel The centre of mass's travel from the entry's, world metres.
   * @param feet Each foot as scheduled then.
   * @returns The upright root and the pelvis under a trunk's tilt, and the pelvis's heading.
   */
  export function frame(
    body: IAutoMovieMotionHumanActionContext["body"],
    entry: IAutoMovieMotionHumanPosture,
    bend: Record<"pitch" | "roll", IAutoMovieVector3>,
    travel: IAutoMovieVector3,
    feet: Readonly<
      Record<"left" | "right", IAutoMovieMotionHumanWalkFoot.IScheduled>
    >,
  ): {
    root: (
      trunk: IAutoMovieMotionHumanWalkStanceCourse.ITrunk,
    ) => IAutoMovieVector3;
    pelvis: (
      trunk: IAutoMovieMotionHumanWalkStanceCourse.ITrunk,
    ) => IAutoMovieMotionHumanWalkStanceCourse.IPelvis;
    yaw: number;
  } {
    const root = (
      trunk: IAutoMovieMotionHumanWalkStanceCourse.ITrunk,
    ): IAutoMovieVector3 => {
      const p: number = Math.sin((trunk.pitch * Math.PI) / 180);
      const r: number = Math.sin((trunk.roll * Math.PI) / 180);
      return {
        x: entry.root.x + travel.x - bend.pitch.x * p - bend.roll.x * r,
        y: entry.root.y,
        z: entry.root.z + travel.z - bend.pitch.z * p - bend.roll.z * r,
      };
    };
    const base: IAutoMovieVector3 = root({ pitch: 0, roll: 0 });
    const upright: walkReach.IPelvis = walkReach.pelvis(
      body,
      base,
      entry.yaw,
      entry.joints.hips ?? [0, 0, 0],
      feet,
    );
    return {
      root,
      pelvis: (
        trunk: IAutoMovieMotionHumanWalkStanceCourse.ITrunk,
      ): IAutoMovieMotionHumanWalkStanceCourse.IPelvis => {
        const at: IAutoMovieVector3 = root(trunk);
        const moved = (hip: IAutoMovieVector3): IAutoMovieVector3 => ({
          x: hip.x + at.x - base.x,
          y: hip.y,
          z: hip.z + at.z - base.z,
        });
        return walkReachHeld.tilt(
          body,
          at,
          upright.yaw,
          { left: moved(upright.hips.left), right: moved(upright.hips.right) },
          trunk,
        );
      },
      yaw: upright.yaw,
    };
  }

  /**
   * The point a leg's knee bends toward: ahead over its foot's heading from
   * where the knee rests under the root.
   *
   * @param body The body.
   * @param root The lowered root, world metres.
   * @param yaw The pelvis's heading, degrees.
   * @param side The leg.
   * @param heading The foot's heading, degrees.
   * @returns World metres.
   */
  export function kneePole(
    body: IAutoMovieMotionHumanActionContext["body"],
    root: IAutoMovieVector3,
    yaw: number,
    side: "left" | "right",
    heading: number,
  ): IAutoMovieVector3 {
    return HumanFrame.point(
      {
        origin: HumanFrame.point(
          { origin: root, yaw },
          body.rest.get(`${side}LowerLeg`)!,
        ),
        yaw: heading,
      },
      { x: 0, y: 0, z: 1 },
    );
  }
  /**
   * The share of a swing a stepping foot takes to rise clear of the floor:
   * the share of a walking swing its lift takes to set down from the
   * floor's contact height (`walkFoot.swing`).
   *
   * @param body The body.
   * @returns The share.
   */
  export function risingOf(
    body: IAutoMovieMotionHumanActionContext["body"],
  ): number {
    return (
      Math.asin(
        Math.sqrt(
          AutoMovieMotionHumanAuditContact.HEIGHT /
            (staggerBounds.LIFT * body.measure.hipHeight),
        ),
      ) / Math.PI
    );
  }

  /**
   * A recovery's stance-course knots up to a second (`walkStanceCourse`):
   * at `KNOTS` a second, the feet standing where their last steps put them
   * and a swinging foot read at the place it left, for the pelvis's turn
   * alone, from its lift-off; the pelvis on the centre of mass's course
   * (`frame`); the feet bearing the centre of pressure, and the extrapolated
   * centre of mass once a step has caught it and both feet stand; a foot
   * that has landed free to turn out.
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param bend The shift per sine of the trunk's tilt.
   * @param walk The steps, the pendulum's courses, the catching step's landing, seconds since the action's start, and the landing the course places, when one is.
   * @param until The last knot's second.
   * @returns The knots, each with its frame.
   */
  export function of(
    body: IAutoMovieMotionHumanActionContext["body"],
    entry: IAutoMovieMotionHumanActionContext["entry"],
    bend: Record<"pitch" | "roll", IAutoMovieVector3>,
    walk: {
      steps: readonly staggerRecover.IStep[];
      course: (seconds: number) => IAutoMovieVector3;
      pressure: (seconds: number) => IAutoMovieVector3;
      extrapolated: (seconds: number) => IAutoMovieVector3;
      caught: number;
      landing?: {
        placement: IAutoMovieMotionHumanFoot.IPlacement;
        goal: IAutoMovieVector3;
        region: (ankle: IAutoMovieVector3) => number[];
      };
    },
    until: number,
  ): IKnot[] {
    const entered: Record<
      "left" | "right",
      IAutoMovieMotionHumanFoot.IPlacement
    > = StrikingTarget.feet(entry);
    const rising: number = risingOf(body);
    const knots: IKnot[] = [];
    for (
      let k: number = 0;
      k <= Math.ceil(until * staggerBounds.KNOTS - 1e-9);
      k++
    ) {
      const t: number = Math.min(until, k / staggerBounds.KNOTS);
      const feet: Record<
        "left" | "right",
        IAutoMovieMotionHumanWalkFoot.IScheduled
      > = {
        left: { placement: entered.left, toes: 0 },
        right: { placement: entered.right, toes: 0 },
      };
      for (const step of walk.steps)
        if (t >= step.land - 1e-9)
          feet[step.side] = { placement: step.to, toes: 0 };
      for (const step of walk.steps)
        if (t > step.start && t < step.land - 1e-9)
          feet[step.side] = {
            placement: step.from,
            toes: 0,
            swing: {
              u: Math.max(
                0,
                ((t - step.start) / (step.land - step.start) - rising) /
                  (1 - rising),
              ),
              off: step.start,
              on: step.land,
            },
          };
      const stances: ("left" | "right")[] = (["left", "right"] as const).filter(
        (side: "left" | "right"): boolean => feet[side].swing === undefined,
      );
      const framed = frame(body, entry.posture, bend, walk.course(t), feet);
      knots.push({
        seconds: k / staggerBounds.KNOTS,
        frame: framed,
        pelvis: framed.pelvis,
        borne: [
          walk.pressure(t),
          ...(t >= walk.caught && stances.length === 2
            ? [walk.extrapolated(t)]
            : []),
        ],
        stances: stances.map(
          (
            side: "left" | "right",
          ): IAutoMovieMotionHumanWalkStanceCourse.IStance => ({
            side,
            placement: feet[side].placement,
            turning: walk.steps.some(
              (step: staggerRecover.IStep): boolean =>
                step.side === side && t >= step.land - 1e-9,
            ),
            ...(walk.landing !== undefined &&
            feet[side].placement === walk.landing.placement
              ? {
                  landing: {
                    goal: walk.landing.goal,
                    region: walk.landing.region,
                  },
                }
              : {}),
          }),
        ),
      });
    }
    return knots;
  }

  /** A recovery's stance-course knot with the frame its pelvis stands in (`of`). */
  export type IKnot = IAutoMovieMotionHumanWalkStanceCourse.IKnot & {
    frame: ReturnType<typeof frame>;
  };
}
