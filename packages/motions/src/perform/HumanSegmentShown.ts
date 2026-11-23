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

/**
 * A person's displayed pose at a film second as the person keeps it: the
 * pose is evaluated once and kept as a record (`HumanSegment.IShown`), and
 * what its readers take from it, the pose itself and its bones, comes from
 * that record.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is kept, for which readers and which two readings come from the record.
 * @evidence contracts/development/design.md#principled-representation One record a kept pose, holding the pose and the one reading of its bones, in the person's settled map or the planning's shared one.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `of` serves `HumanSegmentPose.displayed` and `bones` the performance's bone readers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record is the person's own; no map beside the person's and no comparison of poses is added.
 */
export namespace HumanSegmentShown {
  /**
   * The displayed pose at a second, with the person's record of it.
   *
   * @param person The person.
   * @param seconds Film seconds.
   * @param retain Whether a miss may produce a full pose for later readers. A transient observation uses the existing guarded bone selection.
   * @param requested Optional observational bones. Where the person keeps poses the whole pose is read and kept, so every later reader of the second takes it; elsewhere only their frames are guaranteed and such a pose is not kept.
   * @param prepared Same-body preparation borrowed for the evaluation.
   * @returns The pose, and its record when the person keeps it: absent while the schedule is resolved outside any action's planning, where a bone demand is also evaluated alone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the pose, when a record accompanies it and when none does.
   * @evidence contracts/development/implementation.md#principled-implementation Selects the last placed segment whose entry is at or before the second with the existing 1e-12 allowance, then uses its displayed evaluator or the initial standing pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup, one reverse last-match selection on a miss, one evaluation and bounded insertion of the new record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts While the schedule is being resolved a pose is shared only within one action's planning (`HumanSegment.planning`), never across a placement. Observational requests read and keep the whole pose where poses are kept, so a second is resolved once for all its readers, and never store partial results; public whole-pose queries remain complete at exact seconds.
   * @evidence contracts/development/implementation.md#efficient-algorithms Hits cost one map lookup; a second where the pose holds still back to an earlier one (`HumanSegmentStill.representative`, two selections) takes that second's pose, evaluated once for the whole stretch; misses inspect R entries from the end, at most S segments, and pay the selected evaluator's fitting cost, retaining at most 4096 records per person.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A still stretch shares one evaluation, which `HumanSegmentStill.within` proves equal at every second of it (no term of the shown pose changes there). Exact film-second queries share completed poses only after placement is settled; HumanSegment.forget clears them when plans, stops or placement dependencies change.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The person owns the FIFO-bounded 4096-entry map and releases it on forget; returned pose references retain their existing borrowed ownership, with no copy or new process-wide cache.
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
    // than the one before), the demand-driven evaluation of required bones
    // (Unreal Engine `FBoneContainer`).
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
   * Read a person as an overlay placed `count`-th is laid on: the carrier,
   * the overlays placed before it and the holds' carries, without it and
   * the overlays after it. An overlay that reads its own performer's
   * displayed pose (a held prop it works, a bow's string drawn over its
   * presentation) reads it so, never re-entering its own posture; the
   * person's state at the overlay's planning is exactly this one.
   *
   * @param person The person.
   * @param count How many of the person's overlays the read keeps, in placement order.
   * @param read The read.
   * @returns What the read returns.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which overlays the read sees and why.
   * @evidence contracts/development/implementation.md#principled-implementation The person's overlays are those placed before the reading overlay for the read's synchronous span, the state its planning saw; every display term (carrier, earlier overlays, carries, fits) is evaluated as usual.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scoped swap of the person's own overlay list and pose records, restored in finally.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A pose read under the scope is kept only in the scope's own fresh records, never in the person's, which hold the whole display.
   * @evidence contracts/development/implementation.md#efficient-algorithms Nothing is swapped when no overlay is left out (a read while the overlay is planned); otherwise one pose evaluation per second the read demands, shared within the scope.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the ordinary display evaluation and its records, scoped to the laid state; nested scopes restore the enclosing one.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The scope's records are released on return or throw, when the person's list and records are restored.
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
   * A displayed pose read at a second, and the person's record of it where
   * the person keeps it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the members.
   * @evidence contracts/development/design.md#principled-representation The pose and its optional kept record, as `of` returns them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The return of `of` and its evaluation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record is the person's own.
   */
  export interface IRead {
    /** The pose. */
    pose: IAutoMoviePose;

    /** The person's record of it, where the person keeps it. */
    kept?: HumanSegment.IShown;
  }

  /** Whether a bone demand needs no arm channel (`demandedHumanChannels`): its bones hang from the root, the trunk, the head and the legs alone. */
  function armless(requested: ReadonlySet<AutoMovieHumanoidBone>): boolean {
    const channels: readonly AutoMovieMotionHumanChannel[] =
      demandedHumanChannels(requested);
    return !channels.includes("leftArm") && !channels.includes("rightArm");
  }

  /** Keep a record at a second where the person keeps poses: in the planning's map while one action is planned (`HumanSegment.planning`, whose placed state is fixed), in the settled map otherwise, none while the schedule is resolved outside a planning. */
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
   * them from that one reading; a pose that is not kept has its bones
   * resolved from it.
   *
   * @param person The person.
   * @param seconds Film seconds.
   * @param requested The bones to return; every bone when absent.
   * @param prepared Same-body preparation of this synchronous query.
   * @param bound One scan's fixed-demand readers, of a pose and of a reading, for the same names as `requested`; absent, the names are read live.
   * @returns The bones, fresh.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which pose's bones are returned, when its admission is shared, the unkept case and the fresh result.
   * @evidence contracts/development/implementation.md#principled-implementation A reading holds one admission's articulations and root and composes bones by the products forward kinematics of the pose uses, so the bones of a kept pose read from it are those a resolve of that pose returns.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One displayed record; it carries the reading, and an unkept pose goes to the ordinary reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A kept pose is the person's own record, replaced only by `HumanSegment.forget` and the planning's clearing, so the reading is never compared or looked up apart from it; a caller that edits a kept pose in place edits the person's record and is outside this reading.
   * @evidence contracts/development/implementation.md#efficient-algorithms A kept pose costs one O(J) admission over all its bone readers and K copies a read; an unkept one costs the ordinary admission and demanded ancestry.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The readers of one kept pose share its reading because they read the same record of the same person at the same second under the same placed state.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reading lives in the person's kept record and leaves with it, on eviction, `forget` or the planning's end.
   */
  export function bones(
    person: IAutoMovieMotionHumanSegment.IPerson,
    seconds: number,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    prepared: prepareHumanSegmentPose.IPrepared = prepareHumanSegmentPose(
      person.performer.body,
    ),
    bound?: {
      pose: ReturnType<typeof poseBones.prepare>;
      reading: ReturnType<typeof poseBones.prepareRead>;
    },
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
