import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionPropLaunch } from "./IAutoMovieMotionPropLaunch";

/**
 * A planned hand attachment to a prop beginning at a share of the action's duration. Optional finger joint angles preserve the grip when performance evaluation carries the prop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A planned hand attachment to a prop beginning at a share of the action's duration. Optional finger joint angles preserve the grip when performance evaluation carries the prop.
 * @evidence contracts/development/design.md#principled-representation The start is an action share. A staged capture borrows the matching launch record so only that launch can end at this grip.
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

  /** The admitted launch this grip intercepts, by identity in its placed action's publish list. Absent for ordinary holds. */
  capture?: IAutoMovieMotionPropLaunch;

  /** The holding fingers' clinical angles, kept while carried. */
  fingers?: Readonly<
    Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
  >;
}
