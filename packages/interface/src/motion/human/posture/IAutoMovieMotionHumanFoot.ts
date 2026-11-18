import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A foot on the floor as a rigid rocker: where its ankle and its sole points
 * are when it pivots about its heel or its ball by a pitch, at a heading.
 *
 * Gait analysis describes stance as three rockers (Perry and Burnfield, Gait
 * Analysis, 2nd ed.): the heel rocker, where the foot rolls down about the
 * heel after initial contact; the ankle rocker, foot flat while the tibia
 * advances; and the forefoot rocker, where the heel rises and the foot turns
 * about the metatarsal heads until toe-off. Each is a rotation of the rigid
 * foot about a floor point, so the contact point stays fixed while the ankle
 * moves, which is what keeps a planted foot from sliding.
 *
 * The foot's geometry is read from the body's own sockets: the heel and ball
 * points relative to the ankle joint at rest, and `mtp`, the toes' joint, the
 * metatarsophalangeal axis the forefoot rocker turns about with the toes
 * flat (Perry and Burnfield), above the ball's floor point. A socket riding the toes bone
 * (the toe tip, when the profile jointed the toes) bends at the ball by the
 * toes' flexion: through the forefoot rocker the toes extend at the
 * metatarsophalangeal joints and stay flat on the floor while the heel rises
 * (Perry and Burnfield), so a walk extends them by the rocker's angle.
 * `pitch` is in degrees about the foot's lateral axis, positive lifting the
 * toes; `toes` is the toes' flexion from the foot in degrees, positive
 * lifting them; `heading` is the foot's yaw about +Y in degrees (0 faces +Z).
 *
 * @evidence contracts/development/common.md#meaningful-documentation ankle: The ankle joint, world metres. point: Where it is, world metres.
 * @evidence contracts/development/design.md#principled-representation ankle: The ankle joint, world metres. point: Where it is, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/jumpLanding.ts (jumpLanding.of.footprint, return); actions/standFeet.ts (standFeet.of.plans, return); actions/walkFoot.ts (walkFoot.prepareStance, flat); actions/walkReach.ts (walkReach.swing.lowest, placement).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanFoot {
  /**
   * A foot's world placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation ankle: The ankle joint, world metres.
   * @evidence contracts/development/design.md#principled-representation ankle: The ankle joint, world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/jumpLanding.ts (jumpLanding.of.footprint, return); actions/standFeet.ts (standFeet.of.plans, return); actions/walkFoot.ts (walkFoot.prepareStance, flat); actions/walkReach.ts (walkReach.swing.lowest, placement).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IPlacement {
    /** The ankle joint, world metres. */
    ankle: IAutoMovieVector3;

    /** The foot's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * A sole socket that bears on the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A sole socket that bears on the floor.
   * @evidence contracts/development/design.md#principled-representation Closed choices "heel", "ball", "toe" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanFoot.ts (HumanFoot.sockets, socket); posture/HumanFoot.ts (HumanFoot.sole, socket); audit/AutoMovieMotionHumanAuditGround.ts (plants); posture/HumanFoot.ts (HumanFoot.SOCKETS).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanFoot.sockets.
   */
  export type Socket = (readonly ["heel", "ball", "toe"])[number];

  /**
   * A sole socket's place on a displayed foot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point: Where it is, world metres.
   * @evidence contracts/development/design.md#principled-representation point: Where it is, world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/standFeet.ts (standFeet.of.floor, s); actions/standFeet.ts (standFeet.of.plans.pivot, a); actions/standFeet.ts (standFeet.of.plans.pivot, b); actions/standFeet.ts (standFeet.of.plans.pivot, return); audit/AutoMovieMotionHumanAuditContact.ts (AutoMovieMotionHumanAuditContact.measure.speed, socket); audit/AutoMovieMotionHumanAuditContact.ts (AutoMovieMotionHumanAuditContact.measure.speed.was, s).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanFoot.Socket, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ISocket {
    /** Which socket. */
    socket: IAutoMovieMotionHumanFoot.Socket;

    /** Where it is, world metres. */
    point: IAutoMovieVector3;
  }

  /**
   * Where the ankle goes, and how far the toes extend, when a planted foot reaches a rotation other than the one asked for: the foot turns about its contact, which stays where the goal put it, and the toes take back the pitch the foot lost, so they stay on the floor. When the shank leans past the ankle's dorsal range, this is the heel-off of the terminal stance rocker (Perry and Burnfield): the heel rises about the ball and the toes dorsiflex at the metatarsophalangeal joints. Result returned by HumanFoot.heelOff. The ankle point and the toes' added flexion, degrees, positive lifting them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation ankle: Ankle position in world metres after lifting the heel about the toe support. toes: ADDED toe-joint flexion in clinical degrees, positive lifting the toes; added to existing flexion to keep the sole contact.
   * @evidence contracts/development/design.md#principled-representation ankle: Ankle position in world metres after lifting the heel about the toe support. toes: ADDED toe-joint flexion in clinical degrees, positive lifting the toes; added to existing flexion to keep the sole contact.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanFoot.ts (HumanFoot.heelOff, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IHeelOffResult = {
    /** Ankle position in world metres after lifting the heel about the toe support. */
    ankle: IAutoMovieVector3;
    /** ADDED toe-joint flexion in clinical degrees, positive lifting the toes; added to existing flexion to keep the sole contact. */
    toes: number;
  };
}
