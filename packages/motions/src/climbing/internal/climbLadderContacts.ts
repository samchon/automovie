import type {
  IAutoMovieMotionHumanClimbLadder,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";

import type { climbLadderBeats } from "./climbLadderBeats";

/*
 * A ladder climb's contact windows: each limb holds between its moves, a foot
 * planted on the floor before its first move and on a rung after, a hand
 * gripping a rung from the beat both hands are on. The first hand to move
 * leaves its rung the instant both are on, so it declares no window between.
 * Parameter moves: Each limb's moves in order, seconds.
 * Parameter order: The limbs.
 * Parameter beat: The beat both hands are on by, seconds.
 * Parameter duration: The climb's seconds.
 * Parameter ladder: The ladder's subject.
 * Returns: The windows, as shares of the climb.
 */
export function climbLadderContacts(
  moves: climbLadderBeats.IBeats["moves"],
  order: readonly IAutoMovieMotionHumanClimbLadder.Limb[],
  beat: number,
  duration: number,
  ladder: string,
): IAutoMovieMotionHumanContactWindow[] {
  const contacts: IAutoMovieMotionHumanContactWindow[] = [];
  for (const limb of order) {
    const own: climbLadderBeats.IBeats["moves"][IAutoMovieMotionHumanClimbLadder.Limb] =
      moves[limb];
    const hand: boolean = limb.endsWith("Hand");
    let from: number = hand ? beat : 0;
    for (let i: number = 0; i <= own.length; i++) {
      const to: number = i < own.length ? own[i]!.from : duration;
      if (to <= from) {
        if (i < own.length) from = own[i]!.to;
        continue;
      }
      contacts.push({
        part: limb,
        kind: hand ? "grip" : "plant",
        from: from / duration,
        to: to / duration,
        support:
          !hand && i === 0
            ? { kind: "ground" }
            : { kind: "prop", subject: ladder },
      });
      if (i < own.length) from = own[i]!.to;
    }
  }
  return contacts;
}
