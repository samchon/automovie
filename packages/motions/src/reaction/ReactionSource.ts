import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionTarget,
} from "@automovie/interface";

import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { StrikingBody } from "../striking/StrikingBody";

/** The alternatives of `AtContext`'s site. */
type AtContext = "aim" | "body" | "performer";

/**
 * Where the blow a reaction answers comes from: a person's region read where
 * that person is at the second, not where the performer saw them a reaction
 * time earlier (`HumanPerception.REACTION`).
 *
 * A reaction is the delay itself. Its start is synced to the stimulus (the
 * contact of a slap, a shove or a grab, a blow's arrival) and its own curve
 * holds its latency (a startle's head at 60 ms), so the stimulus is read where
 * it is then. Read through the perceived aim, a shove's palm was taken from
 * where it had been 0.29 s before the contact, still on its way out from the
 * pusher's side, and the receiver of a shove on the sternum was sent 0.13 m
 * sideways and 61 mm back instead of 0.20 m straight back.
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
   * @returns The place: a person's region as that person's bones show it at the
   *   second; any other target as `AutoMovieMotionHumanTarget.resolve` reads
   *   it.
   */
  export function at(
    context: Pick<IAutoMovieMotionHumanActionContext, AtContext>,
    from: IAutoMovieMotionTarget | undefined,
    seconds: number,
    posture: IAutoMovieMotionHumanPosture,
    place: IAutoMovieMotionHumanTarget.IDefault,
  ): IAutoMovieMotionHumanTarget.IPlace {
    if (from?.kind !== "person")
      return AutoMovieMotionHumanTarget.resolve(
        context,
        from,
        seconds,
        posture,
        place,
      );
    const other: IAutoMovieMotionHumanPerformerReader = context.performer(
      from.subject,
    );
    const requested: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([
        StrikingBody.frame(other.body, from.region).bone,
      ]);
    return {
      ...StrikingBody.region(
        other.body,
        other.bones(seconds, requested),
        from.region,
      ),
      solid: true,
    };
  }
}
