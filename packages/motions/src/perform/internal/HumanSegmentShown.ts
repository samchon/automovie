import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { motionPrepared } from "../../compose/internal/motionPrepared";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanSegmentPose } from "./HumanSegmentPose";
import { HumanSegmentSelection } from "./HumanSegmentSelection";
import { HumanSegmentStill } from "./HumanSegmentStill";
import { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";

/*
 * A person's displayed pose at a film second, evaluated from their placed
 * actions with nothing kept between reads.
 *
 * Past the end of the person's last action the body holds that action's final
 * pose: the film can outlast it. Where the pose holds still back to an earlier
 * second (`HumanSegmentStill.representative`), that second is read. A bone
 * demand is evaluated alone where the action honours an observation
 * (`HumanSegmentPose.seeded`): it reads the plan on the channels its bones hang
 * from alone (`demandedHumanChannels`), so a trunk read never runs an arm's
 * writers, which may read a partner who reads this person back, the
 * demand-driven evaluation of required bones. While the performance is
 * prepared, the action read is solved first (`IPerson.ready`).
 * Parameter person: The person.
 * Parameter seconds: Film seconds.
 * Parameter requested: Optional observational bones; only their frames are
 * guaranteed.
 * Parameter prepared: Same-body preparation borrowed for the evaluation.
 * Returns: The pose.
 */
export function HumanSegmentShown(
  person: IAutoMovieMotionHumanSegment.IPerson,
  seconds: number,
  requested?: ReadonlySet<AutoMovieHumanoidBone>,
  prepared?: prepareHumanSegmentPose.IPrepared,
): IAutoMoviePose {
  const final: IAutoMovieMotionHumanSegment | undefined =
    person.segments.at(-1);
  const at: number =
    final !== undefined && seconds > final.end ? final.end : seconds;
  const still: number | undefined = HumanSegmentStill.representative(
    person,
    at,
  );
  const shown: number = still ?? at;
  person.ready?.(shown);
  const active: IAutoMovieMotionHumanSegment | undefined =
    HumanSegmentSelection.last(person.segments, shown);

  // A segment chosen through the entry allowance is shown from its entry,
  // where its transition and its holds apply, never raw a hair before it.
  const from: number =
    active === undefined ? shown : Math.max(shown, active.entryTime);
  return active === undefined
    ? HumanSegmentPose.initial(person, requested, prepared)
    : HumanSegmentPose(person, active, from, prepared, requested);
}

/*
 * Readers over a person's displayed pose.
 */
export namespace HumanSegmentShown {
  /*
   * Read a person as an overlay placed `count`-th is laid on: the carrier, the
   * overlays placed before it and the holds' carries, without it and the
   * overlays after it. An overlay that reads its own performer's displayed pose
   * (a held prop it works, a bow's string drawn over its presentation) reads it
   * so, never re-entering its own posture; the person's state at the overlay's
   * planning is exactly this one.
   * Parameter person: The person.
   * Parameter count: How many of the person's overlays the read keeps, in placement
   * order.
   * Parameter read: The read.
   * Returns: What the read returns.
   */
  export function laid<T>(
    person: IAutoMovieMotionHumanSegment.IPerson,
    count: number,
    read: () => T,
  ): T {
    const all: IAutoMovieMotionHumanSegment.IOverlay[] = person.overlays;
    if (count >= all.length) return read();
    person.overlays = all.slice(0, count);
    try {
      return motionPrepared.branch(read);
    } finally {
      person.overlays = all;
    }
  }

  /*
   * A person's displayed bones at a film second: the bones of the pose
   * HumanSegmentShown gives.
   * Parameter person: The person.
   * Parameter seconds: Film seconds.
   * Parameter requested: The bones to return; every bone when absent.
   * Parameter prepared: Same-body preparation of this synchronous query.
   * Parameter bound: One scan's fixed-demand reader of a pose for the same names
   * as `requested`; absent, the names are read live.
   * Returns: The bones, fresh.
   */
  export function bones(
    person: IAutoMovieMotionHumanSegment.IPerson,
    seconds: number,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    prepared: prepareHumanSegmentPose.IPrepared = prepareHumanSegmentPose(
      person.performer.body,
    ),
    bound?: IBonesBound,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const pose: IAutoMoviePose = HumanSegmentShown(
      person,
      seconds,
      requested,
      prepared,
    );
    return bound === undefined
      ? poseBones(person.performer.body, pose, prepared.resolution(), requested)
      : bound.pose(pose, prepared.resolution());
  }
}

/*
 * The record of `IBonesBound`'s site.
 */
type IBonesBound = {
  pose: ReturnType<typeof poseBones.prepare>;
};
