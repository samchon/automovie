import type {
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

/**
 * Measure cold planning and fixed-rate pose reads of an already staged test
 * performance when its label is requested in AUTOMOVIE_PROFILE_MOTION.
 *
 * The terminal record reports totalWallSeconds from construction through the
 * last 30 Hz frame or exact endpoint. Refusals propagate after recording
 * completed frames and successful subject and prop reads, including a partial
 * frame.
 *
 * @param label The authored case's stable name.
 * @param build Its ordinary performance construction, called once.
 * @param subjects The displayed performers whose poses the film needs.
 * @param action When supplied, read only the named action's visible span on the
 *   first subject.
 * @param props Held or moving props whose display frames the shot uses.
 * @returns The same performance used by the test.
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

  console.log(JSON.stringify({ motion: label, phase: "plan-start" }));
  let displayStart: IMark | undefined;
  let duration: number | undefined;
  let filmDuration: number | undefined;
  let frames: number = 0;
  let poses: number = 0;
  let shownProps: number = 0;
  let failure: unknown;
  let failed: boolean = false;
  const before: IMark = mark();
  try {
    const film: IAutoMovieMotionHumanPerformance = build();
    filmDuration = film.duration;
    const segment: IAutoMovieMotionHumanSegment | undefined =
      action === undefined
        ? undefined
        : film
            .segments(subjects[0]!)
            .find(
              (part: IAutoMovieMotionHumanSegment): boolean =>
                part.name === action,
            );
    if (action !== undefined && segment === undefined)
      throw new Error(`no placed motion ${action} for ${subjects[0]}`);
    const from: number = segment?.entryTime ?? 0;
    const end: number = segment?.end ?? filmDuration;
    duration = end - from;
    if (!(duration > 0))
      throw new Error("the profiled action has no positive finite span");

    displayStart = mark();
    const show = (seconds: number): void => {
      for (const subject of subjects) {
        film.pose(subject, seconds);
        ++poses;
      }
      for (const prop of props) {
        film.prop(prop, seconds);
        ++shownProps;
      }
      ++frames;
    };
    for (let i: number = 0; from + i / 30 < end; ++i) show(from + i / 30);
    show(end);
    return film;
  } catch (error) {
    failed = true;
    failure = error;
    throw error;
  } finally {
    const finished: IMark = mark();
    const error: string | undefined = failed
      ? failure instanceof Error
        ? failure.message
        : String(failure)
      : undefined;
    const planEnd: IMark = displayStart ?? finished;
    console.log(
      JSON.stringify({
        motion: label,
        phase: "plan",
        duration,
        filmDuration,
        frames: 0,
        poses: 0,
        props: 0,
        ...elapsed(before, planEnd),
        ...(displayStart === undefined
          ? {
              error,
              totalWallSeconds: Number(finished.wall - before.wall) / 1e9,
            }
          : {}),
      }),
    );
    if (displayStart !== undefined)
      console.log(
        JSON.stringify({
          motion: label,
          phase: "display",
          duration,
          filmDuration,
          frames,
          poses,
          props: shownProps,
          ...elapsed(displayStart, finished),
          error,
          totalWallSeconds: Number(finished.wall - before.wall) / 1e9,
        }),
      );
  }
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

/** Elapsed process CPU and monotonic wall seconds for a profile phase. */
interface IElapsed {
  /** User and system CPU time across the process. */
  cpuSeconds: number;
  /** Real time between the two phase boundaries. */
  wallSeconds: number;
}

/** Convert captured boundaries to seconds after display and planning finish. */
function elapsed(start: IMark, end: IMark): IElapsed {
  return {
    cpuSeconds:
      (end.cpu.user - start.cpu.user + end.cpu.system - start.cpu.system) / 1e6,
    wallSeconds: Number(end.wall - start.wall) / 1e9,
  };
}
