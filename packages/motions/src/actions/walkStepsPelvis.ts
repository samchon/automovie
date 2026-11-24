import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanWalkFacing,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieMotionHumanWalkSteps,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { WalkPace } from "./WalkPace";
import type { WalkPath } from "./WalkPath";
import type { runStance } from "./runStance";
import { walkRoot } from "./walkRoot";
import { walkStepFoot } from "./walkStepFoot";
import { walkStride } from "./walkStride";

/**
 * A walk's feet and pelvis (`walkSteps.plan`): each footfall's straight push,
 * each foot's scheduled stance from its own footfalls, and the pelvis path,
 * progression with smooth start and stop, sway and bob, read from the plan's
 * input, body, footfalls, path, pace and timing.
 *
 * @param scope What the plan schedules its feet and pelvis from.
 * @returns The first left heel strike, each foot's footfalls and schedule, and
 *   the pelvis's path and stride amount.
 */
export function walkStepsPelvis(
  scope: walkStepsPelvis.IScope,
): walkStepsPelvis.IPelvis {
  const {
    input,
    body,
    start,
    placement,
    path,
    pace,
    flight,
    facing,
    inPlace,
    raised,
    steps,
    yawAt,
    T,
    swing,
    lag,
    first,
    last,
    front,
    progress,
    along$,
    faced$,
  }: walkStepsPelvis.IScope = scope;
  // The pelvis: progression with smooth start and stop, sway and bob.
  const firstLeft: number = steps.find(
    (s: IStep): boolean => s.side === "left",
  )!.heelStrike;
  // A flight gait's straight push is its stance's own (`runStance`).
  if (!inPlace)
    walkStepFoot.pushed(
      steps,
      start,
      yawAt,
      flight?.push ?? walkStepFoot.PUSH,
      input.gait?.stiff,
    );
  const gaitBob: IPlanGaitBob | undefined = flight?.bob ?? input.gait?.bob;
  // A cruising stance runs from a heel strike to the same foot's toe-off
  // two steps on: two periods less a swing.
  const typical: number = 2 * T - swing;
  const own: Record<AutoMovieHumanSide, IStep[]> = {
    left: steps.filter((s: IStep): boolean => s.side === "left"),
    right: steps.filter((s: IStep): boolean => s.side === "right"),
  };
  // A gait entered in stride swings the foot in the air from where it is (`walkStride`).
  const scheduled = (
    side: AutoMovieHumanSide,
  ): ((t: number) => IAutoMovieMotionHumanWalkFoot.IScheduled) =>
    walkStepFoot.schedule(
      body,
      side,
      start[side],
      own[side],
      typical,
      raised,
      inPlace,
      walkStride.flying(input.entry, side),
    );
  const schedules: Record<
    AutoMovieHumanSide,
    (t: number) => IAutoMovieMotionHumanWalkFoot.IScheduled
  > = { left: scheduled("left"), right: scheduled("right") };
  const foot: (
    side: AutoMovieHumanSide,
    t: number,
  ) => IAutoMovieMotionHumanWalkFoot.IScheduled = (
    side: AutoMovieHumanSide,
    t: number,
  ): IAutoMovieMotionHumanWalkFoot.IScheduled => schedules[side](t);
  const { root, amount }: Pick<IAutoMovieMotionHumanWalkSteps.IPlan, Plan2> =
    inPlace
      ? {
          root: (): IAutoMovieVector3 => ({ ...placement }),
          amount: (): number => 0,
        }
      : walkRoot({
          body,
          start: input.entry.posture.root,
          period: T,
          lag,
          first,
          last,
          front,
          swing,
          stop: steps.at(-2)!.heelStrike,
          firstLeft,
          bob: gaitBob,
          step: pace.stride,
          ...(gaitBob !== undefined || input.travel !== undefined || swing >= T
            ? {}
            : { walkingSpeed: pace.stride / T }),
          progress,
          yaw: yawAt,
          at: (s: number): IAutoMovieVector3 => path.at(s),
          heading: (s: number, point: IAutoMovieVector3): number =>
            facing === undefined ? along$(s) : faced$(point),
        });

  return { firstLeft, own, foot, root, amount };
}

/** What a walk's feet and pelvis read and what they are. */
export namespace walkStepsPelvis {
  /** What a walk plan schedules its feet and pelvis from. */
  export interface IScope {
    /** The walk's input. */
    input: IAutoMovieMotionHumanWalkSteps.IInput;

    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** Each foot's entered placement, laid flat. */
    start: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>;

    /** The entered pelvis. */
    placement: IAutoMovieVector3;

    /** The walk's path on the floor. */
    path: WalkPath;

    /** The walk's pace. */
    pace: WalkPace;

    /** A flight gait's stance, if the gait has flight. */
    flight: runStance.IStance | undefined;

    /** What the walk faces; its way when absent. */
    facing: IAutoMovieMotionHumanWalkFacing.IFacing | undefined;

    /** Whether the walk turns in place. */
    inPlace: boolean;

    /** A flight gait's held heel rise. */
    raised: number;

    /** The footfalls. */
    steps: walkStepFoot.IStep[];

    /**
     * The pelvis's heading at a second.
     *
     * @param t Action seconds.
     * @returns The heading, degrees.
     */
    yawAt: (t: number) => number;

    /** The step period, seconds. */
    T: number;

    /** The swing, seconds. */
    swing: number;

    /** The opening turn's time, seconds. */
    lag: number;

    /** The first toe-off, seconds. */
    first: number;

    /** The last heel strike, seconds. */
    last: number;

    /** The step periods a footprint lies ahead of its heel strike. */
    front: number;

    /**
     * The pelvis's distance along the path at a second.
     *
     * @param t Action seconds.
     * @returns The distance, metres.
     */
    progress: (t: number) => number;

    /**
     * The path's heading at a distance, nearest the starting heading.
     *
     * @param s The distance, metres.
     * @returns The heading, degrees.
     */
    along$: (s: number) => number;

    /**
     * The heading faced at a floor point, nearest the starting heading.
     *
     * @param at The floor point.
     * @returns The heading, degrees.
     */
    faced$: (at: IAutoMovieVector3) => number;
  }

  /** The feet's schedules and the pelvis's path. */
  export interface IPelvis {
    /** The first left heel strike, seconds. */
    firstLeft: number;

    /** Each foot's own footfalls. */
    own: Record<AutoMovieHumanSide, walkStepFoot.IStep[]>;

    /**
     * A foot's scheduled state at a second.
     *
     * @param side The foot.
     * @param t Action seconds.
     * @returns The scheduled state.
     */
    foot: (
      side: AutoMovieHumanSide,
      t: number,
    ) => IAutoMovieMotionHumanWalkFoot.IScheduled;

    /** The pelvis path (`IAutoMovieMotionHumanWalkSteps.IPlan.root`). */
    root: IAutoMovieMotionHumanWalkSteps.IPlan["root"];

    /** The stride's amount (`IAutoMovieMotionHumanWalkSteps.IPlan.amount`). */
    amount: IAutoMovieMotionHumanWalkSteps.IPlan["amount"];
  }
}

/** One footfall (`walkStepFoot.IStep`). */
type IStep = walkStepFoot.IStep;
/** The alternatives of `Plan2`'s site. */
type Plan2 = "root" | "amount";

/** The record of `IPlanGaitBob`'s site. */
type IPlanGaitBob = { mean: number; amplitude: number };
