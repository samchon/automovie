import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmTrajectory,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
} from "@automovie/interface";

import type { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import { HumanArmTrajectoryStretch } from "../posture/HumanArmTrajectoryStretch";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { AutoMovieMotionHumanArmObservation } from "./AutoMovieMotionHumanArmObservation";
import { AutoMovieMotionHumanArmPlanned } from "./AutoMovieMotionHumanArmPlanned";

/**
 * One arm's course over a stretch of a hold a caller continues in closed form,
 * planned by trajectory optimisation where that continuation loses the
 * admissible swivel it held: from the arm the caller continued at the stretch's
 * first instant, through the hand's goal at every instant of it, to the arm the
 * caller continues again at the last, or to the goal there where nothing
 * follows. The goal's site and the base it is read against are the arm
 * planner's own (`AutoMovieMotionHumanArmObservation.site`, `based`), so the
 * stretch keeps the same body clear the whole course keeps.
 */
export namespace AutoMovieMotionHumanArmStretch {
  /**
   * The stretch and what it is read on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, its frame and unit.
   * @evidence contracts/development/design.md#principled-representation Seconds of the caller's plan, clinical arm angles, posed bodies and limb goals, the planner's own records.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What a stretch's problem is read from.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The goal is the caller's own; no site or base is built here but the planner's.
   */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The arm. */
    side: AutoMovieHumanSide;

    /** The stretch's first second, where the caller's continuation last held. */
    from: number;

    /**
     * The stretch's last second, where the caller's continuation holds again,
     * or its hold's end.
     */
    to: number;

    /** The arm the caller continued at `from`. */
    start: IAutoMovieMotionHumanArmAngles.IAngles;

    /**
     * The arm the caller continues at `to`, which the course rejoins; the
     * course ends on the goal at `to` when absent.
     */
    end?: IAutoMovieMotionHumanArmAngles.IAngles;

    /** The body posed at a second of the stretch, the arm's own angles aside. */
    at: (seconds: number) => IAutoMoviePose;

    /** The hand's goal at a second of the stretch. */
    aimed: (seconds: number) => IAutoMovieHumanLimbGoal;

    /**
     * The skin distance the hand keeps and its contact disc, as the arm's carry
     * states them; the planner's defaults when absent.
     */
    carry?: Omit<AutoMovieMotionHumanArmObservation.ISited, "side">;

    /**
     * The plan's exact forward-kinematics source, borrowed for a goal on a
     * bone.
     */
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0];
  }

  /**
   * The arm's course over the stretch.
   *
   * @param props The stretch.
   * @returns The arm at any second of the stretch, held at its ends outside it.
   * @throws {HumanRefusal} When no course over the stretch is admitted on its
   *   frame grid, naming the worst miss.
   * @evidence contracts/development/common.md#meaningful-documentation States the result, its span and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The planner's sites and bases on the stretch's seconds, solved by TrajOpt alone (`HumanArmTrajectoryStretch.plan`), its first knots a hold's least waypoints a second (`AutoMovieMotionHumanArmPlanned.LEAST`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One problem reader and one solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every instant of the stretch carries its site; the last's is dropped only where `end` fixes the arm there.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost class: one stretch solve; each second's site and base read once however often the refinement reads it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A second's site and base are one record across the solve's readings, so the context builds its waypoint on them once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned reader retains only the solve's setups, knots and coordinates; the per-second records are released with the solve.
   */
  export function plan(
    props: IProps,
  ): IAutoMovieMotionHumanArmTrajectory.Trajectory {
    const { from, to } = props;
    const sited: AutoMovieMotionHumanArmObservation.ISited = {
      side: props.side,
      ...props.carry,
    };
    const sites: Map<number, HumanArmTrajectory.ISite> = new Map();
    const bases: Map<number, HumanArmTrajectory.IProblem["bases"][number]> =
      new Map();
    const site = (t: number): HumanArmTrajectory.ISite => {
      let found: HumanArmTrajectory.ISite | undefined = sites.get(t);
      if (found === undefined)
        sites.set(
          t,
          (found = AutoMovieMotionHumanArmObservation.site(
            props.body,
            props.at(t),
            sited,
            props.aimed(t),
            props.resolution,
          )),
        );
      return found;
    };
    const base = (t: number): HumanArmTrajectory.IProblem["bases"][number] => {
      let found: HumanArmTrajectory.IProblem["bases"][number] | undefined =
        bases.get(t);
      if (found === undefined)
        bases.set(
          t,
          (found = AutoMovieMotionHumanArmObservation.based(
            props.at(t),
            [props.aimed(t)],
            [true],
          )),
        );
      return found;
    };
    const read = (times: readonly number[]): HumanArmTrajectory.IProblem => ({
      body: props.body,
      times,
      // The whole stretch lies on the hold.
      share: (): number => 1,
      bases: times.map(base),
      arms: [
        {
          side: props.side,
          rest: props.start,
          ...(props.end === undefined ? {} : { back: props.end }),
          sites: times.map(
            (t: number, k: number): HumanArmTrajectory.ISite | undefined =>
              props.end !== undefined && k === times.length - 1
                ? undefined
                : site(t),
          ),
        },
      ],
    });
    const pieces: number = Math.max(
      1,
      Math.ceil((to - from) * AutoMovieMotionHumanArmPlanned.LEAST),
    );
    const knots: number[] = [];
    for (let j: number = 0; j <= pieces; ++j)
      knots.push(from + ((to - from) * j) / pieces);
    return HumanArmTrajectoryStretch.plan(read, knots).trajectories[0]!;
  }
}
