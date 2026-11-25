import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanStretch,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArmCourse } from "../compose/AutoMovieMotionHumanArmCourse";
import { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";
import { stretchHoldInputs } from "./stretchHoldInputs";

/**
 * The original plan's own reader and the exact location wrapper placement gave
 * it.
 */
type Plan = IAutoMovieMotionHumanActionPlan;
type Reader = Plan["posture"];
type Build = (clock: IAutoMovieMotionClock, prepared: boolean) => Plan;
type Context =
  IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStretch.IParams>;
/**
 * A standing stretch holds one material pose between the two movement phases.
 * Preserve the original grid cells straddling arrival and release. Only
 * complete grid intervals inside the hold collapse onto a single contact
 * event.
 */
export namespace stretchHoldClock {
  /** A stretch clock with its hold collapsed (`compress`). */
  export interface ICompressed {
    /** The hold's first whole grid second, between arrival and release. */
    first: number;

    /** Its last whole grid second. */
    last: number;

    /** The compressed second of an original one. */
    local: (seconds: number) => number;

    /** The clock with every instant at its compressed second. */
    clock: IAutoMovieMotionClock;
  }

  /**
   * Collapse the whole grid intervals of a stretch's hold onto its first one:
   * the grid cells straddling `reachEnd` and `release` are kept, every second
   * from the first whole grid second inside the hold to the last reads that
   * first one, and every second after reads the collapsed length earlier.
   *
   * @param clock The stretch's clock.
   * @param step The grid's spacing, seconds.
   * @returns The collapse, or none when no whole grid interval lies inside the
   *   hold.
   */
  export function compress(
    clock: IAutoMovieMotionClock,
    step: number,
  ): ICompressed | undefined {
    const begin: number = Math.ceil(clock.at("reachEnd") / step);
    const end: number = Math.floor(clock.at("release") / step);
    if (begin >= end) return undefined;
    const first: number = begin * step;
    const last: number = end * step;
    const removed: number = (end - begin) * step;
    const local = (seconds: number): number =>
      seconds <= first ? seconds : seconds <= last ? first : seconds - removed;
    return {
      first,
      last,
      local,
      clock: AutoMovieMotionClock(
        local(clock.duration),
        clock.instants.map(
          (
            instant: IAutoMovieMotionClockInstant,
          ): IAutoMovieMotionClockInstant => ({
            name: instant.name,
            seconds: local(instant.seconds),
          }),
        ),
      ),
    };
  }

  /**
   * Issue an ordinary plan and its bounded internal phase clock for a bare
   * standing stretch.
   */
  export function plan(
    context: Context,
    clock: IAutoMovieMotionClock,
    build: Build,
  ): Plan {
    const original: Plan = build(clock, false);
    const held: ICompressed | undefined = compress(
      clock,
      AutoMovieMotionHumanArmCourse.STEP,
    );
    if (held === undefined) return original;
    if (!stretchHoldInputs(context) || context.params.kind === "neckSide")
      return original;
    const { first, last, local }: ICompressed = held;
    const compact: Plan = build(held.clock, true);
    const actual: Reader = original.posture;
    const hold: Reader = (seconds, channels, resolution, projection) =>
      projection !== undefined && projection !== context.body.projection
        ? actual(seconds, channels, resolution, projection)
        : compact.posture(local(seconds), channels, resolution, projection);

    // A raw read without an outside solver sees this law's unlayered posture.
    // The display separately proves the absence of interacting motion layers.
    const raw: Reader = (seconds, channels, resolution, projection) =>
      resolution === undefined && projection === undefined
        ? hold(seconds, channels)
        : actual(seconds, channels, resolution, projection);
    original.posture = raw;
    HumanPreparedPlayback.attach(original, context.body, {
      mode: "bare-posture",
      phases: [
        {
          from: 0,
          to: clock.duration,
          sample: (
            ...args: Parameters<Reader>
          ): HumanPreparedPlayback.ISample => ({
            posture: hold(...args),
          }),
        },
      ],
    });
    const window: readonly [number, number] = [first, last];
    Object.defineProperty(original, "still", {
      configurable: true,
      get: (): readonly [number, number] | undefined =>
        HumanPreparedPlayback.owns(original, original.posture)
          ? window
          : undefined,
      set: (value: Plan["still"]): void => {
        Object.defineProperty(original, "still", {
          configurable: true,
          enumerable: true,
          writable: true,
          value,
        });
      },
    });
    return original;
  }
}
