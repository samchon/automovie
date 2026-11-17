import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieAffordance } from "../../../model/IAutoMovieAffordance";
import type { IAutoMovieBody } from "../../../model/IAutoMovieBody";
import type { IAutoMovieMotionHumanLayer } from "../law/IAutoMovieMotionHumanLayer";
import type { IAutoMoviePhysicalProfile } from "../../../physics/IAutoMoviePhysicalProfile";
import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieSoftBodyDomain } from "../../../soft/IAutoMovieSoftBodyDomain";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

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
 * @evidence contracts/development/common.md#meaningful-documentation points: Named points in the prop's frame, metres, with outward unit normals. worn: The person and bone the prop is worn on from the film's start, with its frame in the bone's posed frame: a hat on the head, a holster on the hips. While worn it rides that bone and `frame` is not read; a grip takes it off, and an action's `wears` puts it on again. Not worn when absent. fixed: Whether the prop is a fixture: a thing set in the scene that bears on the floor or a wall and is never lifted, such as a ladder, a rail or a wall bar. A hand that grips a fixture bears on it, as a climber's hand on a rung, and never carries it, so it stays at its rest frame whatever grips it. Not a fixture when absent.
 * @evidence contracts/development/design.md#principled-representation points: Named points in the prop's frame, metres, with outward unit normals. worn: The person and bone the prop is worn on from the film's start, with its frame in the bone's posed frame: a hat on the head, a holster on the hips. While worn it rides that bone and `frame` is not read; a grip takes it off, and an action's `wears` puts it on again. Not worn when absent. fixed: Whether the prop is a fixture: a thing set in the scene that bears on the floor or a wall and is never lifted, such as a ladder, a rail or a wall bar. A hand that grips a fixture bears on it, as a climber's hand on a rung, and never carries it, so it stays at its rest frame whatever grips it. Not a fixture when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: dressing/HumanWorn.ts (HumanWorn.frame, prop); executable/cases/ballStrikeCases.ts (ball, return); executable/cases/climbCases.ts (ladderProp, return); executable/cases/dressCases.ts (wearable, return); executable/cases/everydayCaseKit.ts (everydayCaseKit.one, props); executable/cases/everydayCaseKit.ts (everydayCaseKit.perform, props).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieAffordance, IAutoMovieSoftBodyDomain, IAutoMoviePhysicalProfile.IShape identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export interface IAutoMovieMotionHumanProp {
  /** Subject id, unique in the performance. */
  subject: string;

  /** The prop's world frame before any grip. */
  frame: IAutoMovieMotionHumanProp.IFrame;

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
   */
  motion?(seconds: number): IAutoMovieMotionHumanProp.IFrame;

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
   */
  point?(
    id: string,
    seconds: number,
  ):
    | {
        /** Contact point on the prop in world metres. */
        point: IAutoMovieVector3;
        /** Outward contact normal in world coordinates. */
        normal: IAutoMovieVector3;
      }
    | undefined;

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
  shapes?: readonly IAutoMoviePhysicalProfile.IShape[];

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
 * @evidence contracts/development/common.md#meaningful-documentation position: Origin, world metres. offset: The prop's frame in the bone's posed frame, metres. shapes: Its colliders, with the moved parts' colliders moved; absent when the prop declares none.
 * @evidence contracts/development/design.md#principled-representation position: Origin, world metres. offset: The prop's frame in the bone's posed frame, metres. shapes: Its colliders, with the moved parts' colliders moved; absent when the prop declares none.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: dressing/HumanWorn.ts (HumanWorn.frame, prop); executable/cases/ballStrikeCases.ts (ball, return); executable/cases/climbCases.ts (ladderProp, return); executable/cases/dressCases.ts (wearable, return); executable/cases/everydayCaseKit.ts (everydayCaseKit.one, props); executable/cases/everydayCaseKit.ts (everydayCaseKit.perform, props).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion, AutoMovieHumanoidBone, IAutoMovieAffordance, IAutoMoviePhysicalProfile.IShape, IAutoMovieMotionHumanLayer.Instant identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanProp {
  /**
   * A rigid world frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation position: Origin, world metres.
   * @evidence contracts/development/design.md#principled-representation position: Origin, world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/stand.ts (stand.plan.carried, return); carrier/HumanSupportCarry.ts (HumanSupportCarry.of, frame); carrier/HumanSupportCarry.ts (HumanSupportCarry.on.frame, return); carrier/HumanSupportCarry.ts (HumanSupportCarry.plan.frame, return); carrier/HumanSupportCarry.ts (HumanSupportCarry.launch, frame); carrier/HumanSupportFrame.ts (HumanSupportFrame.at.frame, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IFrame {
    /** Origin, world metres. */
    position: IAutoMovieVector3;

    /** Rotation from the prop's own axes to the world. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * Every grip window on a prop across every person, and every span it is worn on a bone, in film order, computed once after construction; none for a fixture, which no grip carries. Where a prop is worn.
   *
   * @evidence contracts/development/common.md#meaningful-documentation offset: The prop's frame in the bone's posed frame, metres.
   * @evidence contracts/development/design.md#principled-representation offset: The prop's frame in the bone's posed frame, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceRead.ts (HumanPerformanceRead.grips); throwing/HumanGlove.ts (HumanGlove.pocket).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, IAutoMovieMotionHumanProp.IFrame identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IWorn {
    /** The wearer's subject id. */
    subject: string;

    /** The bone it rides. */
    bone: AutoMovieHumanoidBone;

    /** The prop's frame in the bone's posed frame, metres. */
    offset: IAutoMovieMotionHumanProp.IFrame;
  }

  /**
   * A prop posed at travels of its articulations, in its own frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation shapes: Its colliders, with the moved parts' colliders moved; absent when the prop declares none.
   * @evidence contracts/development/design.md#principled-representation shapes: Its colliders, with the moved parts' colliders moved; absent when the prop declares none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanObject.ts (HumanObject.prop, return); perform/HumanPerformanceObject.ts (HumanPerformanceObject.pose, return); affordance/operateDrive.ts (operateDrive.part); perform/HumanPerformanceObject.ts (HumanPerformanceObject.point); perform/HumanPerformanceObject.ts (HumanPerformanceObject.pose); perform/HumanPerformanceObject.ts (HumanPerformanceObject.POSED).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieAffordance, IAutoMoviePhysicalProfile.IShape identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IPosed {
    /** Its contacts, with the moved parts' contacts moved. */
    affordances: readonly IAutoMovieAffordance[];

    /** Its colliders, with the moved parts' colliders moved; absent when the prop declares none. */
    shapes?: readonly IAutoMoviePhysicalProfile.IShape[];
  }

  /**
   * An articulation's travel run by the prop itself from a start instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation duration: Seconds the track lasts; its last travel holds after. Endless when absent.
   * @evidence contracts/development/design.md#principled-representation duration: Seconds the track lasts; its last travel holds after. Endless when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanObject.ts (HumanObject.prop, tracks).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanLayer.Instant identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ITrack {
    /** The articulation affordance it moves. */
    articulation: string;

    /** Film second it starts, or a named instant of an anchored action or a cue track it starts at, as a layer's window names one. */
    start: IAutoMovieMotionHumanLayer.Instant;

    /**
     * The travel at a second of the track, in the articulation's own unit. Pure.
     *
     * @param seconds Seconds since the track's start.
     * @returns The travel.
     */
    travel(seconds: number): number;

    /** Seconds the track lasts; its last travel holds after. Endless when absent. */
    duration?: number;
  }
}
