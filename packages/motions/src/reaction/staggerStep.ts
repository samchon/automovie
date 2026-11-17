import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieMotionHumanTiming,
} from "../compose/AutoMovieMotionHumanTiming";
import { HumanFoot } from "../posture/HumanFoot";
import { StaggerPendulum } from "./StaggerPendulum";
import { staggerBounds } from "./staggerBounds";

/**
 * One recovery step of a stagger (`staggerRecover`): the weight shifts onto
 * the stance foot over both feet, then the foot swings in its direction's
 * measured step time and lands the sole point it lands on as near the
 * extrapolated centre of mass as its reachable footstep region allows.
 *
 * The region is the stance foot's: within its direction's longest measured
 * recovery step of where the foot stood beside the stance foot at the entry,
 * the stance the measured steps were taken from, so a foot that steps again
 * cannot split the legs further than one step does. A landing on the stance
 * foot's far side, or nearer it than the feet stand side by side, crosses
 * it, in front of it or behind it, at least a sole's length ahead of or
 * behind the stance foot so the two soles do not overlap; of the two, the
 * one nearer its aim. A foot stepping forward strikes with its heel and one
 * stepping backward lands on its forefoot (Grasso, Bianchi and Lacquaniti
 * 1998, J Neurophysiol 80:1868), so the point runs from the heel to the ball
 * with the step's share along the foot.
 *
 * The step is placed in closed form on the pendulum alone; whether the legs
 * hold it is the admission's (`staggerAdmission`), which reads the step but
 * never moves it, so the pendulum's outcome is the whole model's wherever
 * the legs hold the steps.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the step's phases, its region, its crossing, its landing point, its source and the admission's separation.
 * @evidence contracts/development/design.md#principled-representation One step over a shared pendulum, so the orders of the feet search reuses the steps they share.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function and its result, read by `staggerRecover`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every bound is a measured one from `staggerBounds`; the region scales with the body's stature and the crossing with its soles.
 */
export namespace staggerStep {
  /** A step's outcome.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the capture flag and whether the landing crosses the stance foot.
   * @evidence contracts/development/design.md#principled-representation The capture decision and the crossing the admission reads; the step itself is on the pendulum.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Recovery reads both to continue an order and to admit its prefix.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reports the pendulum's actual capture, with no success override.
   */
  export interface IResult {
    /** Whether the body is caught after it. */
    done: boolean;

    /** Whether the landing crosses the stance foot. */
    crossing: boolean;
  }

  /**
   * Take one step on the pendulum.
   *
   * @param pendulum The pendulum, advanced through the step.
   * @param side The stepping foot.
   * @param reaction Seconds both feet bear before the weight shifts.
   * @param unloaded Whether this is a sideways push's first step with the leg it unloads (`staggerBounds.LATERAL`).
   * @returns Whether it catches the body, and whether the landing crosses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the outcome.
   * @evidence contracts/development/implementation.md#principled-implementation Capture-point stepping (Koolen et al. 2012; Hof 2008): the foot lands its landing point on the extrapolated centre of mass at touch-down, held inside the measured region and, crossing, a sole's length clear of the stance foot; caught once the extrapolated centre of mass is inside the two feet's base.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shift, the swing, the aim, the region, the crossing, the landing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The region and the times are the measured bounds; a landing is never moved by the legs' admission, which refuses it instead.
   * @evidence contracts/development/implementation.md#efficient-algorithms Closed form: a weight shift of `TRANSFER / STEP` held-pressure spans, one swing span, a zero-length touch-down span on both feet, two region clamps and two support hulls.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Ball, heel and sole positions are read once from the departing placement and shared by its toe direction, aim and landing point.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Appends the step and its spans to the pendulum the search owns.
   */
  export function take(
    pendulum: StaggerPendulum,
    side: "left" | "right",
    reaction: number,
    unloaded: boolean,
  ): IResult {
    const body: StaggerPendulum["body"] = pendulum.body;
    const flat: typeof StaggerPendulum.flat = StaggerPendulum.flat;
    const {
      REACTION,
      TRANSFER,
      LATERAL,
      STEP_TIME,
      STEP_LENGTH,
    }: typeof staggerBounds = staggerBounds;
    const { centre, forward, across, entered, width, length }: StaggerPendulum = pendulum;
    const stance: "left" | "right" = side === "left" ? "right" : "left";
    if (reaction > 0) pendulum.bear(["left", "right"], reaction);

    // The leg a sideways push unloads leaves the floor sooner and swings
    // longer than a forward or backward step's (`LATERAL`).
    const forth: number =
      AutoMovieMotionHumanTiming.seconds(REACTION) +
      AutoMovieMotionHumanTiming.seconds(TRANSFER);
    pendulum.transfer(
      stance,
      unloaded
        ? LATERAL.footOff * forth - AutoMovieMotionHumanTiming.seconds(REACTION)
        : AutoMovieMotionHumanTiming.seconds(TRANSFER),
    );
    const from: HumanFoot.IPlacement = pendulum.feet[side];
    const swing: number = unloaded
      ? (LATERAL.swing * (STEP_TIME.forward + STEP_TIME.backward)) / 2
      : pendulum.bound(
          flat(Vector3.subtract(Vector3.add(centre, pendulum.xi()), from.ankle)),
          STEP_TIME,
        );
    const start: number = pendulum.t;
    pendulum.bear([stance], swing);

    // The aim: the landing point on the extrapolated centre of mass at
    // touch-down.
    const goal: IAutoMovieVector3 = Vector3.add(centre, pendulum.xi());
    const ball: IAutoMovieVector3 = HumanFoot.point(body, side, "ball", from);
    const heel: IAutoMovieVector3 = HumanFoot.point(body, side, "heel", from);
    const toes: IAutoMovieVector3 = flat(Vector3.subtract(ball, heel));
    const sole: IAutoMovieVector3 = HumanFoot.point(body, side, "sole", from);
    const aim: IAutoMovieVector3 = flat(Vector3.subtract(goal, sole));
    const aimed: number = Vector3.length(aim);
    const toeLength: number = Vector3.length(toes);
    const share: number =
      aimed > 0 && toeLength > 0
        ? Vector3.dot(aim, toes) / (aimed * toeLength)
        : 0;
    const lands: IAutoMovieVector3 = Vector3.lerp(
      sole,
      share >= 0 ? heel : ball,
      Math.abs(share),
    );
    const wanted: IAutoMovieVector3 = Vector3.add(
      from.ankle,
      flat(Vector3.subtract(goal, lands)),
    );

    // The region: the step's length from where the foot stood beside the
    // stance foot.
    const beside: IAutoMovieVector3 = Vector3.add(
      pendulum.feet[stance].ankle,
      flat(Vector3.subtract(entered[side].ankle, entered[stance].ankle)),
    );
    const reached: (ankle: IAutoMovieVector3) => IAutoMovieVector3 = (ankle: IAutoMovieVector3): IAutoMovieVector3 => {
      const travel: IAutoMovieVector3 = flat(Vector3.subtract(ankle, beside));
      const longest: number =
        pendulum.bound(travel, STEP_LENGTH) * body.measure.stature;
      const distance: number = Vector3.length(travel);
      return distance > longest
        ? Vector3.add(beside, Vector3.scale(travel, longest / distance))
        : ankle;
    };
    const ankle0: IAutoMovieVector3 = reached(wanted);

    // A landing on the stance foot's far side, or nearer it than the feet
    // stand side by side, crosses it: it lands in front of it or behind it,
    // at least a sole's length ahead of or behind the stance foot, the one
    // nearer the aim.
    const sign: number = side === "left" ? 1 : -1;
    const crossing: boolean =
      sign * Vector3.dot(Vector3.subtract(ankle0, pendulum.feet[stance].ankle), across) <
      width;
    const crossed: (way: number) => IAutoMovieVector3 = (way: number): IAutoMovieVector3 => {
      const ahead: number = Vector3.dot(
        Vector3.subtract(ankle0, pendulum.feet[stance].ankle),
        forward,
      );
      const shift: number =
        way > 0 ? Math.max(0, length - ahead) : Math.min(0, -length - ahead);
      return reached(Vector3.add(ankle0, Vector3.scale(forward, shift)));
    };
    const off: (ankle: IAutoMovieVector3) => number = (ankle: IAutoMovieVector3): number =>
      Vector3.length(flat(Vector3.subtract(ankle, wanted)));
    const chosen: IAutoMovieVector3 = crossing
      ? ((front: IAutoMovieVector3, back: IAutoMovieVector3): IAutoMovieVector3 =>
          off(front) <= off(back) ? front : back)(crossed(1), crossed(-1))
      : ankle0;
    const to: HumanFoot.IPlacement = {
      ankle: { ...chosen, y: from.ankle.y },
      rotation: from.rotation,
    };
    pendulum.steps.push({ side, from, to, start, land: pendulum.t });
    pendulum.feet[side] = to;

    // From the touch-down both feet bear: the centre of pressure stands as
    // near the extrapolated centre of mass as their outline reaches, the
    // pendulum's own rule, and the next weight shift leaves from there.
    pendulum.bear(["left", "right"], 0);

    // Caught once the extrapolated centre of mass lies inside the base the
    // two feet now make, the zero-step capture region (Koolen et al. 2012).
    return { done: pendulum.captured(), crossing };
  }
}
