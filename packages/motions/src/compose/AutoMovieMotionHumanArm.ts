import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";
import { AutoMovieMotionHumanArmCarry } from "./AutoMovieMotionHumanArmCarry";
import { AutoMovieMotionHumanArmMove } from "./AutoMovieMotionHumanArmMove";
import { AutoMovieMotionHumanArmPhrase } from "./AutoMovieMotionHumanArmPhrase";
import { AutoMovieMotionHumanArmPlanned } from "./AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanArmTarget } from "./AutoMovieMotionHumanArmTarget";

/**
 * Arm primitives: a hand surface carried to a target, kept on it and taken
 * back.
 *
 * A target is a frame evaluated at each second on the posture the action has
 * so far (a region of the performer's own trunk, a partner's hand, a prop, a
 * point of the world), so the same row fits every body and follows whatever
 * the target rides on. The hand is an effector goal solved by the arm's
 * inverse kinematics: the goal carries the surface as its contact, so where
 * the arm cannot turn the hand as asked the resolver re-aims the wrist until
 * the surface stays on its point and the rotation gives way
 * (`IHumanPosture.IGoal.contact`).
 *
 * Between its origin and its target the surface moves on a straight path,
 * or one that bows to the arm's own side when the movement states a
 * curvature, and the hand turns by spherical interpolation, both by one
 * weight, and the
 * fingers go from the relaxed cascade to the target's shape by the same
 * weight (Jeannerod 1984: the hand is shaped during its transport). The
 * origin is held in the performer's own floor frame, so it follows the body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a target is and when it is evaluated, how the hand is solved, the path (straight or bowed) and the turn between origin and target, and the frame an origin is held in.
 * @evidence contracts/development/design.md#principled-representation An arm movement is an effector goal blended between a body-carried origin and a per-second target frame by one weight, the form reach-to-grasp studies describe (transport and hand shaping on one time course).
 * @evidence contracts/development/design.md#minimal-and-owned-surface One movement (`move`) with three named weights over it (`reach`, `hold`, `retract`) and the three conversions they need; the only owner of arm goals built from a hand surface.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the hand's surface and shape unions and the posture's goal type; no action name and no fixed body size appears.
 */
export namespace AutoMovieMotionHumanArm {
  /**
   * {@link AutoMovieMotionHumanArmTarget.ITarget}, re-exported so a caller of the arm facade imports one namespace.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the type it re-exports and its owner `AutoMovieMotionHumanArmTarget`; the members are documented there.
   * @evidence contracts/development/design.md#principled-representation The alias is the owner's type itself, so the concept, its units and its invariants are the owner's and no second shape exists.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `AutoMovieMotionHumanArmTarget` owns `ITarget`; this alias only lets callers of AutoMovieMotionHumanArm name it without a second import.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An alias of the owner's declaration, not a parallel copy; no cast or widening.
   */
  export type ITarget = AutoMovieMotionHumanArmTarget.ITarget;

  /**
   * {@link AutoMovieMotionHumanArmTarget.ISided}, re-exported so a caller of the arm facade imports one namespace.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the type it re-exports and its owner `AutoMovieMotionHumanArmTarget`; the members are documented there.
   * @evidence contracts/development/design.md#principled-representation The alias is the owner's type itself, so the concept, its units and its invariants are the owner's and no second shape exists.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `AutoMovieMotionHumanArmTarget` owns `ISided`; this alias only lets callers of AutoMovieMotionHumanArm name it without a second import.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An alias of the owner's declaration, not a parallel copy; no cast or widening.
   */
  export type ISided = AutoMovieMotionHumanArmTarget.ISided;

  /**
   * {@link AutoMovieMotionHumanArmTarget.Frame}, re-exported so a caller of the arm facade imports one namespace.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the type it re-exports and its owner `AutoMovieMotionHumanArmTarget`; the members are documented there.
   * @evidence contracts/development/design.md#principled-representation The alias is the owner's type itself, so the concept, its units and its invariants are the owner's and no second shape exists.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `AutoMovieMotionHumanArmTarget` owns `Frame`; this alias only lets callers of AutoMovieMotionHumanArm name it without a second import.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An alias of the owner's declaration, not a parallel copy; no cast or widening.
   */
  export type Frame = AutoMovieMotionHumanArmTarget.Frame;

  /**
   * {@link AutoMovieMotionHumanArmTarget.IOrigin}, re-exported so a caller of the arm facade imports one namespace.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the type it re-exports and its owner `AutoMovieMotionHumanArmTarget`; the members are documented there.
   * @evidence contracts/development/design.md#principled-representation The alias is the owner's type itself, so the concept, its units and its invariants are the owner's and no second shape exists.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `AutoMovieMotionHumanArmTarget` owns `IOrigin`; this alias only lets callers of AutoMovieMotionHumanArm name it without a second import.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An alias of the owner's declaration, not a parallel copy; no cast or widening.
   */
  export type IOrigin = AutoMovieMotionHumanArmTarget.IOrigin;

  /**
   * {@link AutoMovieMotionHumanArmTarget.IMove}, re-exported so a caller of the arm facade imports one namespace.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the type it re-exports and its owner `AutoMovieMotionHumanArmTarget`; the members are documented there.
   * @evidence contracts/development/design.md#principled-representation The alias is the owner's type itself, so the concept, its units and its invariants are the owner's and no second shape exists.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `AutoMovieMotionHumanArmTarget` owns `IMove`; this alias only lets callers of AutoMovieMotionHumanArm name it without a second import.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An alias of the owner's declaration, not a parallel copy; no cast or widening.
   */
  export type IMove = AutoMovieMotionHumanArmTarget.IMove;

  /** {@link AutoMovieMotionHumanArmTarget.origin}. */
  export const origin: typeof AutoMovieMotionHumanArmTarget.origin =
    AutoMovieMotionHumanArmTarget.origin;

  /** {@link AutoMovieMotionHumanArmTarget.point}. */
  export const point: typeof AutoMovieMotionHumanArmTarget.point =
    AutoMovieMotionHumanArmTarget.point;

  /** {@link AutoMovieMotionHumanArmTarget.goal}. */
  export const goal: typeof AutoMovieMotionHumanArmTarget.goal =
    AutoMovieMotionHumanArmTarget.goal;

  /**
   * {@link AutoMovieMotionHumanArmAngles.IAngles}, re-exported so a caller of the arm facade imports one namespace.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the type it re-exports and its owner `AutoMovieMotionHumanArmAngles`; the members are documented there.
   * @evidence contracts/development/design.md#principled-representation The alias is the owner's type itself, so the concept, its units and its invariants are the owner's and no second shape exists.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `AutoMovieMotionHumanArmAngles` owns `IAngles`; this alias only lets callers of AutoMovieMotionHumanArm name it without a second import.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An alias of the owner's declaration, not a parallel copy; no cast or widening.
   */
  export type IAngles = AutoMovieMotionHumanArmAngles.IAngles;

  /** {@link AutoMovieMotionHumanArmAngles.angles}. */
  export const angles: typeof AutoMovieMotionHumanArmAngles.angles =
    AutoMovieMotionHumanArmAngles.angles;

  /** {@link AutoMovieMotionHumanArmCarry.carry}. */
  export const carry: typeof AutoMovieMotionHumanArmCarry.carry =
    AutoMovieMotionHumanArmCarry.carry;

  /**
   * {@link AutoMovieMotionHumanArmCarry.ICarry}, re-exported so a caller of the arm facade imports one namespace.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the type it re-exports and its owner `AutoMovieMotionHumanArmCarry`; the members are documented there.
   * @evidence contracts/development/design.md#principled-representation The alias is the owner's type itself, so the concept, its units and its invariants are the owner's and no second shape exists.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `AutoMovieMotionHumanArmCarry` owns `ICarry`; this alias only lets callers of AutoMovieMotionHumanArm name it without a second import.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An alias of the owner's declaration, not a parallel copy; no cast or widening.
   */
  export type ICarry = AutoMovieMotionHumanArmCarry.ICarry;

  /** {@link AutoMovieMotionHumanArmCarry.carried}. */
  export const carried: typeof AutoMovieMotionHumanArmCarry.carried =
    AutoMovieMotionHumanArmCarry.carried;

  /**
   * {@link AutoMovieMotionHumanArmPlanned.ISpan}, re-exported so a caller of the arm facade imports one namespace.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the type it re-exports and its owner `AutoMovieMotionHumanArmPlanned`; the members are documented there.
   * @evidence contracts/development/design.md#principled-representation The alias is the owner's type itself, so the concept, its units and its invariants are the owner's and no second shape exists.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `AutoMovieMotionHumanArmPlanned` owns `ISpan`; this alias lets a law name the span it states on `carried` without a second import.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An alias of the owner's declaration, not a parallel copy; no cast or widening.
   */
  export type ISpan = AutoMovieMotionHumanArmPlanned.ISpan;

  /** {@link AutoMovieMotionHumanArmPlanned.stated}. */
  export const stated: typeof AutoMovieMotionHumanArmPlanned.stated =
    AutoMovieMotionHumanArmPlanned.stated;

  /**
   * {@link AutoMovieMotionHumanArmPlanned.ITogether}, re-exported so a caller of the arm facade imports one namespace.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the type it re-exports and its owner `AutoMovieMotionHumanArmPlanned`; the members are documented there.
   * @evidence contracts/development/design.md#principled-representation The alias is the owner's type itself, so the concept, its units and its invariants are the owner's and no second shape exists.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `AutoMovieMotionHumanArmPlanned` owns `ITogether`; this alias lets a law group the arms it plans as one problem (two hands on one object) without a second import.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An alias of the owner's declaration, not a parallel copy; no cast or widening.
   */
  export type ITogether = AutoMovieMotionHumanArmPlanned.ITogether;

  /** {@link AutoMovieMotionHumanArmPlanned.together}. */
  export const together: typeof AutoMovieMotionHumanArmPlanned.together =
    AutoMovieMotionHumanArmPlanned.together;

  /** {@link AutoMovieMotionHumanArmMove.move}. */
  export const move: typeof AutoMovieMotionHumanArmMove.move =
    AutoMovieMotionHumanArmMove.move;

  /** {@link AutoMovieMotionHumanArmMove.reach}. */
  export const reach: typeof AutoMovieMotionHumanArmMove.reach =
    AutoMovieMotionHumanArmMove.reach;

  /** {@link AutoMovieMotionHumanArmMove.hold}. */
  export const hold: typeof AutoMovieMotionHumanArmMove.hold =
    AutoMovieMotionHumanArmMove.hold;

  /** {@link AutoMovieMotionHumanArmMove.retract}. */
  export const retract: typeof AutoMovieMotionHumanArmMove.retract =
    AutoMovieMotionHumanArmMove.retract;

  /**
   * {@link AutoMovieMotionHumanArmPhrase.IPhrase}, re-exported so a caller of the arm facade imports one namespace.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the type it re-exports and its owner `AutoMovieMotionHumanArmPhrase`; the members are documented there.
   * @evidence contracts/development/design.md#principled-representation The alias is the owner's type itself, so the concept, its units and its invariants are the owner's and no second shape exists.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `AutoMovieMotionHumanArmPhrase` owns `IPhrase`; this alias only lets callers of AutoMovieMotionHumanArm name it without a second import.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An alias of the owner's declaration, not a parallel copy; no cast or widening.
   */
  export type IPhrase = AutoMovieMotionHumanArmPhrase.IPhrase;

  /** {@link AutoMovieMotionHumanArmPhrase.bearing}. */
  export const bearing: typeof AutoMovieMotionHumanArmPhrase.bearing =
    AutoMovieMotionHumanArmPhrase.bearing;

  /** {@link AutoMovieMotionHumanArmPhrase.visit}. */
  export const visit: typeof AutoMovieMotionHumanArmPhrase.visit =
    AutoMovieMotionHumanArmPhrase.visit;

  /** {@link AutoMovieMotionHumanArmPhrase.stroke}. */
  export const stroke: typeof AutoMovieMotionHumanArmPhrase.stroke =
    AutoMovieMotionHumanArmPhrase.stroke;

  /** {@link AutoMovieMotionHumanArmPhrase.strike}. */
  export const strike: typeof AutoMovieMotionHumanArmPhrase.strike =
    AutoMovieMotionHumanArmPhrase.strike;

  /** {@link AutoMovieMotionHumanArmPhrase.oscillate}. */
  export const oscillate: typeof AutoMovieMotionHumanArmPhrase.oscillate =
    AutoMovieMotionHumanArmPhrase.oscillate;

  /**
   * {@link AutoMovieMotionHumanArmPhrase.ISwing}, re-exported so a caller of the arm facade imports one namespace.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the type it re-exports and its owner `AutoMovieMotionHumanArmPhrase`; the members are documented there.
   * @evidence contracts/development/design.md#principled-representation The alias is the owner's type itself, so the concept, its units and its invariants are the owner's and no second shape exists.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `AutoMovieMotionHumanArmPhrase` owns `ISwing`; this alias only lets callers of AutoMovieMotionHumanArm name it without a second import.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An alias of the owner's declaration, not a parallel copy; no cast or widening.
   */
  export type ISwing = AutoMovieMotionHumanArmPhrase.ISwing;

  /** {@link AutoMovieMotionHumanArmPhrase.swing}. */
  export const swing: typeof AutoMovieMotionHumanArmPhrase.swing =
    AutoMovieMotionHumanArmPhrase.swing;
}
