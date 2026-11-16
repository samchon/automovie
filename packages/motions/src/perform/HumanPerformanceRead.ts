import type {
  IAutoMovieIntent,
  IAutoMovieResolvedBone,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
} from "@automovie/interface";

import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { HumanPerformanceGrips } from "./HumanPerformanceGrips";
import { HumanPerformanceHold } from "./HumanPerformanceHold";
import type { HumanPerformanceState } from "./HumanPerformanceState";
import { HumanPropHold } from "./HumanPropHold";
import { HumanSegment } from "./HumanSegment";
import { HumanSegmentSelection } from "./HumanSegmentSelection";
import type { IHumanProp } from "./IHumanProp";
import { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";

/**
 * What a performance is read by: a person's pose, posture and bones, a
 * prop's frame and the hands that hold it, the placed actions, a person's
 * root on the floor plan, and the refusals for what is missing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the functions return.
 * @evidence contracts/development/design.md#principled-representation The resolved-state records supply placed poses, raw postures, rigid frames and refusal fields; film seconds and world metres keep their existing owners.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The readers HumanPerformance, placement, holding, soft props and flights use; selection and grip-list assembly have separate owners, while resolved-person adapters remain private here.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Does not add a pose/FK cache or bypass availability refusals. Existing grip-cache publication stays with HumanPerformanceGrips and prop-frame seating with HumanPerformanceHold.
 */
export namespace HumanPerformanceRead {
  /**
   * A person's displayed canonical pose at a film second.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns The pose.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States person/exact film second; optional bone demand guarantees those frames and original root, while omission is complete. An optional same-body preparation is lent by the synchronous owner and never retained here.
   * @evidence contracts/development/implementation.md#principled-implementation Resolves the actual person and delegates to HumanSegment.displayed, preserving its placement, transition, overlay, contact and clamp policy.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One participant lookup and one displayed evaluation keep numerical ownership at the existing evaluator.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing persons retain their refusal. Bone observations preserve the root and every demanded frame, never enter the complete-pose cache and conservatively keep full complex composition; public pose queries omit the demand and remain complete.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds one Map lookup to the evaluator's existing cache lookup, selection and fit costs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the evaluator's existing settled pose cache and invalidation without adding a reader-level result cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Stores no state and returns the evaluator's original pose reference, including its existing cached ownership.
   */
  export function pose(
    self: HumanPerformanceState,
    subject: string,
    seconds: number,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    prepared?: prepareHumanSegmentPose.IPrepared,
  ): IAutoMoviePose {
    return HumanSegment.displayed(
      HumanPerformanceRead.person(self, subject),
      seconds,
      requested,
      prepared,
    );
  }

  /**
   * A person's active posture at a film second, before layers: the posture
   * the active action writes, or the standing posture before the first.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns The posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reads the active authored posture before layers, or the initial posture, optionally demanding only named channels whose values the caller inspects.
   * @evidence contracts/development/implementation.md#principled-implementation Selects the last matching placement through HumanSegmentSelection and reads its plan at the same duration-clamped local second.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the person once and share the private placed-posture reader with root queries.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the initial fallback, exact film second, 1e-12 entry allowance and original local-time clamp; adds no layer or displayed-pose substitution.
   * @evidence contracts/development/implementation.md#efficient-algorithms One participant lookup plus at most S reverse placement comparisons and the selected plan's posture cost, with no reversed array.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares selection and raw-posture implementation with root without memoizing authored postures across placement or query lifetimes.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the initial posture stays borrowed and an action result keeps that plan's existing ownership.
   */
  export function posture(
    self: HumanPerformanceState,
    subject: string,
    seconds: number,
    channels?: readonly AutoMovieMotionHumanChannel[],
  ): IHumanPosture {
    return placedPosture(HumanPerformanceRead.person(self, subject), seconds, channels);
  }

  /**
   * A person's world bones at a film second.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns Resolved bones by rig bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States person and film second; an optional requested set returns only those world bones, with the ordinary full map when absent.
   * @evidence contracts/development/implementation.md#principled-implementation The displayed evaluator may omit only independently proven free-goal fits for observational demands; contacts, overlays and transitions keep their complete evaluation. Canonical FK computes requested ancestor dependencies and still admits authored joints in order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One participant lookup feeds the private fresh-bones adapter also used by hand-frame queries.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every call still runs full FK admission and returns a fresh map and transforms; no bone-result cache is added.
   * @evidence contracts/development/implementation.md#efficient-algorithms One participant lookup, the demanded displayed evaluation and ordered joint admission plus demanded FK ancestry and output. Full queries keep their existing complete costs; no speedup is claimed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the resolved participant and one explicit same-body preparation across the actual displayed evaluation and final demanded FK. Different queries retain separate readers and fresh FK results; no canonical result is cached here.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous query owns one lazy rig/FK preparation until return or throw; no returned map or transform retains it. The caller owns the fresh FK map and nested transforms.
   */
  export function bones(
    self: HumanPerformanceState,
    subject: string,
    seconds: number,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    return placedBones(HumanPerformanceRead.person(self, subject), seconds, requested);
  }

  /**
   * A prop's world frame at a film second: its rest frame, or the bone it
   * is worn on, until a hand grips it, then carried by the gripping hand
   * with the offset it had when the grip closed, and left where the last
   * grip released it. A worn span is a grip by a bone: from the film's start
   * for a prop declared worn, from the instant an action puts it on
   * (`IHumanActionPlan.wears`), each to the next grip that takes it off; a
   * prop set on another prop's socket (`IHumanActionPlan.mounts`) rides
   * that socket the same way, posed as the other prop is.
   *
   * A grip is any action's contact window of kind `grip` on a hand whose
   * support is this prop. The hand's grip socket rides the hand bone, so the
   * prop is a child of the hand while held: the rigid coupling of the
   * engine's `IAutoMovieAttachment`, a bone plus an offset, with the offset
   * captured at the grip's start instead of authored. When grips overlap (a
   * handover), the one that closed last carries the prop, unless it is the
   * other hand of the performer already carrying it, which only steadies
   * it (a camera held in both hands). Two hands that close on it at the
   * same instant take it together: the prop is one rigid thing between the
   * two fists, each grip socket keeping its place on it (`HumanPropHold`; a
   * sled pushed by its two handles). A hold an action
   * leaves (`IHumanActionPlan.holds`) is a grip lasting until a later action
   * takes that hand over. Released props stay where the last grip to end
   * released them; falling is the physics layer's.
   *
   * A grip carries the prop only after it closes: at its first second the
   * prop is where it was, which is where the offset the grip keeps puts it
   * then. The offset is read off the hand at that second, whose pose may be
   * an action reading the prop; read there by the closing grip, the frame
   * would wait on itself.
   *
   * A performer reading a prop they carry themselves (`own`) reads it on
   * their own body as the read gives it (an action's, as it entered the
   * action), as a performer reads their own region: their displayed bones
   * at that second are the posture still being solved, and through the
   * hand that carries the prop they read the action reading it (a reload
   * pressing the magazine of the gun the other hand holds).
   *
   * @param subject The prop.
   * @param seconds Film seconds.
   * @param own The performer reading the prop and their own bones, for a prop they may carry.
   * @returns Its frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States rest, grip, worn/mounted and in-hand frames and the own-body callback used to avoid reading an action through itself.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the existing rigid hold, offset and in-hand composition to HumanPerformanceHold.prop with unchanged subject, second and own-body source.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One forwarding call keeps grip selection and frame seating at their existing owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves missing-prop refusals, motion providers and the complete own-body callback; no static frame replaces a carried or moving prop.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant wrapper work plus grip assembly/selection, pose/FK and frame composition demanded by the existing hold reader.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the existing grip list and seated-offset owners without a new per-time frame cache or callback memo.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The wrapper retains nothing; the delegated frame or motion provider preserves its original result ownership and existing state-cache lifetime.
   */
  export function prop(
    self: HumanPerformanceState,
    subject: string,
    seconds: number,
    own?: {
      subject: string;
      bones: (
        requested?: ReadonlySet<AutoMovieHumanoidBone>,
      ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
    },
  ): IHumanProp.IFrame {
    return HumanPerformanceHold.prop(self, subject, seconds, own);
  }

  /**
   * A person's placed actions, in order.
   *
   * @param subject The person.
   * @returns The segments.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States placement-order carrier actions for one person.
   * @evidence contracts/development/implementation.md#principled-implementation Returns the resolved person's actual carrier array in its authored placement order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One person lookup and one array-field read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not sort, clone or merge overlays into the carrier list; a missing person is still refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(1) lookup and reference return, without an output copy.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No evaluated work is coordinated; the state already owns the placed records.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Adds no retention and returns the existing borrowed array through a readonly view, without making its records immutable.
   */
  export function segments(
    self: HumanPerformanceState,
    subject: string,
  ): readonly HumanSegment.ISegment[] {
    return HumanPerformanceRead.person(self, subject).segments;
  }

  /**
   * The actions a person performs over their placed actions, in placement
   * order: each rides a carrier and takes only its claimed channels.
   *
   * @param subject The person.
   * @returns The overlays.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States placement-order overlays and their carrier/channel relationship.
   * @evidence contracts/development/implementation.md#principled-implementation Returns the resolved person's actual overlay records in their placement order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One participant lookup followed by one field read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not sort overlays by time or combine them with carriers; missing participants retain their refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(1) lookup and reference return, with no per-query array allocation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads existing records without coordinating an evaluation or creating a selection cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no additional state; the readonly result is the state's borrowed array and existing record references.
   */
  export function overlays(
    self: HumanPerformanceState,
    subject: string,
  ): readonly HumanSegment.IOverlay[] {
    return HumanPerformanceRead.person(self, subject).overlays;
  }

  /**
   * Every grip, worn and mounted span on a prop in film order; none for a fixture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the complete grip-list result and fixture exclusion; HumanPerformanceGrips owns collection and its existing cache.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the unchanged resolved state and subject to the dedicated grip-list owner, preserving window arithmetic and ordering.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One forwarding call separates grip assembly from public posture and frame reads.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No span, in-hand callback, cached return or resolving-state policy is altered by this wrapper.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds constant work to the existing cache lookup or complete ordered collection, worn-span closure and sort.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses HumanPerformanceGrips' per-state completed lists; introduces no second cache or result copy.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing itself; returned cached or newly published arrays keep the grip owner's existing ownership and resolved-state lifetime.
   */
  export function grips(
    self: HumanPerformanceState,
    subject: string,
  ): HumanPerformanceState.IGrip[] {
    return HumanPerformanceGrips.of(self, subject);
  }

  /**
   * A hand's grip-socket point with the hand bone's world rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the sided hand socket and world-frame result at film seconds.
   * @evidence contracts/development/implementation.md#principled-implementation Composes the body's actual grip socket with its displayed canonical bones through HumanPropHold.frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One participant lookup, one private fresh-bones read and one socket-frame composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the actual grip socket's bone and offset and ordered FK admission; observational resolution preserves that bone's exact displayed frame rather than substituting a wrist origin.
   * @evidence contracts/development/implementation.md#efficient-algorithms One participant lookup, the demanded displayed evaluation, the socket bone's FK ancestry and one rigid-frame composition; unrelated FK outputs are not built.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the already resolved person and same fresh-bones adapter as bones(); its one query-owned rig/FK preparation reaches displayed fitting and final socket FK, without sharing bone maps across queries.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous preparation releases on return or throw and no frame retains it; the returned frame keeps HumanPropHold.frame's existing value ownership.
   */
  export function hand(
    self: HumanPerformanceState,
    subject: string,
    side: "left" | "right",
    seconds: number,
  ): IHumanProp.IFrame {
    const person: HumanSegment.IPerson = HumanPerformanceRead.person(
      self,
      subject,
    );
    return HumanPropHold.frame(
      person.performer.body,
      placedBones(
        person,
        seconds,
        new Set([
          person.performer.body.surfaces.sockets[
            side === "left" ? "gripLeft" : "gripRight"
          ].bone,
        ]),
      ),
      { side },
    );
  }

  /**
   * Where a person's placed actions put their root at a film second, for a
   * law that plans from another person's path.
   *
   * While the schedule is being placed the path is known only up to the
   * person's last placed action. A second beyond it is refused when the
   * composition still holds actions of theirs to place, because the answer
   * would change once they are placed; with none left, the person stays
   * where the last action put them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States film-second root/yaw reading, the unresolved-future refusal and the held terminal posture when no actions remain.
   * @evidence contracts/development/implementation.md#principled-implementation Checks the same placed endpoint and remaining-intent count before reading the selected raw posture's root and heading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the person, apply the existing availability refusal, then use the private placed-posture reader once.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the 1e-9 availability allowance, refusal fields and feasible-range rounding; no future action or displayed offset is substituted for the raw path.
   * @evidence contracts/development/implementation.md#efficient-algorithms One participant lookup, constant availability bookkeeping and at most S reverse entry comparisons, followed by the selected plan's root-channel demand; other primitive writers run only when a root contributor declares their dependency.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares raw-posture selection with posture() and keeps the already resolved person instead of looking it up again.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Stores nothing; the returned wrapper is fresh while its position retains the selected posture's existing vector reference.
   */
  export function root(
    self: HumanPerformanceState,
    subject: string,
    seconds: number,
    axis: string,
  ): IHumanActionContext.IRoot {
    const person: HumanSegment.IPerson = HumanPerformanceRead.person(
      self,
      subject,
    );
    const last: HumanSegment.ISegment | undefined = person.segments.at(-1);
    const left: number =
      (self.intended.get(subject)?.length ?? 0) - person.segments.length;
    if (self.resolving && left > 0 && seconds > (last?.end ?? 0) + 1e-9)
      throw new HumanRefusal({
        kind: "participant",
        axis,
        value: subject,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: Math.floor((last?.end ?? 0) * 1000) / 1000,
          unit: "s",
        },
        reason: `where ${subject} is at ${seconds.toFixed(2)} s is not known yet: ${
          last === undefined
            ? "none of their actions is placed"
            : `their placed actions end at ${last.end.toFixed(2)} s with ${last.name}`
        }, and ${left} more of theirs come later in the composition`,
        fix: `compose ${subject}'s actions before self one: put their chain first in the parallel group, or join both chains with a mutual action`,
      });
    const posture: IHumanPosture = placedPosture(person, seconds, ["root"]);
    return { position: posture.root, yaw: posture.yaw };
  }

  /**
   * A person by subject, or a refusal listing the available performers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States subject lookup and the actionable alternatives on a miss.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the resolved people Map by the actual subject id and uses the existing missing-participant refusal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup, one absent branch and the original person return.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A miss never falls back to another performer or a generic body.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(1) on a hit; a miss copies U known subject keys for the refusal and formats their text.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads current state directly without a second participant cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Adds no state on a hit and returns the borrowed person; an error owns its newly collected alternatives array.
   */
  export function person(
    self: HumanPerformanceState,
    subject: string,
  ): HumanSegment.IPerson {
    const person: HumanSegment.IPerson | undefined = self.people.get(subject);
    if (person === undefined)
      throw HumanPerformanceRead.missing("performer", subject, [
        ...self.people.keys(),
      ]);
    return person;
  }

  /**
   * Locate an intent by performer, action and next occurrence of its id.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the performer/action fields and one-based occurrence among matching carrier and overlay ids.
   * @evidence contracts/development/implementation.md#principled-implementation Uses anchor or capability as the id and counts every matching already placed carrier and overlay before adding this occurrence.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional person lookup and two ordered counting loops precede one result assembly.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves duplicate ids and the initial occurrence of one for an unknown or unplaced person; no array is reordered or record deduplicated.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S+L) comparisons for S carriers and L overlays, with O(1) auxiliary space instead of concatenation/filter arrays and repeated Map lookups.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Counts from the same resolved person once without retaining a mutable occurrence index between placements.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing and returns a fresh scalar/string location record.
   */
  export function where(
    self: HumanPerformanceState,
    intent: IAutoMovieIntent,
  ): HumanRefusal.IWhere {
    const id: string = intent.anchor ?? intent.capability;
    const person: HumanSegment.IPerson | undefined = self.people.get(
      intent.subject,
    );
    let instance: number = 1;
    if (person !== undefined) {
      for (const segment of person.segments)
        if (segment.id === id) ++instance;
      for (const overlay of person.overlays)
        if (overlay.id === id) ++instance;
    }
    return {
      performer: intent.subject,
      act: intent.capability,
      instance,
    };
  }

  /**
   * Construct the missing-performer or missing-prop refusal with alternatives.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the refused object kind, id, supplied alternatives and optional caller-specific axis.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the existing HumanRefusal representation so kind, axis, value, alternatives, explanation and repair remain consistent with its formatted message.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One typed refusal construction owns no lookup or numerical evaluation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves prop affordance versus participant kind, the default axis and supplied alternatives; does not invent a fallback result.
   * @evidence contracts/development/implementation.md#efficient-algorithms Record assembly is constant work before HumanRefusal formats the K alternatives and their text.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each failure describes its actual inputs; no mutable Error or alternatives snapshot is memoized.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The new error retains the supplied alternatives reference through its feasible record; this constructor stores no global state or handle.
   */
  export function missing(
    what: "performer" | "prop",
    subject: string,
    known: readonly string[],
    axis: string = what,
  ): HumanRefusal {
    return new HumanRefusal({
      kind: what === "prop" ? "affordance" : "participant",
      axis,
      value: subject,
      feasible: { kind: "alternatives", values: known },
      reason: `the performance has no ${what} named ${subject}`,
      fix: `name one of the performance's ${what}s, or add ${subject} to them`,
    });
  }

  /** The raw active posture of an already resolved person, before layers. */
  function placedPosture(
    person: HumanSegment.IPerson,
    seconds: number,
    channels?: readonly AutoMovieMotionHumanChannel[],
  ): IHumanPosture {
    const active: HumanSegment.ISegment | undefined =
      HumanSegmentSelection.last(person.segments, seconds);
    return active === undefined
      ? person.initial
      : active.plan.posture(
          Math.min(active.plan.duration, Math.max(0, seconds - active.start)),
          channels,
        );
  }

  /** Fresh demanded FK for an already resolved person; never stores a bone map. */
  function placedBones(
    person: HumanSegment.IPerson,
    seconds: number,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const prepared: prepareHumanSegmentPose.IPrepared =
      prepareHumanSegmentPose(person.performer.body);
    return poseBones(
      person.performer.body,
      HumanSegment.displayed(person, seconds, requested, prepared),
      prepared.resolution(),
      requested,
    );
  }
}
