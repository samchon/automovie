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
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
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
    const step: number = AutoMovieMotionHumanArmCourse.STEP;
    const begin: number = Math.ceil(clock.at("reachEnd") / step);
    const end: number = Math.floor(clock.at("release") / step);
    if (begin >= end) return original;
    if (!stretchHoldInputs(context) || context.params.kind === "neckSide")
      return original;

    const first: number = begin * step;
    const last: number = end * step;
    const removed: number = (end - begin) * step;
    const local = (seconds: number): number =>
      seconds <= first ? seconds : seconds <= last ? first : seconds - removed;
    const compressed: IAutoMovieMotionClock = AutoMovieMotionClock(
      local(clock.duration),
      clock.instants.map(
        (
          instant: IAutoMovieMotionClockInstant,
        ): IAutoMovieMotionClockInstant => ({
          name: instant.name,
          seconds: local(instant.seconds),
        }),
      ),
    );
    const compact: Plan = build(compressed, true);
    const actual: Reader = original.posture;
    const hold: Reader = (seconds, channels, resolution, projection) =>
      !prepareHumanPoseResolution.isNativeSource(resolution) ||
      (projection !== undefined && projection !== context.body.projection)
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
