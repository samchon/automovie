import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A student's state between actions, the schedule's snapshot after each of
 * that student's intents: where the body stands, sits or rides, which way it
 * faces, where each hand is and what it holds. Every action of a student
 * starts from the previous snapshot and ends in the next.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the snapshot is and when it is taken; each member gives its unit and frame.
 * @evidence contracts/development/design.md#principled-representation The support, stance and hand places are closed unions, so an impossible combination such as a hand both free and holding is unwritable; world metres and radians per the floor frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members the everyday, duel and flight transitions and the motion laws read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No scene or person is named.
 */
export interface IBodyState {
  /** Floor point under the pelvis, or the broom's seat point while riding, world metres. */
  position: IAutoMovieVector3;

  /** Facing on the floor, radians from +Z toward +X. */
  heading: number;

  /** What carries the body. */
  support: IBodyState.Support;

  /** Seat surface height above the floor while seated, metres; 0 otherwise. */
  seat: number;

  /** Standing stance. */
  stance: "relaxed" | "guard";

  /** Hip hinge of a bend toward the floor, 0 upright to 1 at full reach. */
  bend: number;

  /** Each hand. */
  hands: Record<IBodyState.Side, IBodyState.IHand>;

  /** What the eyes follow, when not straight ahead. */
  gaze: IBodyState.Gaze | null;

  /** The broom ridden or held, when riding or hanging. */
  broom: string | null;

  /** Speed along the heading while flying, metres per second; 0 on the ground. */
  speed: number;

  /** Rate of climb while flying, metres per second, negative when sinking. */
  climb: number;
}
export namespace IBodyState {
  /** A person's own side. */
  export type Side = "left" | "right";

  /** What carries the body. */
  export type Support = "stand" | "seat" | "ride" | "hang" | "tandem";

  /** Where a hand is. */
  export type Place =
    | "side"
    | "chest"
    | "waist"
    | "hip-behind"
    | "extended"
    | "raised"
    | "forehead"
    | "palms-out"
    | "pocket"
    | "shaft"
    | "knee";

  /** One hand. */
  export interface IHand {
    /** Where it is. */
    place: Place;

    /** The world point it reaches, for `extended` and `raised`, metres. */
    point: IAutoMovieVector3 | null;

    /** The prop it holds, by id. */
    holds: string | null;

    /** The student whose wand hand this hand grips, followed every instant until it lets go. */
    follows?: string | null;
  }

  /** A gaze target. */
  export type Gaze =
    | { kind: "subject"; subject: string; part?: "head" | "leftHand" | "rightHand" }
    | { kind: "point"; point: IAutoMovieVector3 };

  /**
   * A standing, empty-handed state.
   *
   * @param position Floor point.
   * @param heading Facing.
   * @returns The state.
   * @evidence contracts/development/common.md#meaningful-documentation States the defaults.
   * @evidence contracts/development/implementation.md#principled-implementation Every member at its neutral value.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws A neutral state.
   * @evidence contracts/development/behaviors.md#relational-goals Reads no position.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function standing(
    position: IAutoMovieVector3,
    heading: number,
  ): IBodyState {
    return {
      position: { x: position.x, y: 0, z: position.z },
      heading,
      support: "stand",
      seat: 0,
      stance: "relaxed",
      bend: 0,
      hands: {
        left: { place: "side", point: null, holds: null },
        right: { place: "side", point: null, holds: null },
      },
      gaze: null,
      broom: null,
      speed: 0,
      climb: 0,
    };
  }

  /**
   * The hand holding a prop, if any.
   *
   * @param state The state.
   * @param prop The prop id.
   * @returns The side, or null.
   * @evidence contracts/development/common.md#meaningful-documentation States the absent value.
   * @evidence contracts/development/implementation.md#principled-implementation Checks both hands.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws A lookup.
   * @evidence contracts/development/behaviors.md#relational-goals Reads no position.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function holding(state: IBodyState, prop: string): Side | null {
    return state.hands.right.holds === prop
      ? "right"
      : state.hands.left.holds === prop
        ? "left"
        : null;
  }
}
