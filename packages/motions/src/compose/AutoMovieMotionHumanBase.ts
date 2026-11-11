import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * Bases of composed actions: the plan whose posture every unclaimed channel
 * keeps.
 *
 * Most actions happen on a body that otherwise stays as it is (a stance, a
 * seat, the posture the action was entered in), so their base is one posture
 * held for the action's duration with the supports it stands on.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a base is and what most actions take as theirs.
 * @evidence contracts/development/design.md#principled-representation A base is an action plan like any other, so a moving base (a walk) and a held one compose the same way.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two functions: the held base and the supports of a body standing on both feet.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the plan and contact-window types; no base type of its own.
 */
export namespace AutoMovieMotionHumanBase {
  /**
   * A base that holds one posture.
   *
   * @param duration Seconds; the composed action's clock lasts as long.
   * @param posture The posture held.
   * @param contacts The supports it stands on, shares of the duration.
   * @returns The plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's unit and meaning and the default supports.
   * @evidence contracts/development/implementation.md#principled-implementation A held posture is the constant function of time, with the supports it was given and no events.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The contacts are copied, so a later change of the caller's list does not reach the plan.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds the one posture it returns.
   */
  export function still(
    duration: number,
    posture: IHumanPosture,
    contacts: readonly IHumanContactWindow[] = [],
  ): IHumanActionPlan {
    return {
      duration,
      events: [],
      contacts: [...contacts],
      posture: (): IHumanPosture => posture,
    };
  }

  /**
   * Both feet planted on the ground for a share of an action.
   *
   * @param from Share of the duration the plants start at.
   * @param to Share of the duration the plants end at.
   * @returns The left foot's window, then the right foot's.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit of the two shares, their defaults in the signature and the order of the result.
   * @evidence contracts/development/implementation.md#principled-implementation A body standing on both feet has one ground plant per foot over the same share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map over the two feet.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The shares are passed through as given; the composition's consumer validates windows.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function plants(
    from: number = 0,
    to: number = 1,
  ): IHumanContactWindow[] {
    return (["leftFoot", "rightFoot"] as const).map(
      (part: "leftFoot" | "rightFoot"): IHumanContactWindow => ({
        part,
        kind: "plant",
        from,
        to,
        support: { kind: "ground" },
      }),
    );
  }
}
