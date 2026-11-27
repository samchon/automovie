import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanDefend,
  IAutoMovieMotionHumanFoot,
} from "@automovie/interface";

import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";
import type { defendGeometry } from "./defendGeometry";
import { strikingStepSupport } from "./strikingStepSupport";

/*
 * Continue an interrupted step beneath the defence's own clock. A checking leg
 * that bears at the cut can lift once the other foot has landed.
 * Parameter context: The displayed cut entry.
 * Parameter timing: The defence's own action-relative timing.
 * Parameter checking: The checking foot, when the defence lifts one.
 * Returns: The shared landing, release and displayed leg goals, or undefined
 * when the defence starts from settled feet.
 */
export function defendFootwork(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDefend.IParams>,
  timing: defendGeometry.ITiming,
  checking: AutoMovieHumanSide | undefined,
): defendFootwork.ISupport | undefined {
  const recovery: strikingStepSupport.ISupport | undefined =
    strikingStepSupport(context);
  if (recovery === undefined) return undefined;
  const feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement> =
    {
      ...StrikingTarget.feet(context.entry),
      ...recovery.landings,
    };
  const { touchdown, release }: defendFootwork.ISchedule =
    defendFootwork.schedule(
      timing,
      {
        left: recovery.landings.left !== undefined,
        right: recovery.landings.right !== undefined,
      },
      checking,
      recovery.bearing,
    );
  return {
    touchdown,
    release,
    legs: (seconds: number): ReturnType<typeof StrikingStance.legs> => {
      const foot = (
        side: AutoMovieHumanSide,
      ): IAutoMovieMotionHumanFoot.IPlacement => {
        const placement: IAutoMovieMotionHumanFoot.IPlacement = feet[side];
        const rise: number = recovery.rise(side, seconds, touchdown[side]);
        return rise === 0
          ? placement
          : {
              ...placement,
              ankle: { ...placement.ankle, y: placement.ankle.y + rise },
            };
      };
      const down = (side: AutoMovieHumanSide): boolean =>
        defendFootwork.down(
          side,
          seconds,
          { touchdown, release },
          checking,
          timing.duration,
        );
      return StrikingStance.legs(
        context.body,
        { left: foot("left"), right: foot("right") },
        { left: down("left"), right: down("right") },
      );
    },
  };
}

/*
 * The landing a defence completes after a cut from an interrupted step.
 */
export namespace defendFootwork {
  /*
   * When each foot lands and when a checking leg leaves.
   */
  export interface ISchedule {
    /*
     * Each foot's touchdown, seconds; 0 for a foot already down.
     */
    touchdown: Record<AutoMovieHumanSide, number>;

    /*
     * The checking leg's release, seconds.
     */
    release: number;
  }

  /*
   * The footwork's schedule after a step: a landing foot touches down at the
   * defence's start or halfway through its movement, whichever is later; a
   * check by the bearing leg waits for that landing, any other leaves at the
   * start.
   * Parameter timing: The defence's start and movement, seconds.
   * Parameter landing: Which feet are still landing.
   * Parameter checking: The checking leg, if any.
   * Parameter bearing: The leg that bore the step, if any.
   * Returns: The schedule.
   */
  export function schedule(
    timing: Pick<defendGeometry.ITiming, "begin" | "movement">,
    landing: Record<AutoMovieHumanSide, boolean>,
    checking: AutoMovieHumanSide | undefined,
    bearing: AutoMovieHumanSide | undefined,
  ): ISchedule {
    const arrival: number = Math.max(timing.begin, 0.5 * timing.movement);
    return {
      touchdown: {
        left: landing.left ? arrival : 0,
        right: landing.right ? arrival : 0,
      },
      release:
        checking !== undefined && checking === bearing ? arrival : timing.begin,
    };
  }

  /*
   * Whether a foot bears at a second: once it has touched down, and for the
   * checking leg, not between its release and the defence's end.
   * Parameter side: The foot.
   * Parameter seconds: The defence's seconds.
   * Parameter schedule: The touchdowns and the release.
   * Parameter checking: The checking leg, if any.
   * Parameter duration: The defence's seconds in all.
   * Returns: Whether it bears.
   */
  export function down(
    side: AutoMovieHumanSide,
    seconds: number,
    schedule: ISchedule,
    checking: AutoMovieHumanSide | undefined,
    duration: number,
  ): boolean {
    return (
      seconds >= schedule.touchdown[side] &&
      (side !== checking || seconds <= schedule.release || seconds >= duration)
    );
  }

  /*
   * The landing a defence completes after a cut from an interrupted step,
   * shared by its waiting and reacting poses, on the defence's own clock.
   */
  export interface ISupport {
    /*
     * Each foot's touchdown second on the defence's clock; zero for a foot that
     * bears at the cut.
     */
    touchdown: Record<AutoMovieHumanSide, number>;

    /*
     * The second the checking leg may leave the floor, after the other foot has
     * landed.
     */
    release: number;

    /*
     * The displayed leg goals at a second of the defence.
     */
    legs(seconds: number): ReturnType<typeof StrikingStance.legs>;
  }
}
