import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * The authored marks for one staged exchange between two animated performers.
 * The opening is blocked by the responding performer's prop. A reply, when
 * declared, follows the block and goes to its own stage mark.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents the exchange, phase anchors, prop subjects, stage marks, authored lead in film seconds and optional reply.
 * @evidence contracts/development/design.md#principled-representation Marks are restricted to fixed points in the canonical target frame or named points on set props. The cast and its distinct prop ids are checked by composeHumanBladeExchange; the performance resolves marks and held props.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The interface owns the cue and mark data used by composeHumanBladeExchange. Chains, timing, grips and target resolution use the existing authoring contracts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The input reuses the canonical target kinds and lets the author choose both marks. It carries no pose constants or body-specific parameters.
 */
export interface IAutoMovieMotionHumanBladeExchange {
  /** Nonblank cue id, unique within the composition. Anchors are suffixed with .opening, .block and, when present, .reply. */
  readonly cue: string;

  /** Subject id of the stage prop held by the opening performer after their entry chain. */
  readonly openingProp: string;

  /** Subject id of the distinct stage prop held by the responding performer after their entry chain. */
  readonly respondingProp: string;

  /** Nonnegative film seconds between the block's start and the opening's decisive cue. */
  readonly blockLeadSeconds: number;

  /** Set-prop marker or fixed point where the opening motion would finish without the staged block. */
  readonly openingMark: Extract<
    IAutoMovieMotionTarget,
    { kind: "point" | "prop" }
  >;

  /** Follow-through mark for the responding performer. Omit to end their chain at the block. */
  readonly replyMark?: IAutoMovieMotionHumanBladeExchange["openingMark"];
}
