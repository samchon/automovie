import type { AutoMovieMotionTarget } from "@automovie/interface";

import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingBody } from "../striking/StrikingBody";

/**
 * Where the blow a reaction answers comes from: a person's region read where
 * that person is at the second, not where the performer saw them a reaction
 * time earlier (`HumanPerception.REACTION`).
 *
 * A reaction is the delay itself. Its start is synced to the stimulus (the
 * contact of a slap, a shove or a grab, a blow's arrival) and its own curve
 * holds its latency (a startle's head at 60 ms), so the stimulus is read
 * where it is then. Read through the perceived aim, a shove's palm was taken
 * from where it had been 0.29 s before the contact, still on its way out
 * from the pusher's side, and the receiver of a shove on the sternum was
 * sent 0.13 m sideways and 61 mm back instead of 0.20 m straight back.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, when, why a reaction is not delayed again and the measured fault.
 * @evidence contracts/development/design.md#principled-representation One reading of a reaction's source, shared by every reaction that answers a blow, beside the perceived aim of a tracked person.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one function the reactions call.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only a person is read differently; every other target is the shared resolver's.
 */
export namespace ReactionSource {
  /**
   * The place a reaction's source is at a second.
   *
   * @param context The action's context.
   * @param from The source; absent for a reaction without one.
   * @param seconds Film seconds the source is read at.
   * @param posture The performer's posture then.
   * @param place The default place when there is no source.
   * @returns The place: a person's region as that person's bones show it at the second; any other target as `AutoMovieMotionHumanTarget.resolve` reads it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and what each kind of source reads.
   * @evidence contracts/development/implementation.md#principled-implementation A person's region placed on that person's bones at the second (`context.performer`), the felt contact; the rest delegated.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch for a person, one delegation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A source that names the performer itself is read on its body as it entered, as `context.performer` gives it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One bone read and one placement.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `StrikingBody.region` and `AutoMovieMotionHumanTarget.resolve`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function at(
    context: Pick<IHumanActionContext, "aim" | "body" | "performer">,
    from: AutoMovieMotionTarget | undefined,
    seconds: number,
    posture: IHumanPosture,
    place: AutoMovieMotionHumanTarget.IDefault,
  ): AutoMovieMotionHumanTarget.IPlace {
    if (from?.kind !== "person")
      return AutoMovieMotionHumanTarget.resolve(
        context,
        from,
        seconds,
        posture,
        place,
      );
    const other: IHumanActionContext.IPerformer = context.performer(
      from.subject,
    );
    return {
      ...StrikingBody.region(other.body, other.bones(seconds), from.region),
      solid: true,
    };
  }
}
