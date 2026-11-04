import { sampleClip } from "@automovie/engine";
import type { IAutoMovieClip } from "@automovie/interface";

import type { MotionAction } from "./MotionAction";

/**
 * Local phase clock with separately measurable delivery and retraction.
 *
 * @evidence contracts/common.md#implementation-and-ownership Ordered half-open phases consume caller durations. A detected contact replaces the planned delivery endpoint; no contact is fabricated. The Engine scalar clip supplies endpoint easing. Work and temporary storage are constant, with one immutable easing clip retained.
 * @evidence contracts/common.md#authoring-interface Durations are seconds, with positive delivery/retraction and nonnegative preparation/contact/settling. A contact timestamp must lie inside delivery. A clock phase alone never asserts a collision.
 */
export namespace ActionClock {
  /**
   * Current local phase and continuous delivery envelope.
   * @evidence contracts/common.md#implementation-and-ownership One finite clock result exposes phase, linear progress, eased extent and interrupted total duration independently.
   * @evidence contracts/common.md#authoring-interface Progress/weight are [0,1] and duration is local seconds; the host retains actual constrained pose at contact.
   */
  export interface State {
    /** Current half-open phase, including explicit idle/complete boundaries. */
    phase: MotionAction.Phase;
    /** Linear closed-unit progress through this phase. */
    progress: number;
    /** Delivery extent: zero before delivery, one at contact, zero after retraction. */
    weight: number;
    /** Actual total local duration, shortened when delivery is intercepted. */
    duration: number;
  }
  /**
   * Validate and total the explicit phases without retaining caller data.
   *
   * @evidence contracts/common.md#implementation-and-ownership Finite duration checks precede summation; only delivery and retraction must be positive. The finite sum check also refuses overflow.
   * @evidence contracts/common.md#authoring-interface Returns seconds and throws on negative, nonfinite, zero delivery/retraction, or overflowing durations.
   */
  export function duration(timing: MotionAction.Timing): number {
    const values: number[] = [
      timing.preparation,
      timing.delivery,
      timing.contact,
      timing.retraction,
      timing.recovery,
    ];
    const total: number = values.reduce(
      (sum: number, value: number): number => sum + value,
      0,
    );
    if (
      !values.every(
        (value: number): boolean => Number.isFinite(value) && value >= 0,
      ) ||
      timing.delivery <= 0 ||
      timing.retraction <= 0 ||
      !Number.isFinite(total)
    )
      throw new Error(
        "Action phases require finite nonnegative durations and positive delivery/retraction",
      );
    return total;
  }
  /**
   * Sample immutable local timing, optionally interrupted by observed contact.
   *
   * @evidence contracts/common.md#implementation-and-ownership A fixed ordered phase scan skips zero-duration phases and selects the right-hand phase at every boundary. Before the detected instant, delivery progress uses its original duration, so knowledge of future contact cannot change the earlier path. Contact shortens delivery only; release and return retain their independently authored durations. Seeking has no retained integration state.
   * @evidence contracts/common.md#authoring-interface Elapsed seconds may be negative for idle. Contact time is optional local seconds inside the closed delivery interval. Contact phase without an event is authored timing, not a hit claim.
   */
  export function sample(
    timing: MotionAction.Timing,
    elapsed: number,
    contactTime?: number,
  ): State {
    const nominal: number = duration(timing);
    if (!Number.isFinite(elapsed))
      throw new Error("Action clock requires finite local seconds");
    const planned: number = timing.preparation + timing.delivery;
    if (
      contactTime !== undefined &&
      (!Number.isFinite(contactTime) ||
        contactTime < timing.preparation ||
        contactTime > planned)
    )
      throw new Error(
        "Contact must occur during this action's delivery interval",
      );
    const hit: number = contactTime ?? planned;
    const total: number = nominal - (planned - hit);
    if (elapsed < 0)
      return { phase: "idle", progress: 0, weight: 0, duration: total };
    if (elapsed >= total)
      return { phase: "complete", progress: 1, weight: 0, duration: total };
    const phases: [MotionAction.Phase, number][] = [
      ["preparation", timing.preparation],
      ["delivery", hit - timing.preparation],
      ["contact", timing.contact],
      ["retraction", timing.retraction],
      ["recovery", timing.recovery],
    ];
    let begin: number = 0;
    for (const [phase, span] of phases) {
      if (span > 0 && elapsed < begin + span) {
        const progress: number = Math.max(
          0,
          Math.min(
            1,
            (elapsed - begin) / (phase === "delivery" ? timing.delivery : span),
          ),
        );
        const weight: number =
          phase === "delivery"
            ? ease(progress)
            : phase === "contact"
              ? 1
              : phase === "retraction"
                ? 1 - ease(progress)
                : 0;
        return { phase, progress, weight, duration: total };
      }
      begin += span;
    }
    return { phase: "complete", progress: 1, weight: 0, duration: total };
  }
  /**
   * Smooth endpoint interpolation through the public Engine clip sampler.
   *
   * @evidence contracts/common.md#implementation-and-ownership A shared two-key zero-tangent cubic scalar clip gives the conventional smoothstep law without per-request track construction. Sampling allocates only the Engine's scalar result and keeps no caller state.
   * @evidence contracts/common.md#authoring-interface Finite dimensionless progress is clamped to [0,1]; output has zero endpoint slope and does not prove physical acceleration limits.
   */
  export function ease(progress: number): number {
    if (!Number.isFinite(progress))
      throw new Error("Action easing requires finite progress");
    return sampleClip(EASING, Math.max(0, Math.min(1, progress))).get(
      "ptr:/weight",
    )!.value[0]!;
  }
}

/** One immutable unit interval scalar clip, reused for every action instance. */
const EASING: IAutoMovieClip = {
  id: "motion-action-easing",
  name: null,
  duration: 1,
  loop: false,
  tracks: [
    {
      channel: { kind: "pointer", pointer: "/weight", valueType: "scalar" },
      times: [0, 1],
      values: [0, 0, 0, 0, 1, 0],
      interpolation: "cubicspline",
    },
  ],
};
