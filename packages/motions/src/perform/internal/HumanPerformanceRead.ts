import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanPerformanceGrips } from "./HumanPerformanceGrips";
import { HumanPerformanceHold } from "./HumanPerformanceHold";
import { HumanPerformanceReadMissing } from "./HumanPerformanceReadMissing";
import { HumanPerformanceReadWhere } from "./HumanPerformanceReadWhere";
import { HumanPerformanceTether } from "./HumanPerformanceTether";
import { HumanPropHold } from "./HumanPropHold";
import { HumanSegment } from "./HumanSegment";
import { HumanSegmentShown } from "./HumanSegmentShown";
import { placeDemandedHumanPerformer } from "./placeDemandedHumanPerformer";
import { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";
import { readPlacedHumanPosture } from "./readPlacedHumanPosture";

/** The reader of a refusal's axis, read only when the read is refused. */
type AvailableAxis = () => string;

/** The reader of a refusal's axis, read only when the read is refused. */
type WhenAxis = () => string;

/** The reader of a refusal's axis, read only when the read is refused. */
type RootAxis = () => string;

/** The record of `IPropOwn`'s site. */
type IPropOwn = {
  subject: string;
  bones: (
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
};

/** The reader of a refusal's axis, read only when the read is refused. */
type BonesAxis = () => string;

/** The reader of a refusal's axis, read only when the read is refused. */
type PostureAxis = () => string;

/**
 * What a performance is read by: a person's pose, posture and bones, a prop's
 * frame and the hands that hold it, the placed actions, a person's root on the
 * floor plan, and the refusals for what is missing.
 */
export namespace HumanPerformanceRead {
  /**
   * A person's displayed canonical pose at a film second.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns The pose.
   */
  export function pose(
    self: IAutoMovieMotionHumanPerformanceState,
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
   * A person's active posture at a film second, before layers: the posture the
   * active action writes, or the standing posture before the first.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @param met The person's meeting instant the reading action recorded when it
   *   was placed, if they share a parallel group.
   * @returns The posture.
   */
  export function posture(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
    channels?: readonly AutoMovieMotionHumanChannel[],
    axis?: PostureAxis,
    met?: number,
  ): IAutoMovieMotionHumanPosture {
    if (axis === undefined)
      return readPlacedHumanPosture(
        HumanPerformanceRead.person(self, subject),
        seconds,
        channels,
      );
    const read: IAvailable = available(self, subject, seconds, axis, met);
    return readPlacedHumanPosture(read.person, read.seconds, channels);
  }

  /**
   * A person's world bones at a film second.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @param axis For a law's read of another performer, the refusal's axis: the
   *   read is cleared, and a person not placed yet placed first, as a root or
   *   posture read is.
   * @param met The person's meeting instant the reading action recorded when it
   *   was placed, if they share a parallel group.
   * @returns Resolved bones by rig bone.
   */
  export function bones(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    axis?: BonesAxis,
    met?: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    if (axis === undefined)
      return placedBones(
        HumanPerformanceRead.person(self, subject),
        seconds,
        requested,
      );
    // A law's read of another performer is cleared as a root or posture read
    // is (`available`), so a person not placed yet is never read standing at
    // their first pose.
    const read: IAvailable = available(self, subject, seconds, axis, met);
    return placedBones(read.person, read.seconds, requested);
  }

  /**
   * Prepare fixed actor/body and requested names for one synchronous contact
   * scan. Keep this actor registry entry and body unchanged until releasing the
   * reader; each queried second still observes current plans, stops and
   * invalidation.
   */
  export function prepareBones(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): (seconds: number) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const person: IAutoMovieMotionHumanSegment.IPerson =
      HumanPerformanceRead.person(self, subject);
    const names: ReadonlySet<AutoMovieHumanoidBone> | undefined =
      requested === undefined ? undefined : new Set(requested);
    const read: Parameters<typeof HumanSegmentShown.bones>[4] =
      names === undefined
        ? undefined
        : { pose: poseBones.prepare(person.performer.body, names) };
    const prepare: ReturnType<typeof prepareHumanSegmentPose.queries> =
      prepareHumanSegmentPose.queries(person.performer.body);
    return (
      seconds: number,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      placedBones(person, seconds, names, read, prepare());
  }

  /**
   * A prop's world frame at a film second: its rest frame, or the bone it is
   * worn on, until a hand grips it, then carried by the gripping hand with the
   * offset it had when the grip closed, and left where the last grip released
   * it. A worn span is a grip by a bone: from the film's start for a prop
   * declared worn, from the instant an action puts it on
   * (`IHumanActionPlan.wears`), each to the next grip that takes it off; a prop
   * initially mounted or placed by an action (`IHumanActionPlan.mounts`) rides
   * the other prop's posed socket in the same way.
   *
   * A grip is any action's contact window of kind `grip` on a hand whose
   * support is this prop. The hand's grip socket rides the hand bone, so the
   * prop is a child of the hand while held: the rigid coupling of the engine's
   * `IAutoMovieAttachment`, a bone plus an offset, with the offset captured at
   * the grip's start instead of authored. When grips overlap (a handover), the
   * one that closed last carries the prop, unless it is the other hand of the
   * performer already carrying it, which only steadies it (a camera held in
   * both hands). Two hands that close on it at the same instant take it
   * together: the prop is one rigid thing between the two fists, each grip
   * socket keeping its place on it (`HumanPropHold`; a sled pushed by its two
   * handles). A hold an action leaves (`IHumanActionPlan.holds`) is a grip
   * lasting until a later action takes that hand over. Released props stay
   * where the last grip to end released them; falling is the physics layer's. A
   * line running to the prop from another (`IAutoMovieMotionHumanProp.tethers`)
   * holds it within the line's length while no hand or wear carries it.
   *
   * A grip carries the prop only after it closes: at its first second the prop
   * is where it was, which is where the offset the grip keeps puts it then. The
   * offset is read off the hand at that second, whose pose may be an action
   * reading the prop; read there by the closing grip, the frame would wait on
   * itself.
   *
   * A performer reading a prop they carry themselves (`own`) reads it on their
   * own body as the read gives it (an action's, as it entered the action), as a
   * performer reads their own region: their displayed bones at that second are
   * the posture still being solved, and through the hand that carries the prop
   * they read the action reading it (a reload pressing the magazine of the gun
   * the other hand holds).
   *
   * @param subject The prop.
   * @param seconds Film seconds.
   * @param own The performer reading the prop and their own bones, for a prop
   *   they may carry.
   * @returns Its frame.
   */
  export function prop(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
    own?: IPropOwn,
  ): IAutoMovieRigidTransform {
    // A line running to the prop holds it within its length (`HumanPerformanceTether`).
    return HumanPerformanceTether.pull(
      self,
      subject,
      seconds,
      HumanPerformanceHold.prop(self, subject, seconds, own),
      (other: string, at: number): IAutoMovieRigidTransform =>
        prop(self, other, at),
    );
  }

  /**
   * A person's placed actions, in order.
   *
   * @param subject The person.
   * @returns The segments.
   */
  export function segments(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
  ): readonly IAutoMovieMotionHumanSegment[] {
    return HumanPerformanceRead.person(self, subject).segments;
  }

  /**
   * The actions a person performs over their placed actions, in placement
   * order: each rides a carrier and takes only its claimed channels.
   *
   * @param subject The person.
   * @returns The overlays.
   */
  export function overlays(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
  ): readonly IAutoMovieMotionHumanSegment.IOverlay[] {
    return HumanPerformanceRead.person(self, subject).overlays;
  }

  /**
   * Every grip, worn and mounted span on a prop in film order; none for a
   * fixture.
   */
  export function grips(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
  ): IAutoMovieMotionHumanPerformanceState.IGrip[] {
    return HumanPerformanceGrips(self, subject);
  }

  /** A hand's grip-socket point with the hand bone's world rotation. */
  export function hand(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    side: AutoMovieHumanSide,
    seconds: number,
  ): IAutoMovieRigidTransform {
    const person: IAutoMovieMotionHumanSegment.IPerson =
      HumanPerformanceRead.person(self, subject);
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
   * Where a person's placed actions put their root at a film second, for a law
   * that plans from another person's path.
   *
   * While the schedule is being placed the path is known only up to the
   * person's last placed action. A second beyond it is refused when the
   * composition still holds actions of theirs to place, because the answer
   * would change once they are placed; with none left, the person stays where
   * the last action put them. A partner of the reading action's own parallel
   * group is read no later than the instant (`met`) the action recorded when it
   * was placed: the end of the partner's placed actions, where their part still
   * waited.
   */
  export function root(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
    axis: RootAxis,
    met?: number,
  ): IAutoMovieMotionHumanActionContext.IRoot {
    const read: IAvailable = available(self, subject, seconds, axis, met);
    const posture: IAutoMovieMotionHumanPosture = readPlacedHumanPosture(
      read.person,
      read.seconds,
      ["root"],
    );
    return { position: posture.root, yaw: posture.yaw };
  }

  /**
   * The film second a law reads another performer at: the asked one, or, for a
   * performer of the reader's own parallel group while an action is timed, no
   * later than the end of their placed actions when the reading action was
   * placed, where their part still waited; refused where the performer is not
   * known there.
   *
   * @param subject The performer read.
   * @param seconds Film seconds.
   * @param axis The reader of the refusal's axis.
   * @param met The performer's meeting instant the reader recorded when it was
   *   placed, if it shares a parallel group with them.
   * @returns The second to read the performer at.
   * @throws {HumanRefusal} When where the performer is at that second is not
   *   known yet.
   */
  export function when(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
    axis: WhenAxis,
    met?: number,
  ): number {
    return available(self, subject, seconds, axis, met).seconds;
  }

  /**
   * Apply the original unresolved-future refusal without evaluating a raw
   * posture.
   */
  function available(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
    axis: AvailableAxis,
    met?: number,
  ): IAvailable {
    const person: IAutoMovieMotionHumanSegment.IPerson =
      HumanPerformanceRead.person(self, subject);
    // A person whose part still waits is placed first where the read needs
    // it, holding their placed pose up to that part's start
    // (`placeDemandedHumanPerformer`), a partner of the reader's own group as
    // much as a person of another. Only a partner whose part cannot be
    // placed before this read, because it is itself waiting on the reader (a
    // cycle of reads), is read no later than the end of their placed actions
    // (`met`, recorded when the reader was placed, or the end of what has
    // been placed since). Once the partner's own actions are all placed, a
    // lazy read (the contact resolution's, the display's) reads them live: a
    // coupling rides its partner frame by frame, and it reads what the
    // reader was planned against.
    const meeting: boolean =
      met !== undefined &&
      (self.intended.get(subject)?.length ?? 0) > person.segments.length;
    const held: boolean = placeDemandedHumanPerformer(
      self,
      person,
      subject,
      seconds,
      axis,
      meeting,
    );
    const last: IAutoMovieMotionHumanSegment | undefined =
      person.segments.at(-1);
    const waits: boolean =
      (self.intended.get(subject)?.length ?? 0) > person.segments.length;
    const at: number =
      meeting && waits
        ? Math.min(seconds, Math.max(met!, last?.end ?? 0))
        : seconds;
    const left: number =
      (self.intended.get(subject)?.length ?? 0) - person.segments.length;
    const known: number = Math.max(
      last?.end ?? 0,
      self.horizon?.(subject) ?? -Infinity,
    );
    if (!held && self.resolving && left > 0 && at > known + 1e-9)
      throw new HumanRefusal({
        kind: "participant",
        axis: axis(),
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
        fix: `compose ${subject}'s actions before this one: put their chain first in the parallel group, or join both chains with a mutual action`,
      });
    return { person, seconds: at };
  }

  /** A person cleared for a read, and the film second to read them at. */
  interface IAvailable {
    /** The person. */
    person: IAutoMovieMotionHumanSegment.IPerson;

    /**
     * The second the person is read at: the asked one, or no later than the
     * recorded end of a waiting partner's placed actions.
     */
    seconds: number;
  }

  /** A person by subject, or a refusal listing the available performers. */
  export function person(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
  ): IAutoMovieMotionHumanSegment.IPerson {
    const person: IAutoMovieMotionHumanSegment.IPerson | undefined =
      self.people.get(subject);
    if (person === undefined)
      throw HumanPerformanceRead.missing("performer", subject, [
        ...self.people.keys(),
      ]);
    return person;
  }

  /**
   * Locate an intent by performer, action and next occurrence of its id
   * (`HumanPerformanceReadWhere`).
   */
  export const where: typeof HumanPerformanceReadWhere =
    HumanPerformanceReadWhere;

  /**
   * The missing-performer or missing-prop refusal with alternatives
   * (`HumanPerformanceReadMissing`).
   */
  export const missing: typeof HumanPerformanceReadMissing =
    HumanPerformanceReadMissing;

  /** Read the same raw root for projectile broad-phase rejection. */
  export function projectileRoot(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
  ): IAutoMovieMotionHumanPosture["root"] {
    return readPlacedHumanPosture(
      HumanPerformanceRead.person(self, subject),
      seconds,
    ).root;
  }
  /**
   * Fresh demanded bones of an already resolved person's displayed pose
   * (`HumanSegmentShown.bones`); never stores a bone map.
   */
  function placedBones(
    person: IAutoMovieMotionHumanSegment.IPerson,
    seconds: number,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    bound?: Parameters<typeof HumanSegmentShown.bones>[4],
    prepared: prepareHumanSegmentPose.IPrepared = prepareHumanSegmentPose(
      person.performer.body,
    ),
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    return HumanSegmentShown.bones(person, seconds, requested, prepared, bound);
  }
}
