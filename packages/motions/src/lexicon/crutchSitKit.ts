import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanCrutchSit,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionPropHold,
  IAutoMovieMotionPropWear,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanHand } from "../posture/HumanHand";
import { crutchSitPath } from "./crutchSitPath";

/**
 * What the crutch sit's two orders share (#3994): the sides, the crutches
 * and their staged frames, the hand goal that holds a crutch on a frame, the
 * writing of the arms and the injured leg over the body's posture, and the
 * order's result the law courses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the namespace gathers for the two orders.
 * @evidence contracts/development/design.md#principled-representation One kit read from the context, so both orders read the same crutches, goals and leg.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The kit, the order's result and the kit's reader.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every frame is the crutches' own or the body's.
 */
export namespace crutchSitKit {
  /**
   * The crutch sit's shared reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, frame and unit.
   * @evidence contracts/development/design.md#principled-representation The sides, the crutches and the writers both orders use.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the two orders read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Read from the context once.
   */
  export interface IKit {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The posture the act starts from. */
    entry: IAutoMovieMotionHumanPosture;

    /** The injured side, whose leg is held off the floor and whose hand holds both crutches seated. */
    injured: AutoMovieHumanSide;

    /** The sound side. */
    sound: AutoMovieHumanSide;

    /** Each side's crutch. */
    crutch: Record<AutoMovieHumanSide, crutchSitPath.ICrutch>;

    /** A side's crutch subject. */
    subject: (side: AutoMovieHumanSide) => string;

    /** A side's crutch contacts. */
    affordances: (side: AutoMovieHumanSide) => readonly IAutoMovieAffordance[];

    /** A side's crutch's world frame at the act's start. */
    start: (side: AutoMovieHumanSide) => IAutoMovieRigidTransform;

    /** The goal of a hand that holds a crutch, by its offset, on a world frame. */
    goal: (
      hand: AutoMovieHumanSide,
      held: IAutoMovieMotionHumanHeld.IHeld,
      frame: IAutoMovieRigidTransform,
    ) => IAutoMovieHumanLimbGoal;

    /** The posture with both arms' goals and the injured leg's angles written over it. */
    write: (
      posture: IAutoMovieMotionHumanPosture,
      arms: Record<AutoMovieHumanSide, IAutoMovieHumanLimbGoal>,
      leg: IAutoMovieHumanLimbReference,
    ) => IAutoMovieMotionHumanPosture;

    /** An event's second in a plan, its end when the plan has none. */
    at: (plan: IAutoMovieMotionHumanActionPlan, name: string) => number;
  }

  /**
   * One order's plan before the arms are coursed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The plan's parts and the second the hands are on the crutches.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the law courses and returns.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The plan's own members.
   */
  export interface IOrder {
    /** Seconds. */
    duration: number;

    /** Second the hands hold the crutches, from which the arms follow the goals. */
    ready: number;

    /** The posture at a second, the arms' goals and the injured leg written. */
    posture: (seconds: number) => IAutoMovieMotionHumanPosture;

    /** Contact windows. */
    contacts: IAutoMovieMotionHumanContactWindow[];

    /** Events. */
    events: IAutoMovieMotionEvent[];

    /** Holds kept after the act. */
    holds: IAutoMovieMotionPropHold[];

    /** Props worn on a bone. */
    wears: IAutoMovieMotionPropWear[];

    /** The base the act leaves. */
    base: IAutoMovieMotionHumanActionPlan["base"];
  }

  /**
   * Read the kit.
   *
   * @param context The crutch sit's context.
   * @returns The kit.
   * @throws {HumanRefusal} When a crutch declares no grip or no tip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, result and refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The crutches' own contacts and frames, and the hand goal inverting the rigid held offset.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record of closures.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A crutch without its contacts is refused by `crutchSitPath.crutch`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the context only through the closures.
   */
  export function of(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrutchSit>,
  ): IKit {
    const p: IAutoMovieMotionHumanCrutchSit = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const injured: AutoMovieHumanSide = p.injured ?? "left";
    const subject = (side: AutoMovieHumanSide): string =>
      side === "left" ? p.left : p.right;
    const affordances = (
      side: AutoMovieHumanSide,
    ): readonly IAutoMovieAffordance[] =>
      context.prop(subject(side)).prop.affordances ?? [];
    return {
      body,
      entry,
      injured,
      sound: injured === "left" ? "right" : "left",
      crutch: {
        left: crutchSitPath.crutch(p.left, affordances("left")),
        right: crutchSitPath.crutch(p.right, affordances("right")),
      },
      subject,
      affordances,
      start: (side: AutoMovieHumanSide): IAutoMovieRigidTransform =>
        context.prop(subject(side)).frame(context.start),
      goal: (
        hand: AutoMovieHumanSide,
        held: IAutoMovieMotionHumanHeld.IHeld,
        frame: IAutoMovieRigidTransform,
      ): IAutoMovieHumanLimbGoal => {
        const rotation: IAutoMovieQuaternion = Quaternion.normalize(
          Quaternion.multiply(
            frame.rotation,
            Quaternion.inverse(held.frame.rotation),
          ),
        );
        const at: IAutoMovieVector3 = Vector3.subtract(
          frame.position,
          Quaternion.rotateVector(rotation, held.frame.position),
        );
        return {
          ...HumanHand.place(body, hand, "grip", at, rotation),
          bend: AutoMovieMotionHumanBend.hang(body, entry, hand, 0.2),
        };
      },
      write: (
        posture: IAutoMovieMotionHumanPosture,
        arms: Record<AutoMovieHumanSide, IAutoMovieHumanLimbGoal>,
        leg: IAutoMovieHumanLimbReference,
      ): IAutoMovieMotionHumanPosture => {
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...posture.limbs,
          leftArm: arms.left,
          rightArm: arms.right,
        };
        delete limbs[`${injured}Leg`];
        return {
          ...posture,
          limbs,
          joints: {
            ...posture.joints,
            [`${injured}UpperLeg`]: [...leg.upper],
            [`${injured}LowerLeg`]: [...leg.lower],
          },
        };
      },
      at: (plan: IAutoMovieMotionHumanActionPlan, name: string): number =>
        plan.duration *
        (plan.events.find(
          (e: IAutoMovieMotionEvent): boolean => e.name === name,
        )?.share ?? 1),
    };
  }

  /** How far apart the two crutches stand in one hand, metres (provisional: two shafts side by side). */
  export const SPACING: number = 0.035;

  /** How far ahead of the chest's front the gathered crutches stand, metres (provisional: the underarm pad's half length and a hand's breadth clear of the chest). */
  export const AHEAD: number = 0.2;

  /**
   * A crutch's upright frame where both crutches are gathered into the
   * injured side's hand, before a body standing on a posture: on the floor
   * `AHEAD` before the chest's front, the injured side's crutch half the
   * hip's half width toward the injured side, the sound side's crutch
   * `SPACING` inside it, so the sound hand reaches in front of the body and
   * never across it.
   *
   * @param kit The kit.
   * @param posture The standing posture, its root and heading.
   * @param side The crutch's side.
   * @returns The crutch's world frame, upright.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the place, its parts and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The tip's floor place from the body's measure in the posture's frame, the crutch upright and turned to the heading (`crutchSitPath.slid`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One place and one frame.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The clearances are marked provisional.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function gathered(
    kit: IKit,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
  ): IAutoMovieRigidTransform {
    const m: IAutoMovieMotionHumanBody["measure"] = kit.body.measure;
    const ahead: IAutoMovieVector3 = forward(posture.yaw);
    const aside: number =
      m.hipHalfWidth / 2 - (side === kit.injured ? 0 : SPACING);
    const tip: IAutoMovieVector3 = Vector3.add(
      { x: posture.root.x, y: 0, z: posture.root.z },
      Vector3.add(
        Vector3.scale(ahead, m.chestDepth / 2 + AHEAD),
        Vector3.scale(lateral(posture.yaw, kit.injured), aside),
      ),
    );
    return crutchSitPath.slid(
      kit.crutch[side],
      tip,
      Vector3.add(tip, { x: 0, y: 1, z: 0 }),
      ahead,
    );
  }

  /**
   * A held leg's angles on a minimum-jerk share between two.
   *
   * @param share The share, clamped to 0 to 1.
   * @param from The angles left.
   * @param to The angles reached.
   * @returns The angles.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and result.
   * @evidence contracts/development/implementation.md#principled-implementation Each angle on one minimum-jerk share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One interpolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The clamp keeps the ends exact.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function leg(
    share: number,
    from: IAutoMovieHumanLimbReference,
    to: IAutoMovieHumanLimbReference,
  ): IAutoMovieHumanLimbReference {
    const s: number = minimumJerk.share(Math.min(1, Math.max(0, share)));
    const mix = (
      a: readonly [number, number, number],
      b: readonly [number, number, number],
    ): [number, number, number] => [
      a[0] + (b[0] - a[0]) * s,
      a[1] + (b[1] - a[1]) * s,
      a[2] + (b[2] - a[2]) * s,
    ];
    return {
      upper: mix(from.upper, to.upper),
      lower: mix(from.lower, to.lower),
    };
  }

  /**
   * A limb goal on a minimum-jerk share between two.
   *
   * @param a The goal left.
   * @param b The goal reached.
   * @param share The share, clamped to 0 to 1.
   * @returns The goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and result.
   * @evidence contracts/development/implementation.md#principled-implementation Point and bend lerped and rotation slerped on one share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One interpolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The clamp keeps the ends exact.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function blend(
    a: IAutoMovieHumanLimbGoal,
    b: IAutoMovieHumanLimbGoal,
    share: number,
  ): IAutoMovieHumanLimbGoal {
    const s: number = minimumJerk.share(Math.min(1, Math.max(0, share)));
    return {
      ...b,
      point: Vector3.lerp(a.point, b.point, s),
      bend: Vector3.lerp(a.bend, b.bend, s),
      rotation: Quaternion.slerp(
        a.rotation ?? Quaternion.identity(),
        b.rotation ?? Quaternion.identity(),
        s,
      ),
    };
  }

  /**
   * A heading's level unit vector to one side, world.
   *
   * @param yaw The heading, degrees about +Y.
   * @param side The side.
   * @returns The unit vector.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and result.
   * @evidence contracts/development/implementation.md#principled-implementation The heading's left, +X at yaw 0, mirrored for the right.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One vector.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lateral(
    yaw: number,
    side: AutoMovieHumanSide,
  ): IAutoMovieVector3 {
    const r: number = (yaw * Math.PI) / 180;
    const sign: number = side === "left" ? 1 : -1;
    return { x: sign * Math.cos(r), y: 0, z: -sign * Math.sin(r) };
  }

  /**
   * A heading's level forward unit vector, world.
   *
   * @param yaw The heading, degrees about +Y.
   * @returns The unit vector.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and result.
   * @evidence contracts/development/implementation.md#principled-implementation +Z at yaw 0, turned about +Y.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One vector.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function forward(yaw: number): IAutoMovieVector3 {
    const r: number = (yaw * Math.PI) / 180;
    return { x: Math.sin(r), y: 0, z: Math.cos(r) };
  }
}
