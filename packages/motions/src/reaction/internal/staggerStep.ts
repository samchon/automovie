import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { StaggerPendulum } from "./StaggerPendulum";
import { staggerBounds } from "./staggerBounds";
import type { staggerRecover } from "./staggerRecover";

/**
 * One recovery step of a stagger (`staggerRecover`): the weight shifts onto the
 * stance foot over both feet, then the foot swings in its direction's measured
 * step time and lands the sole point it lands on as near the extrapolated
 * centre of mass as its reachable footstep region allows.
 *
 * The region is the stance foot's: within its direction's longest measured
 * recovery step of where the foot stood beside the stance foot at the entry,
 * the stance the measured steps were taken from, so a foot that steps again
 * cannot split the legs further than one step does. A landing on the stance
 * foot's far side, or nearer it than the feet stand side by side, crosses it,
 * in front of it or behind it, at least a sole's length ahead of or behind the
 * stance foot so the two soles do not overlap; of the two, the one nearer its
 * aim. A foot stepping forward strikes with its heel and one stepping backward
 * lands on its forefoot (Grasso, Bianchi and Lacquaniti 1998, J Neurophysiol
 * 80:1868), so the point runs from the heel to the ball with the step's share
 * along the foot.
 *
 * The step is placed in closed form on the pendulum alone; whether the legs
 * hold it is the admission's (`staggerAdmission`), which reads the step but
 * never moves it, so the pendulum's outcome is the whole model's wherever the
 * legs hold the steps.
 */
export namespace staggerStep {
  /** A step's outcome. */
  export interface IResult {
    /**
     * Whether the body is caught after it; null when the legs admit no landing
     * in its region.
     */
    done: boolean | null;

    /** Whether the landing crosses the stance foot. */
    crossing: boolean;
  }

  /**
   * Take one step on the pendulum.
   *
   * @param pendulum The pendulum, advanced through the step.
   * @param side The stepping foot.
   * @param reaction Seconds both feet bear before the weight shifts.
   * @param unloaded Whether this is a sideways push's first step with the leg
   *   it unloads (`staggerBounds.LATERAL`).
   * @param admit Whether the legs hold a candidate step at the given instants,
   *   whose feet cross when the flag says so (`staggerAdmission`); every
   *   landing is the aimed one when absent, the pendulum alone.
   * @returns Whether it catches the body, and whether the landing crosses.
   */
  export function take(
    pendulum: StaggerPendulum,
    side: AutoMovieHumanSide,
    reaction: number,
    unloaded: boolean,
    admit?: (
      step: staggerRecover.IStep,
      instants: readonly number[],
      crossing: boolean,
    ) => boolean,
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
    const { centre, forward, across, entered, width, length }: StaggerPendulum =
      pendulum;
    const stance: AutoMovieHumanSide = side === "left" ? "right" : "left";
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
    const from: IAutoMovieMotionHumanFoot.IPlacement = pendulum.feet[side];
    const swing: number = unloaded
      ? (LATERAL.swing * (STEP_TIME.forward + STEP_TIME.backward)) / 2
      : pendulum.bound(
          flat(
            Vector3.subtract(Vector3.add(centre, pendulum.xi()), from.ankle),
          ),
          STEP_TIME,
        );
    const start: number = pendulum.t;

    // Over the swing the stance foot alone bears, its centre of pressure
    // held where the weight shift ended, the stance foot's point nearest the
    // extrapolated centre of mass at lift-off.
    pendulum.hold(swing);

    // The aim: the landing point where the extrapolated centre of mass will
    // be once the landed foot has taken the weight, over the measured weight
    // shift (`StaggerPendulum.loaded`).
    const goal: IAutoMovieVector3 = Vector3.add(
      centre,
      pendulum.loaded(AutoMovieMotionHumanTiming.seconds(TRANSFER)),
    );
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
    const reached: (ankle: IAutoMovieVector3) => IAutoMovieVector3 = (
      ankle: IAutoMovieVector3,
    ): IAutoMovieVector3 => {
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
      sign *
        Vector3.dot(
          Vector3.subtract(ankle0, pendulum.feet[stance].ankle),
          across,
        ) <
      width;
    const crossed: (way: number) => IAutoMovieVector3 = (
      way: number,
    ): IAutoMovieVector3 => {
      const ahead: number = Vector3.dot(
        Vector3.subtract(ankle0, pendulum.feet[stance].ankle),
        forward,
      );
      const shift: number =
        way > 0 ? Math.max(0, length - ahead) : Math.min(0, -length - ahead);
      return reached(Vector3.add(ankle0, Vector3.scale(forward, shift)));
    };
    const off: (ankle: IAutoMovieVector3) => number = (
      ankle: IAutoMovieVector3,
    ): number => Vector3.length(flat(Vector3.subtract(ankle, wanted)));
    const crosses: (ankle: IAutoMovieVector3) => boolean = (
      ankle: IAutoMovieVector3,
    ): boolean =>
      sign *
        Vector3.dot(
          Vector3.subtract(ankle, pendulum.feet[stance].ankle),
          across,
        ) <
      width;
    const sides: IAutoMovieVector3[] = crossing
      ? ((
          front: IAutoMovieVector3,
          back: IAutoMovieVector3,
        ): IAutoMovieVector3[] =>
          off(front) <= off(back) ? [front, back] : [back, front])(
          crossed(1),
          crossed(-1),
        )
      : [ankle0];
    const stepTo: (ankle: IAutoMovieVector3) => staggerRecover.IStep = (
      ankle: IAutoMovieVector3,
    ): staggerRecover.IStep => ({
      side,
      from,
      to: { ankle: { ...ankle, y: from.ankle.y }, rotation: from.rotation },
      start,
      land: pendulum.t,
    });
    let chosen: IAutoMovieVector3 = sides[0]!;
    if (admit !== undefined) {
      // The centre of mass's course up to the touch-down does not depend on
      // where the foot lands, so each candidate landing is admitted on the
      // same course: the stance leg at mid-swing once, then the aimed
      // landing, the other side of a crossing, and else the farthest point
      // the legs hold on the way back to where the foot stood beside the
      // stance foot, as a step past the legs' reach shortens toward the
      // stance foot (step adaptation, Khadiv et al. 2016), bisected to
      // `ADAPTED` of the way, its admission taken as monotone along it.
      const landing: (ankle: IAutoMovieVector3) => boolean = (
        ankle: IAutoMovieVector3,
      ): boolean => admit(stepTo(ankle), [pendulum.t], crosses(ankle));
      if (!admit(stepTo(sides[0]!), [(start + pendulum.t) / 2], false))
        return { done: null, crossing };
      const held: IAutoMovieVector3 | undefined = sides.find(landing);
      if (held !== undefined) chosen = held;
      else {
        const toward: (share: number) => IAutoMovieVector3 = (
          share: number,
        ): IAutoMovieVector3 => Vector3.lerp(beside, sides[0]!, share);
        if (!landing(beside)) return { done: null, crossing };
        let lo: number = 0;
        let hi: number = 1;
        while (hi - lo > staggerBounds.ADAPTED) {
          const mid: number = (lo + hi) / 2;
          if (landing(toward(mid))) lo = mid;
          else hi = mid;
        }
        chosen = toward(lo);
      }
    }
    const to: IAutoMovieMotionHumanFoot.IPlacement = stepTo(chosen).to;
    pendulum.steps.push({ side, from, to, start, land: pendulum.t });
    pendulum.feet[side] = to;

    // From the touch-down both feet may bear, but a foot takes no weight as
    // it touches down: the centre of pressure stays where the swing held it
    // until the next weight shift, or the close's, carries it onto the
    // landed foot (`StaggerPendulum.transfer`), so it never jumps.

    // Caught once the extrapolated centre of mass lies inside the base the
    // two feet now make, the zero-step capture region (Koolen et al. 2012).
    return { done: pendulum.captured(), crossing: crosses(chosen) };
  }
}
