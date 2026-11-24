import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { HumanLimbIncumbent } from "../posture/HumanLimbIncumbent";
import { poseBones } from "../posture/poseBones";
import type { HumanSegment } from "./HumanSegment";
import { HumanSegmentPose } from "./HumanSegmentPose";
import { HumanSegmentSelection } from "./HumanSegmentSelection";
import { HumanSegmentStill } from "./HumanSegmentStill";
import { demandedHumanChannels } from "./demandedHumanChannels";
import { observableHumanSegment } from "./observableHumanSegment";
import { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";

/** The record of `IBonesBound`'s site. */
type IBonesBound = {
  pose: ReturnType<typeof poseBones.prepare>;
  reading: ReturnType<typeof poseBones.prepareRead>;
};

/**
 * A person's displayed pose at a film second as the person keeps it: the pose
 * is evaluated once and kept as a record (`HumanSegment.IShown`), and what its
 * readers take from it, the pose itself and its bones, comes from that record.
 */
export namespace HumanSegmentShown {
  /**
   * The displayed pose at a second, with the person's record of it.
   *
   * @param person The person.
   * @param seconds Film seconds.
   * @param retain Whether a miss may produce a full pose for later readers. A
   *   transient observation uses the existing guarded bone selection.
   * @param requested Optional observational bones. Where the person keeps poses
   *   the whole pose is read and kept, so every later reader of the second
   *   takes it; elsewhere only their frames are guaranteed and such a pose is
   *   not kept.
   * @param prepared Same-body preparation borrowed for the evaluation.
   * @returns The pose, and its record when the person keeps it: absent while
   *   the schedule is resolved outside any action's planning, where a bone
   *   demand is also evaluated alone.
   */
  export function of(
    person: IAutoMovieMotionHumanSegment.IPerson,
    seconds: number,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    prepared?: prepareHumanSegmentPose.IPrepared,
    retain: boolean = true,
  ): HumanSegmentShown.IRead {
    // Past the end of the person's last action the body holds that action's
    // final pose to the film's end: the film can outlast it (another
    // performer acts on, or the film's length rounds past the action's end),
    // and no still stretch or plan read past the action's end is its final
    // pose.
    const final: IAutoMovieMotionHumanSegment | undefined =
      person.segments.at(-1);
    if (final !== undefined && seconds > final.end)
      return of(person, final.end, requested, prepared, retain);
    const cached: HumanSegment.IShown | undefined = person.resolving
      ? person.planning?.get(seconds)
      : person.cache.get(seconds);
    if (cached !== undefined) return { pose: cached.pose, kept: cached };
    return evaluated(person, seconds, requested, prepared, retain);
  }

  /** The displayed pose at a second the person keeps no pose for yet (`of`). */
  function evaluated(
    person: IAutoMovieMotionHumanSegment.IPerson,
    seconds: number,
    requested: ReadonlySet<AutoMovieHumanoidBone> | undefined,
    prepared: prepareHumanSegmentPose.IPrepared | undefined,
    retain: boolean,
  ): HumanSegmentShown.IRead {
    // A transient observation consumes just its demand. Otherwise, where
    // the person keeps poses, a bone demand reads the whole pose and
    // keeps it, so every later reader of this second, whatever bones it asks,
    // takes the pose already produced; no second is resolved twice. Only
    // outside any planning while the schedule is resolved is the demand
    // evaluated alone, since nothing is kept there; and so is a demand that
    // shows no arm (a trunk, a shoulder, the head or a leg) where the action
    // honours an observation (`observableHumanSegment`): it reads the plan
    // on the channels its bones hang from alone (`demandedHumanChannels`),
    // never running an arm's writers, which may read a partner who reads
    // this person back (a mutual hold, each read a reaction time earlier
    // than the one before), the demand-driven evaluation of required bones.
    const active: IAutoMovieMotionHumanSegment | undefined =
      HumanSegmentSelection.last(person.segments, seconds);
    // A segment chosen through the entry allowance is shown from its entry,
    // where its transition and its holds apply, never raw a hair before it.
    const at: number =
      active === undefined ? seconds : Math.max(seconds, active.entryTime);
    const demand: ReadonlySet<AutoMovieHumanoidBone> | undefined =
      !retain ||
      (person.resolving && person.planning === undefined) ||
      (requested !== undefined &&
        active !== undefined &&
        armless(requested) &&
        observableHumanSegment(person, active, at))
        ? requested
        : undefined;

    // Where the pose holds still back to an earlier second
    // (`HumanSegmentStill.representative`), it is that second's pose: read
    // there, once for the whole stretch, and kept for this second too. A bone
    // demand takes that pose only where it is already kept, since a whole
    // pose costs more than the demand's own.
    const still: number | undefined = HumanSegmentStill.representative(
      person,
      seconds,
    );
    if (still !== undefined) {
      const known: HumanSegment.IShown | undefined = person.resolving
        ? person.planning?.get(still)
        : person.cache.get(still);
      if (known !== undefined || demand === undefined) {
        const at: HumanSegmentShown.IRead =
          known === undefined
            ? of(person, still, undefined, prepared)
            : { pose: known.pose, kept: known };
        if (at.kept !== undefined && demand === undefined)
          keep(person, seconds, at.kept);
        return at;
      }
    }
    const pose: IAutoMoviePose =
      active === undefined
        ? HumanSegmentPose.initial(person, demand, prepared)
        : active.incumbents === undefined
          ? HumanSegmentPose.of(person, active, at, prepared, demand)
          : // The action's last leaf seeds start every swept fit of this
            // evaluation (leaf, carry, stop and plant fits) from a held seed
            // (`HumanLimbIncumbent`), which cannot change their answers.
            HumanLimbIncumbent.within(
              { body: person.performer.body, seeds: active.incumbents },
              (): IAutoMoviePose =>
                HumanSegmentPose.of(person, active, at, prepared, demand),
            );
    if (demand !== undefined) return { pose };
    const kept: HumanSegment.IShown = { pose };
    return keep(person, seconds, kept) ? { pose, kept } : { pose };
  }

  /**
   * Read a person as an overlay placed `count`-th is laid on: the carrier, the
   * overlays placed before it and the holds' carries, without it and the
   * overlays after it. An overlay that reads its own performer's displayed pose
   * (a held prop it works, a bow's string drawn over its presentation) reads it
   * so, never re-entering its own posture; the person's state at the overlay's
   * planning is exactly this one.
   *
   * @param person The person.
   * @param count How many of the person's overlays the read keeps, in placement
   *   order.
   * @param read The read.
   * @returns What the read returns.
   */
  export function laid<T>(
    person: IAutoMovieMotionHumanSegment.IPerson,
    count: number,
    read: () => T,
  ): T {
    const all: IAutoMovieMotionHumanSegment.IOverlay[] = person.overlays;
    if (count >= all.length) return read();
    const cache: IAutoMovieMotionHumanSegment.IPerson["cache"] = person.cache;
    const planning: IAutoMovieMotionHumanSegment.IPerson["planning"] =
      person.planning;
    person.overlays = all.slice(0, count);
    person.cache = new Map();
    if (planning !== undefined) person.planning = new Map();
    try {
      return read();
    } finally {
      person.overlays = all;
      person.cache = cache;
      if (planning !== undefined) person.planning = planning;
    }
  }

  /**
   * A displayed pose read at a second, and the person's record of it where the
   * person keeps it.
   */
  export interface IRead {
    /** The pose. */
    pose: IAutoMoviePose;

    /** The person's record of it, where the person keeps it. */
    kept?: HumanSegment.IShown;
  }

  /**
   * Whether a bone demand needs no arm channel (`demandedHumanChannels`): its
   * bones hang from the root, the trunk, the head and the legs alone.
   */
  function armless(requested: ReadonlySet<AutoMovieHumanoidBone>): boolean {
    const channels: readonly AutoMovieMotionHumanChannel[] =
      demandedHumanChannels(requested);
    return !channels.includes("leftArm") && !channels.includes("rightArm");
  }

  /**
   * Keep a record at a second where the person keeps poses: in the planning's
   * map while one action is planned (`HumanSegment.planning`, whose placed
   * state is fixed), in the settled map otherwise, none while the schedule is
   * resolved outside a planning.
   */
  function keep(
    person: IAutoMovieMotionHumanSegment.IPerson,
    seconds: number,
    kept: HumanSegment.IShown,
  ): boolean {
    if (person.resolving) {
      if (person.planning === undefined) return false;
      person.planning.set(seconds, kept);
      return true;
    }
    if (person.cache.size >= 4096)
      person.cache.delete(person.cache.keys().next().value!);
    person.cache.set(seconds, kept);
    return true;
  }

  /**
   * A person's displayed bones at a film second: the bones of the pose `of`
   * gives. A pose the person keeps is admitted by the body's rig once, at the
   * first read of its bones, and every later read of that pose's bones takes
   * them from that one reading; a pose that is not kept has its bones resolved
   * from it.
   *
   * @param person The person.
   * @param seconds Film seconds.
   * @param requested The bones to return; every bone when absent.
   * @param prepared Same-body preparation of this synchronous query.
   * @param bound One scan's fixed-demand readers, of a pose and of a reading,
   *   for the same names as `requested`; absent, the names are read live.
   * @returns The bones, fresh.
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
    const body: IAutoMovieMotionHumanBody = person.performer.body;
    const entry: HumanSegmentShown.IRead = of(
      person,
      seconds,
      requested,
      prepared,
    );
    if (entry.kept === undefined)
      return bound === undefined
        ? poseBones(body, entry.pose, prepared.resolution(), requested)
        : bound.pose(entry.pose, prepared.resolution());
    const reading: ReturnType<typeof poseBones.read> = (entry.kept.reading ??=
      poseBones.read(body, entry.pose, prepared.resolution()));
    return bound === undefined
      ? reading.map(requested)
      : bound.reading(reading);
  }
}
