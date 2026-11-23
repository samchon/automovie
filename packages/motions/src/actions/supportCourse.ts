import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { prepareSupportFootCourse } from "./prepareSupportFootCourse";
import { supportContact } from "./supportContact";
import { supportWindows } from "./supportWindows";

/**
 * The fixed-geometry requirements a staged route hands the support law:
 * world waypoints a stepping foot passes over an edge, the contacts whose
 * foot bears flat with a level heel, and a reader of each published window.
 * The support law (`support.plan`) owns the keys and the clock; this module
 * owns only the goals and writers those requirements add.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three requirements, their frames and which owner keeps the keys and clock.
 * @evidence contracts/development/design.md#principled-representation World-metre waypoints and contact predicates on the support law's own contact records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The course record and the goal and writer helpers support.plan calls; planLadderAccess and planNamedCrossing build courses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No posture is typed: every goal is a point of the staged fixtures, fitted by the shared support keys.
 */
export namespace supportCourse {
  /**
   * The requirements of one staged route; each is optional.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its input, output and frame.
   * @evidence contracts/development/design.md#principled-representation Callbacks over the support law's contact records, returning world metres or a predicate.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three requirements the ladder access and vault courses use.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None restates a key posture or a time.
   */
  export interface ICourse {
    /**
     * Ordered world points, metres, the toe joint of a foot stepping from
     * `previous` to `next` passes over; the ordinary mid-step swing when
     * undefined or empty.
     */
    via?(
      previous: IAutoMovieMotionHumanSupport.IContact,
      next: IAutoMovieMotionHumanSupport.IContact,
    ): readonly IAutoMovieVector3[] | undefined;

    /** Whether a foot bearing on this contact keeps its sole flat with the heel level. */
    level?(contact: IAutoMovieMotionHumanSupport.IContact): boolean;

    /** Told of each published contact window with the contact that opened it. */
    observe?: supportWindows.Observe;
  }

  /**
   * A contact's place: a world point in metres, or null for an unnamed floor place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, units and null meaning.
   * @evidence contracts/development/design.md#principled-representation The same lookup the support keys use.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by levels and swings.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A null place yields no goal rather than an invented point.
   */
  export type Place = (
    contact: IAutoMovieMotionHumanSupport.IContact,
  ) => IAutoMovieVector3 | null;

  /**
   * A writer of one foot onto its course at a share in [0, 1] of the interval.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the share's range and the effect.
   * @evidence contracts/development/design.md#principled-representation The share is the interval's own minimum-jerk weight.
   * @evidence contracts/development/design.md#minimal-and-owned-surface prepareSupportFootCourse returns it and support.plan applies it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It writes only its own leg and toes.
   */
  export type Write = (
    posture: IAutoMovieMotionHumanPosture,
    share: number,
  ) => IAutoMovieMotionHumanPosture;

  /**
   * One stepping limb's move with the waypoints its course gives.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The contact it leaves, the one it reaches and world-metre waypoints.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by swings and support.plan's lift keys.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An empty list keeps the ordinary swing.
   */
  export interface ICrossing {
    /** The contact the limb steps to. */
    contact: IAutoMovieMotionHumanSupport.IContact;

    /** The contact it leaves. */
    previous: IAutoMovieMotionHumanSupport.IContact;

    /** World points, metres, its toe joint passes over in order; empty for the ordinary swing. */
    waypoints: readonly IAutoMovieVector3[];
  }

  /**
   * One stepping foot's straight stretch between two course points.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The foot, its heading and two toe-joint points in world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What carried needs to build the stretch's writer.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Built only by swings.
   */
  export interface ILeg {
    /** The stepping foot. */
    side: AutoMovieHumanSide;

    /** The heading the foot keeps, degrees. */
    yaw: number;

    /** The toe joint's start, world metres. */
    from: IAutoMovieVector3;

    /** The toe joint's end, world metres. */
    to: IAutoMovieVector3;
  }

  /**
   * A solved key as the level bearings read it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The key's heading, contacts and place lookup.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three fields bearings reads from support.plan's keys.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reads the keys without changing them.
   */
  export interface IKey {
    /** The key posture, whose yaw orders the flat foot. */
    posture: IAutoMovieMotionHumanPosture;

    /** The contacts it rests on. */
    contacts: readonly IAutoMovieMotionHumanSupport.IContact[];

    /** Where those contacts are. */
    place: Place;
  }

  /**
   * The flat-foot writers of each key, and of each interval the bearing spans.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the indexing of both lists.
   * @evidence contracts/development/design.md#principled-representation Indexed by key and by the interval that starts at that key.
   * @evidence contracts/development/design.md#minimal-and-owned-surface support.plan's transfer reads both.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An interval keeps only bearings held at both of its keys.
   */
  export interface IBearings {
    /** Writers for the contacts level at each key, by key index. */
    keys: readonly (readonly Write[])[];

    /** Writers for the level contacts held through each interval, by its first key's index. */
    intervals: readonly (readonly Write[])[];
  }

  /**
   * The level-heel goal of a foot: its heel socket's sole normal pointing
   * down at the toe joint's height.
   *
   * @param body The canonical motion body.
   * @param part The foot.
   * @param at The toe joint's goal, world metres.
   * @returns A fit target on the heel bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the goal, its frame and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The toe joint's elevation alone leaves the ankle free to point the heel into the floor; the rigid hindfoot is levelled by aligning its sole normal with the world's down at the same height.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One target record shared by swing and bearing goals.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the body's own heel socket.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one small record.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function heel(
    body: IAutoMovieMotionHumanBody,
    part: IAutoMovieMotionHumanSupport.Part,
    at: IAutoMovieVector3,
  ): IAutoMovieMotionHumanBodyFitTypes.ITarget {
    const socket: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.sockets[part === "leftFoot" ? "heelLeft" : "heelRight"];
    return {
      bone: socket.bone,
      axes: [],
      goal: at,
      normal: { local: socket.normal, world: { x: 0, y: -1, z: 0 } },
    };
  }

  /**
   * The level-heel goals of the course's level feet among the contacts.
   *
   * @param body The canonical motion body.
   * @param course The route's requirements, if any.
   * @param contacts The key's contacts.
   * @param place Where they are.
   * @returns One heel goal per placed level foot; none without a course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the empty case.
   * @evidence contracts/development/implementation.md#principled-implementation A bearing foot on a level fixture keeps its whole sole on it, so the heel goal accompanies the toe goal at the same height.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Filters the contacts by the course's own predicate.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only feet the course names receive a goal.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the key's contacts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each key's goals are built once by its solve.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function levels(
    body: IAutoMovieMotionHumanBody,
    course: ICourse | undefined,
    contacts: readonly IAutoMovieMotionHumanSupport.IContact[],
    place: Place,
  ): IAutoMovieMotionHumanBodyFitTypes.ITarget[] {
    const level: ICourse["level"] = course?.level;
    if (level === undefined) return [];
    return contacts.flatMap(
      (
        contact: IAutoMovieMotionHumanSupport.IContact,
      ): IAutoMovieMotionHumanBodyFitTypes.ITarget[] => {
        if (!contact.part.endsWith("Foot") || !level(contact)) return [];
        const point: IAutoMovieVector3 | null = place(contact);
        return point === null ? [] : [heel(body, contact.part, point)];
      },
    );
  }

  /**
   * The free-foot writers of one stretch of a step that passes waypoints:
   * stretch 0 runs from the old place to the first waypoint, stretch k from
   * waypoint k to k + 1, and stretch `steps` to the new place.
   *
   * @param yaw The heading each foot keeps, degrees: the one it leaves with.
   * @param crossings The step's moving limbs.
   * @param index The stretch.
   * @param steps The number of waypoints of the longest crossing.
   * @param from The old place lookup.
   * @param to The new place lookup.
   * @returns One stretch per foot that has waypoints and placed ends.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the stretch numbering, units and result.
   * @evidence contracts/development/implementation.md#principled-implementation A fitted key alone does not keep the swept foot above an edge between two keys; a straight toe-joint course between consecutive waypoints does, since each waypoint already clears the edge.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolves the stretch's two ends and delegates the foot to prepareSupportFootCourse.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Hands and feet without waypoints keep the support law's own interval.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per crossing; called once per stretch at plan time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each stretch is distinct.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The writers are retained by the plan for its lifetime.
   */
  export function swings(
    yaw: (foot: AutoMovieHumanSide) => number,
    crossings: readonly ICrossing[],
    index: number,
    steps: number,
    from: Place,
    to: Place,
  ): ILeg[] {
    const legs: ILeg[] = [];
    for (const crossing of crossings) {
      const waypoints: readonly IAutoMovieVector3[] = crossing.waypoints;
      if (waypoints.length === 0 || !crossing.contact.part.endsWith("Foot"))
        continue;
      const start: IAutoMovieVector3 | null =
        index === 0
          ? from(crossing.previous)
          : waypoints[Math.min(index, waypoints.length) - 1]!;
      const end: IAutoMovieVector3 | null =
        index === steps
          ? to(crossing.contact)
          : waypoints[Math.min(index, waypoints.length - 1)]!;
      if (start === null || end === null) continue;
      legs.push({ side: side(crossing.contact), yaw: yaw(side(crossing.contact)), from: start, to: end });
    }
    return legs;
  }

  /**
   * The free-foot writer of one stretch, carried by the root between the
   * interval's two keys.
   *
   * @param body The canonical motion body.
   * @param leg The stretch.
   * @param rootFrom The root at the interval's first key, world metres.
   * @param rootTo The root at its second key, world metres.
   * @returns The writer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and the result.
   * @evidence contracts/development/implementation.md#principled-implementation While the root travels the stretch is expressed in the root's frame, so the foot's offset blends between two reachable offsets and stays reachable.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates to prepareSupportFootCourse with both key roots.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The stretch's ends are the course's own points, a place on the floor plane read at the toes' joint's flat height above it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation per stretch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each stretch is distinct.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The writer lives as long as the plan.
   */
  export function carried(
    body: IAutoMovieMotionHumanBody,
    leg: ILeg,
    rootFrom: IAutoMovieVector3,
    rootTo: IAutoMovieVector3,
  ): Write {
    // A place on the floor plane is the sole's, the foot bearing flat on it;
    // the course is the toes' joint's, which then stands its flat height
    // above the floor.
    const joint: number = HumanFoot.point(body, leg.side, "mtp", {
      ankle: { x: 0, y: body.measure.ankleHeight, z: 0 },
      rotation: HumanFoot.rotation(0, 0),
    }).y;
    const toes: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
      point: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      supportContact.onFloorTarget(point)
        ? { ...point, y: point.y + joint }
        : point;
    return prepareSupportFootCourse(
      body,
      leg.side,
      leg.yaw,
      toes(leg.from),
      toes(leg.to),
      false,
      rootFrom,
      rootTo,
    );
  }
  /**
   * The flat-foot writers of the course's level feet at every key and over
   * every interval that holds them at both ends.
   *
   * @param body The canonical motion body.
   * @param course The route's requirements, if any.
   * @param keys The solved keys in order.
   * @returns The writers, or undefined without a level predicate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result's indexing and the undefined case.
   * @evidence contracts/development/implementation.md#principled-implementation The joint-space blend between keys can tilt a bearing foot; writing the foot flat at its placed toe point keeps the sole on the level fixture through the interval.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds per-key writers once, then keeps those held to the next key for the interval.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only feet the course names and that bear at both keys are written.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in keys times contacts at plan time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work An interval reuses its first key's writer for the same contact, since the place and yaw are the same.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The plan retains the writers for its lifetime.
   */
  export function bearings(
    body: IAutoMovieMotionHumanBody,
    course: ICourse | undefined,
    keys: readonly IKey[],
  ): IBearings | undefined {
    const level: ICourse["level"] = course?.level;
    if (level === undefined) return undefined;
    // A foot holds one heading on its place for as long as it bears there:
    // the heading the first key placing it there solved.
    const held: IHeldHeading[] = [];
    const headingOf: (
      key: IKey,
      contact: IAutoMovieMotionHumanSupport.IContact,
    ) => number = (
      key: IKey,
      contact: IAutoMovieMotionHumanSupport.IContact,
    ): number => {
      const known: IHeldHeading | undefined = held.find(
        (h: IHeldHeading): boolean => supportContact.same(h.contact, contact),
      );
      if (known !== undefined) return known.heading;
      const heading: number = footHeading(body, key.posture, side(contact));
      held.push({ contact, heading });
      return heading;
    };
    const placed: IPlacedBearing[][] = keys.map((key: IKey): IPlacedBearing[] =>
      key.contacts.flatMap(
        (contact: IAutoMovieMotionHumanSupport.IContact): IPlacedBearing[] => {
          if (!contact.part.endsWith("Foot") || !level(contact)) return [];
          const point: IAutoMovieVector3 | null = key.place(contact);
          if (point === null) return [];
          return [
            {
              contact,
              // The foot keeps the heading its key solved it to (turned out
              // from the body's), so writing it flat does not swing its
              // ankle about the toes' joint.
              write: prepareSupportFootCourse(
                body,
                side(contact),
                headingOf(key, contact),
                point,
                point,
                true,
              ),
            },
          ];
        },
      ),
    );
    return {
      keys: placed.map((bearing: IPlacedBearing[]): Write[] =>
        bearing.map((b: IPlacedBearing): Write => b.write),
      ),
      intervals: placed.map(
        (bearing: IPlacedBearing[], index: number): Write[] =>
          bearing
            .filter(
              (b: IPlacedBearing): boolean =>
                keys[index + 1]?.contacts.some(
                  (next: IAutoMovieMotionHumanSupport.IContact): boolean =>
                    supportContact.same(b.contact, next),
                ) ?? false,
            )
            .map((b: IPlacedBearing): Write => b.write),
      ),
    };
  }

  /**
   * The heading a posture turns a foot to, degrees: its posed foot's.
   *
   * @param body The canonical motion body.
   * @param posture The posture.
   * @param foot Which foot.
   * @returns The foot's heading about the vertical, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and its unit.
   * @evidence contracts/development/implementation.md#principled-implementation The posed foot bone's rotation decomposed by HumanFoot.heading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolve, one demanded bone, one heading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The foot's own heading, not the body's.
   * @evidence contracts/development/implementation.md#efficient-algorithms Forward kinematics of the foot's chain alone.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per key and foot at plan time.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function footHeading(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    foot: AutoMovieHumanSide,
  ): number {
    const bone: AutoMovieHumanoidBone = `${foot}Foot`;
    return HumanFoot.heading(
      poseBones(
        body,
        resolveHumanPosture(body, posture),
        undefined,
        new Set<AutoMovieHumanoidBone>([bone]),
      ).get(bone)!.worldRotation,
    );
  }

  /**
   * Apply writers in order.
   *
   * @param writes The writers; none when undefined.
   * @param posture The posture they start from.
   * @param share The interval's share.
   * @returns The written posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the empty case.
   * @evidence contracts/development/implementation.md#principled-implementation Each writer owns a different leg, so their order does not matter.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One fold.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Writes only what the writers own.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the writers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing is shared between calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function apply(
    writes: readonly Write[] | undefined,
    posture: IAutoMovieMotionHumanPosture,
    share: number,
  ): IAutoMovieMotionHumanPosture {
    if (writes === undefined) return posture;
    return writes.reduce(
      (
        current: IAutoMovieMotionHumanPosture,
        write: Write,
      ): IAutoMovieMotionHumanPosture => write(current, share),
      posture,
    );
  }
}

/** A level contact and the heading its foot holds there, degrees. */
interface IHeldHeading {
  /** The bearing contact. */
  contact: IAutoMovieMotionHumanSupport.IContact;

  /** The foot's heading on it, degrees. */
  heading: number;
}

/** A level contact and its flat-foot writer. */
interface IPlacedBearing {
  /** The bearing contact. */
  contact: IAutoMovieMotionHumanSupport.IContact;

  /** Its writer. */
  write: supportCourse.Write;
}

/** The side of a foot contact. */
function side(
  contact: IAutoMovieMotionHumanSupport.IContact,
): AutoMovieHumanSide {
  return contact.part.startsWith("left") ? "left" : "right";
}
