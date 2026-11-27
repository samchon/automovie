import { AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionWeaponPath,
  IAutoMovieResolveContactEvents,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";
import { StrikingWeapon } from "../../striking/internal/StrikingWeapon";
import type { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanSegmentStill } from "./HumanSegmentStill";

/** The record of `IContactsEventsBest`'s site. */
type IContactsEventsBest = { key: string; distance: number };

/**
 * The people a performance's contact resolution sweeps its weapons against
 * (`HumanPerformanceContacts.contacts`): each person's colliders on the bones
 * shown under the search's installed stops, 0 speed where the shown pose
 * provably holds still (`HumanSegmentStill`), and the weapon a met limb carries
 * when that limb is striking too, so its capsule nearest the striker stops with
 * it.
 *
 * @param prepared The contact resolution's prepared values.
 * @returns One body per person, in the cast's order.
 */
export function HumanPerformanceContactBodies(
  prepared: HumanPerformanceContactBodies.IPrepared,
): IAutoMovieResolveContactEvents.IBody[] {
  const {
    people,
    owners,
    readBones,
    apply,
  }: HumanPerformanceContactBodies.IPrepared = prepared;
  return people.map((person: IAutoMovieMotionHumanSegment.IPerson) => ({
    id: person.performer.subject,

    // 0 where the shown pose provably holds still, none elsewhere.
    speed: (
      _grid: IAutoMovieResolveContactEvents.IGrid,
      stops: IAutoMovieResolveContactEvents.IStops,
    ): IAutoMovieResolveContactEvents.Speed => {
      apply(stops);
      return (a: number, b: number): number | undefined =>
        HumanSegmentStill.within(person, a, b) ? 0 : undefined;
    },
    distance: (
      point: IAutoMovieVector3,
      seconds: number,
      stops: IAutoMovieResolveContactEvents.IStops,
    ): number => {
      apply(stops);
      return HumanColliders.distance(
        person.performer.body,
        readBones(person, seconds),
        point,
      ).distance;
    },
    axis: (
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
      seconds: number,
      stops: IAutoMovieResolveContactEvents.IStops,
      taper?: readonly [number, number],
    ): number => {
      apply(stops);
      return HumanColliders.distanceToSegment(
        person.performer.body,
        readBones(person, seconds),
        a,
        b,
        taper,
      ).distance;
    },

    // The limb a weapon met may be striking too. Its capsule and the
    // collider the striker measured are two measures of that one
    // limb, so the capsule nearest the striker's axis stops with it.
    carried: (
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
      seconds: number,
      stops: IAutoMovieResolveContactEvents.IStops,
    ): string | undefined => {
      apply(stops);
      const bone: AutoMovieHumanoidBone = HumanColliders.distanceToSegment(
        person.performer.body,
        readBones(person, seconds),
        a,
        b,
      ).bone;
      const part: RegExpExecArray | null =
        /^(left|right)(?:(UpperLeg|LowerLeg|Foot|Toes)|(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little))/.exec(
          bone,
        );
      if (part === null) return undefined;
      const limb: string = `${part[1]}${part[2] === undefined ? "Arm" : "Leg"}`;
      let best: IContactsEventsBest | undefined;
      const eligible: (readonly [string, IAutoMovieMotionWeaponPath])[] = [];
      for (const [key, owner] of owners) {
        if (
          owner.person !== person ||
          owner.limb !== limb ||
          stops.has(key) ||
          seconds < owner.from ||
          seconds > owner.to
        )
          continue;
        eligible.push([key, owner.weapon]);
      }
      const sampled: ReadonlyMap<
        IAutoMovieMotionWeaponPath,
        StrikingWeapon.IAxis
      > = StrikingWeapon.sample(
        eligible.map(([, weapon]): IAutoMovieMotionWeaponPath => weapon),
        seconds,
      );
      for (const [key, weapon] of eligible) {
        const [p, q]: StrikingWeapon.IAxis = sampled.get(weapon)!;
        const distance: number = AutoMovieEngineMath.segmentSegmentDistance(a, b, p, q ?? p);
        if (best === undefined || distance < best.distance)
          best = { key, distance };
      }
      return best?.key;
    },
  }));
}

/** Companion types of {@link HumanPerformanceContactBodies}. */
export namespace HumanPerformanceContactBodies {
  /** A weapon's owner: the person, the action and the weapon's live window. */
  export interface IOwner {
    /** The striking person. */
    person: IAutoMovieMotionHumanSegment.IPerson;

    /** The action that carries the weapon. */
    segment: IAutoMovieMotionHumanSegment;

    /** The weapon's id within its action. */
    id: string;

    /** The limb that carries it. */
    limb: IAutoMovieMotionWeaponPath["limb"];

    /** Its first live film second. */
    from: number;

    /** Its last live film second. */
    to: number;

    /** The weapon. */
    weapon: IAutoMovieMotionWeaponPath;
  }

  /** What `HumanPerformanceContacts.contacts` prepared before its bodies. */
  export interface IPrepared {
    /** The performance's cast, in order. */
    people: readonly IAutoMovieMotionHumanSegment.IPerson[];

    /** Every weapon's owner, by the weapon's key. */
    owners: ReadonlyMap<string, IOwner>;

    /** A person's shown bones at a second, under the installed stops. */
    readBones: (
      person: IAutoMovieMotionHumanSegment.IPerson,
      seconds: number,
    ) => ReturnType<typeof HumanPerformanceRead.bones>;

    /** Install a search's stops before a read. */
    apply: (stops: IAutoMovieResolveContactEvents.IStops) => void;
  }
}
