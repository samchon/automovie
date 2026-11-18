import type {
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

/**
 * Measure cold planning and fixed-rate pose reads of an already staged test
 * performance when its label is requested in AUTOMOVIE_PROFILE_MOTION.
 *
 * @param label The authored case's stable name.
 * @param build Its ordinary performance construction, called once.
 * @param subjects The displayed performers whose poses the film needs.
 * @param action When supplied, read only the named action's visible span on the first subject.
 * @param props Held or moving props whose display frames the shot uses.
 * @returns The same performance used by the test.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the opt-in, interval, timing boundaries, units and reuse.
 * @evidence contracts/development/implementation.md#principled-implementation Captures process CPU and monotonic wall time around one real construction and separately around one pose call per selected subject per 30 Hz grid time, with the exact final endpoint.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure An unselected case does only its usual work. A selected case records plan and display independently.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the authored bodies, actions and solver bounds. Refused plans report their elapsed time without fabricating a duration. A failed display reports the observed sample count.
 * @evidence contracts/development/implementation.md#efficient-algorithms One construction, one pass over the requested film times and subjects, no sampling array.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Returns the same performance. Only the recorded test run requests additional frames.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No profile state survives the call. The performance remains owned by the normal caller.
 */
export function profileHumanMotion(
  label: string,
  build: Build,
  subjects: readonly string[],
  action?: string,
  props: readonly string[] = [],
): IAutoMovieMotionHumanPerformance {
  const selected: readonly string[] =
    process.env.AUTOMOVIE_PROFILE_MOTION?.split(",") ?? [];
  if (
    !selected.some(
      (name: string): boolean => label === name || label.startsWith(`${name}/`),
    )
  )
    return build();

  const before: IMark = mark();
  let film: IAutoMovieMotionHumanPerformance;
  try {
    film = build();
  } catch (error) {
    emit(label, "plan", before, undefined, undefined, 0, 0, error);
    throw error;
  }
  const segment: IAutoMovieMotionHumanSegment | undefined =
    action === undefined
      ? undefined
      : film
          .segments(subjects[0]!)
          .find(
            (part: IAutoMovieMotionHumanSegment): boolean =>
              part.name === action,
          );
  if (action !== undefined && segment === undefined) {
    emit(
      label,
      "plan",
      before,
      undefined,
      film.duration,
      0,
      0,
      new Error(`no placed motion ${action} for ${subjects[0]}`),
    );
    return film;
  }
  const from: number = segment?.entryTime ?? 0;
  const end: number = segment?.end ?? film.duration;
  const duration: number = end - from;
  emit(label, "plan", before, duration, film.duration, 0, 0);
  const started: IMark = mark();
  let posed: number = 0;
  let shownProps: number = 0;
  try {
    // The site's standard motion views use 30 frames per film second.
    const frequency: number = 30;
    if (!(Number.isFinite(duration) && duration > 0))
      throw new Error("the profiled action has no positive finite span");
    const show = (seconds: number): void => {
      for (const subject of subjects) {
        film.pose(subject, seconds);
        ++posed;
      }
      for (const prop of props) {
        film.prop(prop, seconds);
        ++shownProps;
      }
    };
    for (let i: number = 0; from + i / frequency < end; ++i)
      show(from + i / frequency);
    show(end);
    emit(label, "display", started, duration, film.duration, posed, shownProps);
  } catch (error) {
    emit(
      label,
      "display",
      started,
      duration,
      film.duration,
      posed,
      shownProps,
      error,
    );
  }
  return film;
}

/** Produces the same performance the test uses. */
type Build = () => IAutoMovieMotionHumanPerformance;

/** A monotonic wall and CPU reading at one boundary. */
interface IMark {
  /** Nanoseconds on the process's monotonic wall clock. */
  wall: bigint;

  /** Raw process CPU time in microseconds. */
  cpu: NodeJS.CpuUsage;
}

/** Read clocks immediately before one measured operation. */
function mark(): IMark {
  return { wall: process.hrtime.bigint(), cpu: process.cpuUsage() };
}

/** A measured operation of one motion case. */
type Phase = "plan" | "display";

/** Report elapsed seconds, explicit sample count and any refusal. */
function emit(
  label: string,
  phase: Phase,
  start: IMark,
  duration: number | undefined,
  filmDuration: number | undefined,
  poses: number,
  props: number,
  error?: unknown,
): void {
  const cpu: NodeJS.CpuUsage = process.cpuUsage(start.cpu);
  const wall: bigint = process.hrtime.bigint() - start.wall;
  console.log(
    JSON.stringify({
      motion: label,
      phase,
      duration,
      filmDuration,
      poses,
      props,
      cpuSeconds: (cpu.user + cpu.system) / 1e6,
      wallSeconds: Number(wall) / 1e9,
      ...(error === undefined
        ? {}
        : { error: error instanceof Error ? error.message : String(error) }),
    }),
  );
}
