import type { IAutoMovieMotionHumanSpacecraftGlide } from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/** Admit the three transfer phases and prepare the pure distance course. */
export function spacecraftGlideClock(
  props: spacecraftGlideClock.IPhases,
): spacecraftGlideClock.IClock {
  const { ramp, coast } = props;
  const catchAt: number = ramp + coast;
  const duration: number = catchAt + ramp;
  if (
    !(ramp > 0 && catchAt > ramp && duration > catchAt) ||
    !Number.isFinite(duration)
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "clock",
      value: { ramp, coast },
      reason: "the push, coast and brake require positive finite durations",
      fix: "give ramp and coast in positive seconds with a finite transfer duration",
    });

  return {
    catchAt,
    duration,
    prepare: (distance: number): spacecraftGlideClock.ICourse => {
      const speed: number = distance / catchAt;
      const rampDistance: number = 0.5 * speed * ramp;
      return {
        rampDistance,
        sample: (seconds: number): spacecraftGlideClock.ISample => {
          const time: number = Math.max(0, Math.min(duration, seconds));
          const coastShare: number = Math.max(
            0,
            Math.min(1, (time - ramp) / coast),
          );
          const travel: number =
            time <= ramp
              ? rampDistance * (time / ramp) ** 2
              : time >= catchAt
                ? distance - rampDistance * ((duration - time) / ramp) ** 2
                : rampDistance + speed * (time - ramp);
          return {
            time,
            coastShare,
            travel,
            open: 16 * coastShare ** 2 * (1 - coastShare) ** 2,
          };
        },
      };
    },
  };
}

/** Timing and sampled motion of an admitted cabin transfer. */
export namespace spacecraftGlideClock {
  /** Author-provided durations of a ramp and of the coast between ramps. */
  export type IPhases = Pick<
    IAutoMovieMotionHumanSpacecraftGlide,
    "ramp" | "coast"
  >;

  /** Phase boundaries before the rail centres are placed. */
  export interface IClock {
    /** Time the arrival handrail is caught, seconds. */
    catchAt: number;

    /** Transfer duration, seconds. */
    duration: number;

    /** Prepare travel for the placed rails' separation in metres. */
    prepare(distance: number): ICourse;
  }

  /** Preparation shared by reach admission and time sampling. */
  export interface ICourse {
    /** Distance covered over each push or brake ramp, metres. */
    rampDistance: number;

    /** Read the pure path at the specified action second. */
    sample(seconds: number): ISample;
  }

  /** One analytic position on the transfer's clock. */
  export interface ISample {
    /** Read time clamped to the transfer, seconds. */
    time: number;

    /** Progress through the coast alone, held at its ends. */
    coastShare: number;

    /** Root displacement from departure, metres. */
    travel: number;

    /** Symmetric opening share with zero slope at both rail contacts. */
    open: number;
  }
}
