import type {
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

import { HumanSegmentSelection } from "./HumanSegmentSelection";

/*
 * Read the raw active posture of an already resolved person, before layers: the
 * last action entered by the second, read at its local second held within its
 * plan, so a second past the last action's end shows the pose it ended on; the
 * person's initial posture before any action is entered.
 * Parameter person: The person's placed actions and initial posture.
 * Parameter seconds: Film seconds.
 * Parameter channels: The channels read, if not all.
 * Returns: The posture.
 */
export function readPlacedHumanPosture(
  person: readPlacedHumanPosture.IPlaced,
  seconds: number,
  channels?: readonly AutoMovieMotionHumanChannel[],
): IAutoMovieMotionHumanPosture {
  const active: readPlacedHumanPosture.ISegment | undefined =
    HumanSegmentSelection.last(person.segments, seconds);
  return active === undefined
    ? person.initial
    : active.plan.posture(
        Math.min(active.plan.duration, Math.max(0, seconds - active.start)),
        channels,
      );
}

/*
 * Companion types of readPlacedHumanPosture.
 */
export namespace readPlacedHumanPosture {
  /*
   * What the read takes of a placed action: its entry, start and plan.
   */
  export type ISegment = Pick<
    IAutoMovieMotionHumanSegment,
    "entryTime" | "start" | "plan"
  >;

  /*
   * What the read takes of a person.
   */
  export interface IPlaced {
    /*
     * The placed actions, in placement order.
     */
    segments: readonly ISegment[];

    /*
     * The posture before any action.
     */
    initial: IAutoMovieMotionHumanPosture;
  }
}
