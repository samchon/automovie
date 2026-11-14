import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmSwing } from "../posture/HumanArmSwing";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * The arm carriage of a stepping take (`HumanArmSwing.carriage`), read over
 * one full stride: from the left heel strike before the take's middle to
 * the next, at `HumanArmSwing.PHASES` phases; a take with no such stride is
 * read over its whole length.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which stride is read and the fallback.
 * @evidence contracts/development/design.md#principled-representation The take's postures before the carriage and its named events, read by the swing's owner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by the walk's plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The stride is the take's own, read off its heel strikes; no stride time is typed.
 */
export namespace walkCarriage {
  /**
   * A take's carriage.
   *
   * @param body The body.
   * @param events The take's named instants, seconds.
   * @param duration The take's seconds.
   * @param posture The take's posture before the carriage.
   * @returns Degrees of abduction per arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation A stride is periodic in its phases, so one full stride in the take's middle, at full gait, holds every place the swinging hands pass the thighs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One stride, one carriage.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A take too short for a stride is read over its whole length.
   * @evidence contracts/development/implementation.md#efficient-algorithms `HumanArmSwing.PHASES` postures, once per take.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanArmSwing.carriage`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    body: IHumanBody,
    events: readonly { name: string; seconds: number }[],
    duration: number,
    posture: (seconds: number) => IHumanPosture,
  ): Record<"left" | "right", number> {
    const left: number[] = events
      .filter((e: { name: string }): boolean => /^leftHeelStrike/.test(e.name))
      .map((e: { seconds: number }): number => e.seconds);
    const i: number = left.findIndex((s: number): boolean => s >= duration / 2);
    const [a, b]: [number, number] =
      i > 0 ? [left[i - 1]!, left[i]!] : [0, duration];
    return HumanArmSwing.carriage(
      body,
      Array.from(
        { length: HumanArmSwing.PHASES },
        (_: unknown, k: number): number =>
          a + ((b - a) * k) / HumanArmSwing.PHASES,
      ),
      posture,
      ["left", "right"],
    );
  }
}
