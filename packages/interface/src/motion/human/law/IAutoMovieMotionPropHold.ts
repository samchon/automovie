import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanGraspUse } from "../handling/IAutoMovieMotionHumanGraspUse";

/**
 * A planned hand attachment to a prop beginning at a share of the action's duration. Optional finger joint angles preserve the grip when performance evaluation carries the prop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A planned hand attachment to a prop beginning at a share of the action's duration. Optional finger joint angles preserve the grip when performance evaluation carries the prop.
 * @evidence contracts/development/design.md#principled-representation from: Share of this action from which the prop is held. use: The use the grip was chosen for, which a later act that uses the prop reads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Held primitives and striking plans publish persistent grips that performance holding consumes across later actions; this planned hold differs from the evaluator's cached held state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The start remains a normalized duration share, while fingers remain readonly clinical joint angles. Grip takeover and missing-prop refusal belong to performance planning.
 */
export interface IAutoMovieMotionPropHold {
  /** The holding hand. */
  side: AutoMovieHumanSide;

  /** The prop's subject. */
  prop: string;

  /** Share of this action from which the prop is held. */
  from: number;

  /** The holding fingers' clinical angles, kept while carried. */
  fingers?: Readonly<
    Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
  >;

  /** The use the grip was chosen for (`pickUp`'s `use`); absent when it was chosen for its reach alone. */
  use?: IAutoMovieMotionHumanGraspUse.IUse;
}
