import { sampleClip } from "@automovie/engine";
import type { IAutoMovieClip } from "@automovie/interface";

/**
 * Reusable preparation, delivery and recovery clock backed by the public clip sampler.
 *
 * @evidence contracts/common.md#implementation-and-ownership Each instance owns one scalar cubic clip with neutral/start, peak and neutral/end keys. Engine sampleClip owns interpolation; no actor identity, bout duration or absolute first15 event enters the definition.
 * @evidence contracts/common.md#authoring-interface Caller times are finite seconds with start < peak < end. Weight is zero outside the request, and completion means only recovery weight returned to zero.
 */
export class MotionPhase {
  /** Independently owned generic clip; its pointer is consumed here as a scalar blend weight. */
  public readonly clip: IAutoMovieClip;
  /** Immutable caller placement of this motion instance. */
  public readonly timing: Readonly<MotionPhase.Timing>;
  /** Prepare one clip whose own clock begins at zero. */
  public constructor(id: string, timing: MotionPhase.Timing) {
    if (
      ![timing.start, timing.peak, timing.end].every(Number.isFinite) ||
      !(timing.start < timing.peak && timing.peak < timing.end)
    )
      throw new Error(
        "Motion timing requires finite ordered preparation, delivery and recovery",
      );
    this.timing = Object.freeze({ ...timing });
    this.clip = {
      id,
      name: null,
      duration: timing.end - timing.start,
      loop: false,
      tracks: [
        {
          channel: {
            kind: "pointer",
            pointer: "/blendWeight",
            valueType: "scalar",
          },
          times: [0, timing.peak - timing.start, timing.end - timing.start],
          values: [0, 0, 0, 0, 1, 0, 0, 0, 0],
          interpolation: "cubicspline",
        },
      ],
    };
  }
  /**
   * Sample the same generic recovery clip for any actor or target.
   * @evidence contracts/common.md#implementation-and-ownership Public sampleClip reads this instance's own local clock and scalar channel; returned values are not shared between instances.
   * @evidence contracts/common.md#authoring-interface Seconds before preparation or after recovery give zero; no support or contact acceptance follows from a weight.
   */
  public weight(seconds: number): number {
    if (seconds <= this.timing.start || seconds >= this.timing.end) return 0;
    return sampleClip(this.clip, seconds - this.timing.start).get(
      "ptr:/blendWeight",
    )!.value[0]!;
  }
  /**
   * Smooth local endpoint easing for non-clip geometric foot phases.
   * @evidence contracts/common.md#implementation-and-ownership One clamped cubic polynomial serves caller-supplied normalized progress; no actor or film clock is retained.
   * @evidence contracts/common.md#authoring-interface Input is dimensionless and output lies in [0,1]. This is staging interpolation, not a physical trajectory proof.
   */
  public static ease(value: number): number {
    const u: number = Math.max(0, Math.min(1, value));
    return u * u * (3 - 2 * u);
  }
}

/** Shared local timing contract for independently placed technique instances. */
export namespace MotionPhase {
  /**
   * Preparation, delivery peak and completed recovery in caller seconds.
   * @evidence contracts/common.md#implementation-and-ownership The instance copies and validates all three boundaries before making its generic clip.
   * @evidence contracts/common.md#authoring-interface Values are finite seconds, independent of actor identity and any particular film duration.
   */
  export interface Timing {
    /** Preparation. */ start: number;
    /** Delivery. */ peak: number;
    /** Recovery. */ end: number;
  }
}
