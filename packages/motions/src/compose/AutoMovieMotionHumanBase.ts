import type { IHumanActionContext } from "../law/IHumanActionContext";
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three functions: the held base, the base of an action that may ride a carrier, and the supports of a body standing on both feet.
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
   * The base of an action that may be performed over another: the carrier's
   * posture, instant by instant, when the action is an overlay, and
   * otherwise the posture it was entered in, held on the supports given.
   *
   * @param context The action's context.
   * @param duration Seconds; the composed action's clock lasts as long.
   * @param contacts The supports a held base stands on, shares of the duration; when absent, the supports the body rests on at the entry, held throughout. A carrier declares its own.
   * @returns The plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two cases, each input and whose supports count.
   * @evidence contracts/development/implementation.md#principled-implementation A base is a plan, so a moving one (the carrier) and a held one compose the same way; the overlay's primitives then write on the body the carrier places at that instant.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch on the context's carrier.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An overlay declares none of the carrier's supports a second time.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `still` for an action that carries the body itself.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the carrier's posture function.
   */
  export function under(
    context: Pick<IHumanActionContext, "carrier" | "entry">,
    duration: number,
    contacts?: readonly IHumanContactWindow[],
  ): IHumanActionPlan {
    const carrier: IHumanActionContext.ICarrier | undefined = context.carrier;
    if (carrier === undefined)
      return still(
        duration,
        context.entry.posture,
        contacts ??
          context.entry.supports.map(
            (s): IHumanContactWindow => ({ ...s, from: 0, to: 1 }),
          ),
      );
    return {
      duration,
      events: [],
      contacts: [],
      posture: (seconds: number): IHumanPosture => carrier.posture(seconds),
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
