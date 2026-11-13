import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { HumanPerception } from "../law/HumanPerception";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanColliders } from "../posture/HumanColliders";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingBody } from "../striking/StrikingBody";
import { StrikingTarget } from "../striking/StrikingTarget";
import type { touchSite } from "./touchSite";

/**
 * How a touch reads the person it touches: as perceived on the way to them,
 * and as they are while the hand is on them.
 *
 * Before the hand arrives (`ready`) and after it leaves (`relax`), the
 * partner is a tracked person, read where the performer saw them a reaction
 * time earlier (`HumanPerception.REACTION`). Between, the hand lies on the
 * partner's body and rides it, as the hand of a clinch, a carry or a
 * handshake does, so the partner's region and colliders are read where the
 * partner was one frame before (`StrikingTarget.LOOK`), the look-back every
 * plan reads another performer through: two people each with a hand on the
 * other would otherwise each read the posture the other is still solving.
 * Read as perceived, the palm of a shove trailed the chest it pushed by up
 * to 0.2 m as the receiver staggered away; a frame behind, it trails by the
 * chest's travel over 1/24 s. The
 * arrival itself (`ready` and `relax`, the instants a touch plans its
 * clearing course against) is still read as perceived, so a course planned
 * on the way never reads the partner at a contact still to come.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two readings, the window that separates them, why the hand rides the partner a frame behind and the measured fault.
 * @evidence contracts/development/design.md#principled-representation The hold is the open span between the arrival and the departure on the touch's own clock; inside it the partner is read as a held contact is, outside it as a tracked person.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The window, the context that reads a person as they are, the region reader and the colliders a touch keeps clear of.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No person or action is named; the window is the touch's own clock.
 */
export namespace touchHold {
  /**
   * Whether the hand lies on its region at a second.
   *
   * @param clock The touch's clock.
   * @param seconds Seconds since the action's start.
   * @returns True strictly between `ready` and `relax`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the window and that its ends are excluded.
   * @evidence contracts/development/implementation.md#principled-implementation The clock's arrival and departure bound the hold; at each end the course planned on the way is read.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function holding(
    clock: AutoMovieMotionClock.IClock,
    seconds: number,
  ): boolean {
    return seconds > clock.at("ready") && seconds < clock.at("relax");
  }

  /**
   * The context whose aim reads a person as they are, for the hold.
   *
   * @param context The action's context.
   * @returns The same context with a person's region placed on their bones one frame before the second; every other target aimed as before.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what changes and what is kept.
   * @evidence contracts/development/implementation.md#principled-implementation A person's region placed on the bones `context.performer` gives one frame before the second, which a performer that names itself reads as it entered.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One aim replaced.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only a person is read differently.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One bone read and one placement per aim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `StrikingBody.region`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The context closes over the given one.
   */
  export function felt<
    Context extends Pick<IHumanActionContext, "aim" | "performer">,
  >(context: Context): Context {
    return {
      ...context,
      aim: (
        target: AutoMovieMotionTarget,
        seconds: number,
      ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } => {
        if (target.kind !== "person") return context.aim(target, seconds);
        const other: IHumanActionContext.IPerformer = context.performer(
          target.subject,
        );
        return StrikingBody.region(
          other.body,
          other.bones(seconds - StrikingTarget.LOOK),
          target.region,
        );
      },
    };
  }

  /**
   * A region read as perceived outside the hold and as felt inside it.
   *
   * @param clock The touch's clock.
   * @param perceived The region as the touch reads it on the way.
   * @param held The region as the touch reads it while the hand is on it.
   * @returns The region at a posture and a second since the action's start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which reading applies when.
   * @evidence contracts/development/implementation.md#principled-implementation The window decides the reading at each second.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work beyond the reading.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader closes over its two readings.
   */
  export function region(
    clock: AutoMovieMotionClock.IClock,
    perceived: (posture: IHumanPosture, seconds: number) => touchSite.IFrame,
    held: (posture: IHumanPosture, seconds: number) => touchSite.IFrame,
  ): (posture: IHumanPosture, seconds: number) => touchSite.IFrame {
    return (posture: IHumanPosture, seconds: number): touchSite.IFrame =>
      holding(clock, seconds)
        ? held(posture, seconds)
        : perceived(posture, seconds);
  }

  /**
   * The partner's colliders a touch keeps its arm clear of.
   *
   * @param context The action's context.
   * @param subject The partner.
   * @param clock The touch's clock.
   * @returns The colliders at a second since the action's start: where the partner was one frame before during the hold, where the performer saw them a reaction time earlier otherwise.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both readings.
   * @evidence contracts/development/implementation.md#principled-implementation The partner's bones read `LOOK` before the second during the hold and `REACTION` before it outside, placed by their collider profile.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch on the window.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One collider placement per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanColliders.placed`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The function closes over the context, the subject and the clock.
   */
  export function others(
    context: Pick<IHumanActionContext, "performer" | "start">,
    subject: string,
    clock: AutoMovieMotionClock.IClock,
  ): (posture: IHumanPosture, seconds: number) => HumanColliders.IPlaced[] {
    return (_: IHumanPosture, seconds: number): HumanColliders.IPlaced[] => {
      const partner: IHumanActionContext.IPerformer =
        context.performer(subject);
      return HumanColliders.placed(
        partner.body,
        partner.bones(
          context.start +
            seconds -
            (holding(clock, seconds)
              ? StrikingTarget.LOOK
              : HumanPerception.REACTION),
        ),
      );
    };
  }
}
