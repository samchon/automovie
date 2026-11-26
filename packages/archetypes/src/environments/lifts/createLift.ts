import { AutoMovieEngineBuiltEnvironmentWorkflow } from "@automovie/engine";
import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieMotionHumanSupportTransfer,
  IAutoMovieSubjectContribution,
} from "@automovie/interface";

import { createElevator } from "../../architecture/createElevator";
import { buildLiftEnvironment } from "./buildLiftEnvironment";
import { liftObjectMotion } from "./liftObjectMotion";
import { liftStopHeights } from "./liftStopHeights";

/**
 * Define a lift whose cab, door panels and stopped landings can be staged
 * together by `createEnvironment`. Local +Y is up and +Z points out of the cab.
 * The module exports `<stop>` at the sill, `<stop>/approach` at the landing's
 * outer edge and `<stop>/call` on the fixed button. The cab and landing are
 * ordinary props with `floor` and aperture-width `sill` affordances. Their
 * existing motion-transfer inputs come from `transfer` for a checked open
 * interval.
 *
 * @param input Lift geometry, named stops and timeline in shot-local seconds.
 * @returns A reusable environment definition and its boarding query.
 * @throws If the timeline is invalid, or on placement if the stops or shaft are
 *   not aligned.
 */
export function createLift(input: createLift.IProps): createLift.IDefinition {
  const props: createLift.IProps = structuredClone(input);
  if (props.gap <= 0)
    throw new Error("Lift gap must be a positive finite number of metres.");
  if (props.landingDepth <= 0)
    throw new Error(
      "Lift landing depth must be a positive finite number of metres.",
    );
  const windows: Map<string, Interval[]> = prepareSchedule(props);
  const use: IAutoMovieEnvironmentModule = (
    context: IAutoMovieEnvironmentModule.IContext,
  ): IAutoMovieEnvironmentContribution => {
    const car: ReturnType<typeof createElevator> = createElevator(
      props.car,
      context.seed,
    );
    const stops: liftStopHeights.IStop[] = liftStopHeights(
      context,
      props.stops,
      car.affordance("entrance").height!,
    );
    const built: buildLiftEnvironment.IResult = buildLiftEnvironment({
      context,
      car,
      stops,
      gap: props.gap,
      landingDepth: props.landingDepth,
      first: props.schedule[0]!,
    });
    const lowered: IAutoMovieSubjectContribution = AutoMovieEngineBuiltEnvironmentWorkflow.lowerBuiltEnvironment(
      built.environment,
    );
    return {
      ...lowered,
      anchors: built.anchors,
      props: built.props,
      objectMotions: [
        liftObjectMotion(
          built.environment,
          car,
          stops,
          props.schedule,
          props.gap,
        ),
      ],
    };
  };
  const transfer = (crossing: createLift.ICrossing): createLift.ITransfer => {
    const { id, stop, direction, start, seconds, lead, landing } = crossing;
    if (!Object.hasOwn(props.stops, stop))
      throw new Error(`Lift ${id} has no stop named ${stop}.`);
    if (id.trim() !== id || id.length === 0)
      throw new Error("A transfer must name the lift's scoped instance id.");
    if (direction !== "board" && direction !== "exit")
      throw new Error(`Lift ${id} stop ${stop} requires boarding or exiting.`);
    if (
      seconds <= 0 ||
      !windows
        .get(stop)
        ?.some(
          (interval: Interval): boolean =>
            interval.from <= start && start + seconds <= interval.to,
        )
    )
      throw new Error(
        `Lift ${id} stop ${stop} is not fully open and docked throughout the transfer.`,
      );
    const cab: createLift.ISurface = {
      prop: `${id}/cab`,
      surface: "sill",
    };
    const pad: createLift.ISurface = {
      prop: `${id}/stops/${stop}/landing`,
      surface: "sill",
    };
    return {
      from: direction === "board" ? pad : cab,
      to: direction === "board" ? cab : pad,
      lead,
      seconds,
      ...(landing === undefined ? {} : { landing }),
    };
  };
  return Object.assign(use, { transfer });
}

/** One fully open stopped interval, inclusive at both ends, in shot seconds. */
type Interval = { from: number; to: number };

/** Admit the key clock and collect consecutive full-open windows per stop. */
function prepareSchedule(props: createLift.IProps): Map<string, Interval[]> {
  const keys: readonly createLift.IKey[] = props.schedule;
  if (keys.length < 2 || keys[0]!.seconds !== 0)
    throw new Error(
      "A lift schedule needs at least two keys and must start at shot second zero.",
    );
  const byStop: Map<string, Interval[]> = new Map();
  for (let i: number = 0; i < keys.length; ++i) {
    const key: createLift.IKey = keys[i]!;
    const before: createLift.IKey | undefined = keys[i - 1];
    if (!Object.hasOwn(props.stops, key.stop))
      throw new Error(
        `Lift schedule key ${i} names an unknown stop: ${key.stop}.`,
      );
    if (key.doors !== "open" && key.doors !== "closed")
      throw new Error(
        `Lift schedule key ${i} at ${key.stop} requires open or closed doors.`,
      );
    if (before !== undefined && key.seconds <= before.seconds)
      throw new Error(
        `Lift schedule key ${i} at ${key.stop} needs a finite, strictly increasing second.`,
      );
    if (before === undefined) continue;
    if (
      before.stop !== key.stop &&
      (before.doors !== "closed" || key.doors !== "closed")
    )
      throw new Error(
        `Lift travel from ${before.stop} to ${key.stop} requires closed doors at both keys.`,
      );
    if (before.doors !== "open" || key.doors !== "open") continue;
    const windows: Interval[] = byStop.get(key.stop) ?? [];
    const previous: Interval | undefined = windows[windows.length - 1];
    if (previous?.to === before.seconds) previous.to = key.seconds;
    else windows.push({ from: before.seconds, to: key.seconds });
    byStop.set(key.stop, windows);
  }
  return byStop;
}

/** The lift definition's authorable geometry, stop clock and crossing contracts. */
export namespace createLift {
  /**
   * The sill height relative to the module, or a named world sill to align.
   * Numeric heights use metres. A referenced sill must lie on the shaft axis
   * with the same upright orientation and landing direction.
   */
  export type Stop = number | { anchor: string };

  /**
   * One commanded stopped position at a full door state, on the shot clock. The
   * doors stay closed while the cab travels between stops. At one stop the cab
   * stays still and the doors interpolate between the keyed states.
   */
  export interface IKey {
    /** Finite shot-local second, strictly increasing from zero. */
    seconds: number;

    /** Key of the sill the cab reaches at this second. */
    stop: string;

    /** The two door layers' state at this second. */
    doors: "closed" | "open";
  }

  /**
   * Authorable shaft and schedule settings. The stock car determines the
   * aperture for both door layers. Adjacent sills must be farther apart than
   * the door height for their openings to fit.
   */
  export interface IProps {
    /**
     * At least two named local-height or anchor constraints on one vertical
     * shaft.
     */
    stops: Readonly<Record<string, Stop>>;

    /** At least two keys from time zero, in strictly increasing seconds. */
    schedule: readonly IKey[];

    /**
     * Metres between the cab floor edge and the fixed landing edge, greater
     * than the cab leaf depth.
     */
    gap: number;

    /** Positive landing floor depth beyond its edge, metres along local +Z. */
    landingDepth: number;

    /** The catalogue car choices. The composer owns the instance id. */
    car?: Omit<createElevator.IParams, "id">;
  }

  /**
   * A prop surface selector of the support-transfer grammar: a prop subject id
   * and its surface affordance id.
   */
  export type ISurface = IAutoMovieMotionHumanSupportTransfer.ISurface;

  /**
   * The foot, duration and destination station a crossing hands to the
   * support-transfer grammar unchanged.
   */
  export type ITiming = Pick<
    IAutoMovieMotionHumanSupportTransfer,
    "lead" | "seconds" | "landing"
  >;

  /**
   * The support-transfer input `transfer` returns: both surfaces plus the
   * crossing's foot, duration and station. Docking is left at its stationary
   * default.
   */
  export type ITransfer = Pick<
    IAutoMovieMotionHumanSupportTransfer,
    "from" | "to" | "lead" | "seconds" | "landing"
  >;

  /**
   * One shot-local transfer between the named landing and cab surfaces. The
   * stop and time select a docked window. The leading foot and optional
   * destination-surface coordinates use the existing support-transfer grammar.
   */
  export interface ICrossing extends ITiming {
    /** Scoped id of the placed lift module, including the environment name. */
    id: string;

    /** Name of the landing to cross. */
    stop: string;

    /** Whether the landing or cab supplies the entry support. */
    direction: "board" | "exit";

    /** Shot-local second at which this stationary transfer starts. */
    start: number;
  }

  /**
   * A reusable callable lift module with a boarding admission query. The same
   * schedule drives the placed lift and checks timing for a crossing of any
   * occurrence. The support-transfer law checks the actor's motion.
   */
  export interface IDefinition extends IAutoMovieEnvironmentModule {
    /**
     * Turn an authored crossing into an existing support-transfer input.
     *
     * @param crossing The occurrence, stop, direction and planned interval.
     * @returns The two support selectors and existing transfer parameters.
     * @throws When the known stop is not open and docked during that interval.
     */
    transfer(crossing: ICrossing): ITransfer;
  }
}
