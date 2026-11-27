import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";

/**
 * The authored marks for one staged exchange between two animated performers.
 * The opening is blocked by the responding performer's prop. A reply, when
 * declared, follows the block and goes to its own stage mark.
 */
export interface IAutoMovieMotionHumanBladeExchange {
  /**
   * Nonblank cue id, unique within the composition. Anchors are suffixed with
   * .opening, .block and, when present, .reply.
   */
  readonly cue: string;

  /**
   * Subject id of the stage prop held by the opening performer after their
   * entry chain.
   */
  readonly openingProp: string;

  /**
   * Subject id of the distinct stage prop held by the responding performer
   * after their entry chain.
   */
  readonly respondingProp: string;

  /**
   * Nonnegative film seconds between the block's start and the opening's
   * decisive cue. The placed block supplies its own stroke cue.
   */
  readonly blockLeadSeconds: number;

  /**
   * Set-prop marker or fixed point where the opening motion would finish
   * without the staged block.
   */
  readonly openingMark: Extract<
    IAutoMovieMotionTarget,
    { kind: "point" | "prop" }
  >;

  /**
   * Follow-through mark for the responding performer. Omit to end their chain
   * at the block.
   */
  readonly replyMark?: IAutoMovieMotionHumanBladeExchange["openingMark"];
}
