import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanSabre,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanSabreForm } from "./HumanSabreForm";

/*
 * Admit a mounted sabre's carry and charge: the carry has some length and the
 * charge's transition to the engage takes some time within one gallop stride
 * (`HumanSabreForm.STRIDE`).
 * Parameter params: The carry's seconds and the charge's transition.
 * When either has no length or the transition is longer
 * than a stride.
 */
export function humanSabreCharge(
  params: Pick<IAutoMovieMotionHumanSabre, "duration" | "transition">,
): void {
  HumanBound.above("duration", params.duration, 0, "s");
  HumanBound.above("transition", params.transition, 0, "s");
  if (params.transition > HumanSabreForm.STRIDE)
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "transition",
      value: params.transition,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: HumanSabreForm.STRIDE,
        unit: "s",
      },
      reason: "a charge comes to the engage within one gallop stride",
      fix: `take the engage in at most ${HumanSabreForm.STRIDE} s`,
    });
}

/*
 * The sabre's charge.
 */
export namespace humanSabreCharge {
  /*
   * The charge's cues: `charge` where it starts and `engaged` a transition
   * later, each clamped to the carry; none without a charge.
   * Parameter params: The carry's seconds and the charge's transition.
   * Parameter from: The charge's start, seconds; none for a carry alone.
   * Returns: The cues.
   */
  export function events(
    params: Pick<IAutoMovieMotionHumanSabre, "duration" | "transition">,
    from: number | undefined,
  ): IAutoMovieMotionEvent[] {
    return from === undefined
      ? []
      : [
          { name: "charge", share: Math.min(1, from / params.duration) },
          {
            name: "engaged",
            share: Math.min(1, (from + params.transition) / params.duration),
          },
        ];
  }
}
