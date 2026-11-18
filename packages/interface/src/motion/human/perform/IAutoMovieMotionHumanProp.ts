import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieAffordance } from "../../../model/IAutoMovieAffordance";
import type { IAutoMovieBody } from "../../../model/IAutoMovieBody";
import type { IAutoMoviePhysicalShape } from "../../../physics/IAutoMoviePhysicalShape";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieSoftBodyDomain } from "../../../soft/IAutoMovieSoftBodyDomain";
import type { AutoMovieMotionHumanScheduledInstant } from "../law/AutoMovieMotionHumanScheduledInstant";

/**
 * A prop actions can aim at and hands can hold: a subject id, its world
 * frame at rest, and its named points in that frame, such as a heavy bag's
 * striking surface, a pad's face or a cup's handle.
 *
 * The prop stays at its rest frame, or on the bone it is worn on, until a
 * hand grips it; while gripped it rides the hand, unless it is a fixture, worn it rides its bone,
 * and it stays where the last grip released it, or flies from a launch and rests where it struck (see `HumanPerformance.prop`). A point's normal points out of the prop's
 * surface.
 *
 * @evidence contracts/development/common.md#meaningful-documentation points: Named points in the prop's frame, metres, with outward unit normals. worn: The person and bone the prop is worn on from the film's start, with its frame in the bone's posed frame: a hat on the head, a holster on the hips. While worn it rides that bone and `frame` is not read; a grip takes it off, and an action's `wears` puts it on again. Not worn when absent. fixed: Whether the prop is a fixture: a thing set in the scene that bears on the floor or a wall and is never lifted, such as a ladder, a rail or a wall bar. A hand that grips a fixture bears on it, as a climber's hand on a rung, and never carries it, so it stays at its rest frame whatever grips it. Not a fixture when absent. position: Origin, world metres. offset: The prop's frame in the bone's posed frame, metres. shapes: Its colliders, with the moved parts' colliders moved; absent when the prop declares none.
 * @evidence contracts/development/design.md#principled-representation points: Named points in the prop's frame, metres, with outward unit normals. worn: The person and bone the prop is worn on from the film's start, with its frame in the bone's posed frame: a hat on the head, a holster on the hips. While worn it rides that bone and `frame` is not read; a grip takes it off, and an action's `wears` puts it on again. Not worn when absent. fixed: Whether the prop is a fixture: a thing set in the scene that bears on the floor or a wall and is never lifted, such as a ladder, a rail or a wall bar. A hand that grips a fixture bears on it, as a climber's hand on a rung, and never carries it, so it stays at its rest frame whatever grips it. Not a fixture when absent. position: Origin, world metres. offset: The prop's frame in the bone's posed frame, metres. shapes: Its colliders, with the moved parts' colliders moved; absent when the prop declares none.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: dressing/HumanWorn.ts (HumanWorn.frame, prop); executable/cases/ballStrikeCases.ts (ball, return); executable/cases/climbCases.ts (ladderProp, return); executable/cases/dressCases.ts (wearable, return); executable/cases/everydayCaseKit.ts (everydayCaseKit.one, props); executable/cases/everydayCaseKit.ts (everydayCaseKit.perform, props).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieAffordance, IAutoMovieSoftBodyDomain, IAutoMoviePhysicalShape identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion, AutoMovieHumanoidBone, IAutoMovieAffordance, IAutoMoviePhysicalShape, AutoMovieMotionHumanScheduledInstant identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export interface IAutoMovieMotionHumanProp {
  /** Subject id, unique in the performance. */
  subject: string;

  /** The prop's world frame before any grip. */
  frame: IAutoMovieRigidTransform;

  /** Named points in the prop's frame, metres, with outward unit normals. */
  points: Readonly<
    Record<
      string,
      {
        /** Named contact point in the PROP-LOCAL frame, metres. */
        point: IAutoMovieVector3;
        /** Outward unit contact normal in the PROP-LOCAL frame. */
        normal: IAutoMovieVector3;
      }
    >
  >;

  /**
   * The prop's world frame at a film second, for a prop that moves by
   * itself: a vehicle on its course, a horse at its gait, a lift. While
   * set, the prop is where this says and no grip carries it; what bears on
   * it (a rider's seat, a hand on its wheel) is carried with it.
   *
   * @param seconds Film seconds.
   * @returns The frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanProp.motion: The prop's world frame at a film second, for a prop that moves by itself: a vehicle on its course, a horse at its gait, a lift. While set, the prop is where this says and no grip carries it; what bears on it (a rider's seat, a hand on its wheel) is carried with it.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanProp.motion is used through packages/motions/src/perform/HumanPerformanceObject.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanProp.motion is used through packages/motions/src/perform/HumanPerformanceObject.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanProp.motion is used through packages/motions/src/perform/HumanPerformanceObject.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanProp.motion is used through packages/motions/src/perform/HumanPerformanceObject.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanProp.motion is used through packages/motions/src/perform/HumanPerformanceObject.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanProp.motion is used through packages/motions/src/perform/HumanPerformanceObject.ts.
   */
  motion?(seconds: number): IAutoMovieRigidTransform;

  /**
   * A named point in the world at a film second, for a prop whose parts
   * move within it: a pedal on its crank, a stirrup on a trotting horse, a
   * handle on a door that swings. `points` holds a point where it is in the
   * prop at rest, and the prop's frame alone carries it rigidly; a point
   * this knows is read here instead, so a foot or a hand aimed at it follows
   * the part and not the place the part had at rest.
   *
   * @param id The point's name, one of `points`.
   * @param seconds Film seconds.
   * @returns The point and its outward unit normal, world metres; undefined for a point that only moves with the prop's frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanProp.point: A named point in the world at a film second, for a prop whose parts move within it: a pedal on its crank, a stirrup on a trotting horse, a handle on a door that swings. `points` holds a point where it is in the prop at rest, and the prop's frame alone carries it rigidly; a point this knows is read here instead, so a foot or a hand aimed at it follows the part and not the place the part had at rest.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanProp.point is used through packages/motions/src/perform/HumanPerformanceObject.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanProp.point is used through packages/motions/src/perform/HumanPerformanceObject.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanProp.point is used through packages/motions/src/perform/HumanPerformanceObject.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanProp.point is used through packages/motions/src/perform/HumanPerformanceObject.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanProp.point is used through packages/motions/src/perform/HumanPerformanceObject.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanProp.point is used through packages/motions/src/perform/HumanPerformanceObject.ts.
   */
  point?(
    id: string,
    seconds: number,
  ): IAutoMovieMotionHumanProp.IPlacedPoint | undefined;

  /**
   * The person and bone the prop is worn on from the film's start, with its
   * frame in the bone's posed frame: a hat on the head, a holster on the
   * hips. While worn it rides that bone and `frame` is not read; a grip
   * takes it off, and an action's `wears` puts it on again. Not worn when
   * absent.
   */
  worn?: IAutoMovieMotionHumanProp.IWorn;

  /**
   * Whether the prop is a fixture: a thing set in the scene that bears on
   * the floor or a wall and is never lifted, such as a ladder, a rail or a
   * wall bar. A hand that grips a fixture bears on it, as a climber's hand
   * on a rung, and never carries it, so it stays at its rest frame whatever
   * grips it. Not a fixture when absent.
   */
  fixed?: boolean;

  /** Contact frames in the prop's frame (a handle's `+Y` approach and `+X` wrapped axis), which a grasp plans from by id. */
  affordances?: readonly IAutoMovieAffordance[];

  /**
   * The prop's cloth or cord lattice, for a prop that bends: a towel, a
   * flag, a rope. Its particles are solved once over the performance from
   * the displayed poses (`HumanPerformanceSoft`): its anchors may ride a
   * performer's bone (`actor-bone`) or a rigid prop's frame (a `node`
   * binding naming that prop's subject), its body capsules a performer's
   * bones, and a hand's grip on the prop holds the particle nearest the
   * hand. Its rest is in world metres. Rigid when absent.
   */
  soft?: IAutoMovieSoftBodyDomain;

  /** Colliders in the prop's frame, for finger closure until contact and penetration audits. */
  shapes?: readonly IAutoMoviePhysicalShape[];

  /**
   * The prop posed at stated travels of its articulations, for a prop whose
   * parts an act moves (a door's leaf, a trigger, a bowstring): its contacts
   * and colliders in its own frame with the parts moved. The performance
   * reads it at the travels the drives and tracks give at a second
   * (`HumanPerformance.state`), so a hand reaching a handle after the door
   * was opened goes to where the handle is. Absent for a rigid prop.
   *
   * @param state Travel by articulation id, in each articulation's own unit; an articulation left out stays at rest.
   * @returns The posed contacts and colliders.
   * @throws {Error} When a travel lies outside its articulation's range.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanProp.articulate: The prop posed at stated travels of its articulations, for a prop whose parts an act moves (a door's leaf, a trigger, a bowstring): its contacts and colliders in its own frame with the parts moved. The performance reads it at the travels the drives and tracks give at a second (`HumanPerformance.state`), so a hand reaching a handle after the door was opened goes to where the handle is. Absent for a rigid prop.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanProp.articulate is used through packages/motions/src/perform/HumanPerformanceObject.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanProp.articulate is used through packages/motions/src/perform/HumanPerformanceObject.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanProp.articulate is used through packages/motions/src/perform/HumanPerformanceObject.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanProp.articulate is used through packages/motions/src/perform/HumanPerformanceObject.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanProp.articulate is used through packages/motions/src/perform/HumanPerformanceObject.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanProp.articulate is used through packages/motions/src/perform/HumanPerformanceObject.ts.
   */
  articulate?(
    state: Readonly<Record<string, number>>,
  ): IAutoMovieMotionHumanProp.IPosed;

  /**
   * The prop's own movements after a trigger, each an articulation's travel
   * from a start instant: a trebuchet's arm swinging once its pin is pulled,
   * a door swinging shut on its closer. They share one state with the
   * performance's drives. None when absent.
   */
  tracks?: readonly IAutoMovieMotionHumanProp.ITrack[];

  /**
   * The prop's physical data as its model declares it: its mass, which a
   * hit it delivers in flight carries, and the contact data its flights read
   * (`HumanPropFlight`). Absent when the model declares none.
   */
  body?: IAutoMovieBody;
}

/**
 * Contracts used by HumanWorn.frame, ball, ladderProp, wearable.
 *
 */
export namespace IAutoMovieMotionHumanProp {
  /**
   * A moving contact in world space.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame of the point and normal and when full orientation is available.
   * @evidence contracts/development/design.md#principled-representation Preserves the existing world point and normal records; the world rotation carries the grip tangent of a moving affordance.
   * @evidence contracts/development/design.md#minimal-and-owned-surface HumanObject.prop supplies the rotation when its callback has a full contact transform; HumanRideHands reads its grip axis.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A point-only provider can omit the rotation; no rotation is inferred from a normal that leaves its tangent undetermined.
   */
  export interface IPlacedPoint {
    /** Contact point on the prop in world metres. */
    point: IAutoMovieVector3;

    /** Outward contact normal in world coordinates. */
    normal: IAutoMovieVector3;

    /** World rotation of the placed affordance, when the provider has its full frame. */
    rotation?: IAutoMovieQuaternion;
  }

  /**
   * One authored attachment of a prop to a subject's bone. Its offset is expressed in that bone's posed frame; performance readers derive any worn interval from this configuration.
   *
   * @evidence contracts/development/common.md#meaningful-documentation offset: The prop's frame in the bone's posed frame, metres.
   * @evidence contracts/development/design.md#principled-representation offset: The prop's frame in the bone's posed frame, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceRead.ts (HumanPerformanceRead.grips); throwing/HumanGlove.ts (HumanGlove.pocket).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, IAutoMovieRigidTransform identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IWorn {
    /** The wearer's subject id. */
    subject: string;

    /** The bone it rides. */
    bone: AutoMovieHumanoidBone;

    /** The prop's frame in the bone's posed frame, metres. */
    offset: IAutoMovieRigidTransform;
  }

  /**
   * A prop posed at travels of its articulations, in its own frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation shapes: Its colliders, with the moved parts' colliders moved; absent when the prop declares none.
   * @evidence contracts/development/design.md#principled-representation shapes: Its colliders, with the moved parts' colliders moved; absent when the prop declares none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanObject.ts (HumanObject.prop, return); perform/HumanPerformanceObject.ts (HumanPerformanceObject.pose, return); affordance/operateDrive.ts (operateDrive.part); perform/HumanPerformanceObject.ts (HumanPerformanceObject.point); perform/HumanPerformanceObject.ts (HumanPerformanceObject.pose); perform/HumanPerformanceObject.ts (HumanPerformanceObject.POSED).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieAffordance, IAutoMoviePhysicalShape identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IPosed {
    /** Its contacts, with the moved parts' contacts moved. */
    affordances: readonly IAutoMovieAffordance[];

    /** Its colliders, with the moved parts' colliders moved; absent when the prop declares none. */
    shapes?: readonly IAutoMoviePhysicalShape[];
  }

  /**
   * An articulation's travel run by the prop itself from a start instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation duration: Seconds the track lasts; its last travel holds after. Endless when absent.
   * @evidence contracts/development/design.md#principled-representation duration: Seconds the track lasts; its last travel holds after. Endless when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanObject.ts (HumanObject.prop, tracks).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieMotionHumanScheduledInstant identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ITrack {
    /** The articulation affordance it moves. */
    articulation: string;

    /** Film second it starts, or a named instant of an anchored action or a cue track it starts at, as a layer's window names one. */
    start: AutoMovieMotionHumanScheduledInstant;

    /**
     * The travel at a second of the track, in the articulation's own unit. Pure.
     *
     * @param seconds Seconds since the track's start.
     * @returns The travel.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanProp.ITrack.travel: The travel at a second of the track, in the articulation's own unit. Pure.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanProp.ITrack.travel is used through packages/motions/src/perform/HumanPerformanceObject.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanProp.ITrack.travel is used through packages/motions/src/perform/HumanPerformanceObject.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanProp.ITrack.travel is used through packages/motions/src/perform/HumanPerformanceObject.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanProp.ITrack.travel is used through packages/motions/src/perform/HumanPerformanceObject.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanProp.ITrack.travel is used through packages/motions/src/perform/HumanPerformanceObject.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanProp.ITrack.travel is used through packages/motions/src/perform/HumanPerformanceObject.ts.
     */
    travel(seconds: number): number;

    /** Seconds the track lasts; its last travel holds after. Endless when absent. */
    duration?: number;
  }
}
