import { AutoMovieEngineBuiltEnvironmentWorkflow } from "@automovie/engine";
import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieSubjectContribution,
} from "@automovie/interface";

import { AutoMovieArchetypeElevator } from "../../architecture/AutoMovieArchetypeElevator";
import type { AutoMovieArchetypeEnvironment } from "../AutoMovieArchetypeEnvironment";
import { buildLiftEnvironment } from "./buildLiftEnvironment";
import { liftStopHeights } from "./internal/liftStopHeights";
import { liftObjectMotion } from "./liftObjectMotion";

/*
 * Define a lift whose cab, door panels and stopped landings can be staged
 * together by `createEnvironment`. Local +Y is up and +Z points out of the cab.
 * The module exports `<stop>` at the sill, `<stop>/approach` at the landing's
 * outer edge and `<stop>/call` on the fixed button. The cab and landing are
 * ordinary props with `floor` and aperture-width `sill` affordances. Their
 * existing motion-transfer inputs come from `transfer` for a checked open
 * interval.
 * Parameter input: Lift geometry, named stops and timeline in shot-local seconds.
 * Returns: A reusable environment definition and its boarding query.
 * If the timeline is invalid, or on placement if the stops or shaft are
 * not aligned.
 */
export function createLift(
  input: AutoMovieArchetypeEnvironment.ILiftProps,
): AutoMovieArchetypeEnvironment.ILiftDefinition {
  const props: AutoMovieArchetypeEnvironment.ILiftProps =
    structuredClone(input);
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
    const car: ReturnType<typeof AutoMovieArchetypeElevator.create> =
      AutoMovieArchetypeElevator.create(props.car, context.seed);
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
    const lowered: IAutoMovieSubjectContribution =
      AutoMovieEngineBuiltEnvironmentWorkflow.lowerBuiltEnvironment(
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
  const transfer = (
    crossing: AutoMovieArchetypeEnvironment.ILiftCrossing,
  ): AutoMovieArchetypeEnvironment.ILiftTransfer => {
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
    const cab: AutoMovieArchetypeEnvironment.ILiftSurface = {
      prop: `${id}/cab`,
      surface: "sill",
    };
    const pad: AutoMovieArchetypeEnvironment.ILiftSurface = {
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

/*
 * One fully open stopped interval, inclusive at both ends, in shot seconds.
 */
type Interval = { from: number; to: number };

/*
 * Admit the key clock and collect consecutive full-open windows per stop.
 */
function prepareSchedule(
  props: AutoMovieArchetypeEnvironment.ILiftProps,
): Map<string, Interval[]> {
  const keys: readonly AutoMovieArchetypeEnvironment.ILiftKey[] =
    props.schedule;
  if (keys.length < 2 || keys[0]!.seconds !== 0)
    throw new Error(
      "A lift schedule needs at least two keys and must start at shot second zero.",
    );
  const byStop: Map<string, Interval[]> = new Map();
  for (let i: number = 0; i < keys.length; ++i) {
    const key: AutoMovieArchetypeEnvironment.ILiftKey = keys[i]!;
    const before:
      | AutoMovieArchetypeEnvironment.ILiftKey
      | undefined = keys[i - 1];
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
