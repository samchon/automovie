import type {
  AutoMovieHumanoidBone,
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
   * @param requested Optional observational bones; only their frames are guaranteed and such a pose is not kept.
   * @param prepared Same-body preparation borrowed for the evaluation.
   * @returns The pose, and its record when the person keeps it: absent for a pose evaluated under a bone demand, and while the schedule is resolved outside any action's planning.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the pose, when a record accompanies it and when none does.
   * @evidence contracts/development/implementation.md#principled-implementation Selects the last placed segment whose entry is at or before the second with the existing 1e-12 allowance, then uses its displayed evaluator or the initial standing pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup, one reverse last-match selection on a miss, one evaluation and bounded insertion of the new record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts While the schedule is being resolved a pose is shared only within one action's planning (`HumanSegment.planning`), never across a placement. Observational requests may borrow an existing complete pose but never store partial results; public whole-pose queries remain complete at exact seconds.
   * @evidence contracts/development/implementation.md#efficient-algorithms Hits cost one map lookup; a second where the pose holds still back to an earlier one (`HumanSegmentStill.representative`, two selections) takes that second's pose, evaluated once for the whole stretch; misses inspect R entries from the end, at most S segments, and pay the selected evaluator's fitting cost, retaining at most 4096 records per person.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A still stretch shares one evaluation, which `HumanSegmentStill.within` proves equal at every second of it (no term of the shown pose changes there). Exact film-second queries share completed poses only after placement is settled; HumanSegment.forget clears them when plans, stops or placement dependencies change.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The person owns the FIFO-bounded 4096-entry map and releases it on forget; returned pose references retain their existing borrowed ownership, with no copy or new process-wide cache.
   */
  export function of(
    person: IAutoMovieMotionHumanSegment.IPerson,
    seconds: number,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    prepared?: prepareHumanSegmentPose.IPrepared,
  ): { pose: IAutoMoviePose; kept?: HumanSegment.IShown } {
    const cached: HumanSegment.IShown | undefined = person.resolving
      ? person.planning?.get(seconds)
      : person.cache.get(seconds);
    if (cached !== undefined) return { pose: cached.pose, kept: cached };

    // Where the pose holds still back to an earlier second
    // (`HumanSegmentStill.representative`), it is that second's pose: read
    // there, once for the whole stretch, and kept for this second too. A bone
    // demand takes that pose only where it is already kept, since a whole
    // pose costs more than the demand's own.
    const still: number | undefined = HumanSegmentStill.representative(person, seconds);
    if (still !== undefined) {
      const known: HumanSegment.IShown | undefined = person.resolving
        ? person.planning?.get(still)
        : person.cache.get(still);
      if (known !== undefined || requested === undefined) {
        const at: { pose: IAutoMoviePose; kept?: HumanSegment.IShown } =
          known === undefined ? of(person, still, undefined, prepared) : { pose: known.pose, kept: known };
        if (at.kept !== undefined && requested === undefined) keep(person, seconds, at.kept);
        return at;
      }
    }
    const active: IAutoMovieMotionHumanSegment | undefined =
      HumanSegmentSelection.last(person.segments, seconds);
    const pose: IAutoMoviePose = active === undefined
      ? HumanSegmentPose.initial(person, requested, prepared)
      : active.incumbents === undefined
        ? HumanSegmentPose.of(person, active, seconds, prepared, requested)
        // The action's last leaf seeds start every swept fit of this
        // evaluation (leaf, carry, stop and plant fits) from a held seed
        // (`HumanLimbIncumbent`), which cannot change their answers.
        : HumanLimbIncumbent.within({ body: person.performer.body, seeds: active.incumbents },
          (): IAutoMoviePose => HumanSegmentPose.of(person, active, seconds, prepared, requested));
    if (requested !== undefined) return { pose };
    const kept: HumanSegment.IShown = { pose };
    return keep(person, seconds, kept) ? { pose, kept } : { pose };
  }

  /** Keep a record at a second where the person keeps poses: in the planning's map while one action is planned (`HumanSegment.planning`, whose placed state is fixed), in the settled map otherwise, none while the schedule is resolved outside a planning. */
  function keep(person: IAutoMovieMotionHumanSegment.IPerson, seconds: number, kept: HumanSegment.IShown): boolean {
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
    prepared: prepareHumanSegmentPose.IPrepared = prepareHumanSegmentPose(person.performer.body),
    bound?: { pose: ReturnType<typeof poseBones.prepare>; reading: ReturnType<typeof poseBones.prepareRead> },
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const body: IAutoMovieMotionHumanBody = person.performer.body;
    const entry: { pose: IAutoMoviePose; kept?: HumanSegment.IShown } = of(person, seconds, requested, prepared);
    if (entry.kept === undefined)
      return bound === undefined
        ? poseBones(body, entry.pose, prepared.resolution(), requested)
        : bound.pose(entry.pose, prepared.resolution());
    const reading: ReturnType<typeof poseBones.read> =
      (entry.kept.reading ??= poseBones.read(body, entry.pose, prepared.resolution()));
    return bound === undefined ? reading.map(requested) : bound.reading(reading);
  }
}
