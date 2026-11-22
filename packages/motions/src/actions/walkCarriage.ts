import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";

import { HumanArmSwing } from "../posture/HumanArmSwing";

/**
 * The arm carriage of a stepping take (`HumanArmSwing.carriage`), read over
 * every stride: each span between the take's left heel strikes, and the
 * spans before the first and after the last, at `HumanArmSwing.PHASES`
 * phases each. A turning walk's strides differ from one another (its pelvis
 * turns and its thighs swing across), so no one stride holds every place
 * the swinging hands pass the thighs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the spans read and why every stride is.
 * @evidence contracts/development/design.md#principled-representation The take's postures before the carriage and its named events, read by the swing's owner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by the walk's plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The strides are the take's own, read off its heel strikes; no stride time is typed.
 */
export namespace walkCarriage {
  /**
   * A take's carriage.
   *
   * @param body The body.
   * @param events The take's named instants, seconds.
   * @param duration The take's seconds.
   * @param posture The take's posture before the carriage.
   * @param resolution Optional same-person FK loan for the actual synchronous phase observations.
   * @param projection Optional genuine same-body ROM loan, never retained in the numeric carriage.
   * @returns Degrees of abduction per arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Every stride is read, since a turn makes strides unlike one another; the carriage holds the hands clear wherever any stride passes them by the thighs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The spans between heel strikes, one carriage over all their phases.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No stride stands in for another; a take with no left heel strike is read over its whole length as one span.
   * @evidence contracts/development/implementation.md#efficient-algorithms `HumanArmSwing.PHASES` postures per stride, once per take: linear in its strides.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanArmSwing.carriage`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    events: readonly { name: string; seconds: number }[],
    duration: number,
    posture: IAutoMovieMotionHumanActionPlan["posture"],
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ): Record<"left" | "right", number> {
    // The spans: the start to the first left heel strike, each stride, and
    // the last strike to the end.
    const bounds: number[] = [
      0,
      ...events
        .filter((e: { name: string }): boolean => /^leftHeelStrike/.test(e.name))
        .map((e: { seconds: number }): number => e.seconds)
        .filter((s: number): boolean => s > 0 && s < duration),
      duration,
    ];
    const times: number[] = [];
    for (let i: number = 1; i < bounds.length; i++) {
      const a: number = bounds[i - 1]!;
      const b: number = bounds[i]!;
      for (let k: number = 0; k < HumanArmSwing.PHASES; k++)
        times.push(a + ((b - a) * k) / HumanArmSwing.PHASES);
    }
    return HumanArmSwing.carriage(
      body,
      times,
      posture,
      ["left", "right"],
      resolution,
      projection,
    );
  }
}
