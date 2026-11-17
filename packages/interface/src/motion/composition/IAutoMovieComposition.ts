import type { IAutoMovieIntent } from "./IAutoMovieIntent";

/**
 * A time-scoped composition of intents: a caller-owned tree the schedule
 * resolver places on the film clock.
 *
 * - an intent is a leaf;
 * - `sequence` places its parts one after another;
 * - `parallel` starts its parts together and ends with the longest;
 * - `at` starts its part at an earlier part's anchor (its contact instant
 *   when the timing declares one, else its start) plus an offset, so a
 *   reaction aligns to the action it answers without coordinates or ordinals.
 *   It may name which instant of the anchor it means (`event`, with `index`
 *   where the name repeats) and which instant of its own part falls there
 *   (`align`), as BML's synchronisation constraints do; the anchor may then
 *   also be a cue track the laws declare, such as a dialogue's accents or a
 *   score's beats.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes film-clock sequence, parallel and anchor-aligned placement and borrowed tree ownership.
 * @evidence contracts/development/design.md#principled-representation The kind discriminant separates leaf, ordered sequence, common-start group and anchor-relative placement; the scheduler admits references and timing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns the tree consumed by AutoMovieComposition builders and resolveAutoMovieSchedule, while action vocabulary stays in intent producers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each node carries only its own branch's fields; the tree carries no renderer or production implementation.
 */
export type IAutoMovieComposition =
  | IAutoMovieComposition.IIntent
  | IAutoMovieComposition.ISequence
  | IAutoMovieComposition.IParallel
  | IAutoMovieComposition.IAt;

/** The four scheduling nodes and accepted builder inputs. Constructors share intent and child-node references; keep the tree stable while resolving it. */
export namespace IAutoMovieComposition {
  /**
   * A leaf.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the leaf that gives one authored intent to the schedule law.
   * @evidence contracts/development/design.md#principled-representation The intent kind selects a single intent with no sibling ordering or anchor-placement fields.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieComposition.of wraps raw intents; AutoMovieSchedulePlace reads the retained intent reference.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A leaf reuses IAutoMovieIntent instead of copying its capability, parameters and cut alternatives.
   */
  export interface IIntent {
    /** Discriminator. */
    kind: "intent";

    /** The intent. */
    intent: IAutoMovieIntent;
  }

  /**
   * Parts one after another.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States declaration-order placement and empty-sequence timing.
   * @evidence contracts/development/design.md#principled-representation A readonly list of children has sequential end-to-start semantics; the wrapper is not recursively frozen.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieComposition.sequence constructs this node and resolveAutoMovieSchedule advances its cursor through the children.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The sequence branch cannot also supply parallel or anchor placement data.
   */
  export interface ISequence {
    /** Discriminator. */
    kind: "sequence";

    /** Children in declaration order; each starts at the previous child's end. An empty sequence has zero duration at its inherited start. */
    parts: readonly IAutoMovieComposition[];
  }

  /**
   * Parts starting together.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States common-start placement and latest-end duration, including empty groups.
   * @evidence contracts/development/design.md#principled-representation A readonly child list preserves declaration order for dependency lookup while sharing the inherited start time.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieComposition.parallel constructs the node; the scheduler computes the maximum child end.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Parallelism is explicit in kind rather than inferred from equal numeric timestamps.
   */
  export interface IParallel {
    /** Discriminator. */
    kind: "parallel";

    /** Children in declaration order with a common start. Duration is their latest end; an empty group has zero duration. */
    parts: readonly IAutoMovieComposition[];
  }

  /**
   * A part aligned to an earlier anchor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents anchor choice, signed second offset and default event occurrence and alignment behavior.
   * @evidence contracts/development/design.md#principled-representation The scheduler resolves only earlier anchors or law cue tracks; index without event and unresolved references throw, while offset finiteness remains caller-owned.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieComposition.at builds this placement; AutoMovieSchedulePlace and the optional align law determine its start.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts event, index and align refine placement; the remaining meaningless index-without-event combination is admitted by the type and rejected at runtime.
   */
  export interface IAt {
    /** Discriminator. */
    kind: "at";

    /** The anchor id of an intent placed earlier in walk order, or the name of a cue track. */
    anchor: string;

    /** Seconds after the anchor's instant; may be negative. */
    offset: number;

    /**
     * The anchor's named instant: one of its events, or `start` or `end`.
     * Absent, an intent's contact instant when its timing declares one, else
     * its start. Required when the anchor is a cue track.
     */
    event?: string;

    /** Which occurrence of `event`, from 0, where the anchor has several of that name; 0 when absent. */
    index?: number;

    /**
     * The instant of the part's own first intent that falls on the anchor's
     * instant: one of its events. Absent, the part starts there.
     */
    align?: string;

    /** The aligned part. */
    part: IAutoMovieComposition;
  }

  /**
   * Anything a combinator accepts: a composition, an intent, or a chain's node.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explains the three inputs accepted by composition builders and reference unwrapping.
   * @evidence contracts/development/design.md#principled-representation A union accepts an existing tree, raw intent or readonly node holder; of checks node before kind and otherwise wraps the intent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieComposition.of is the shared normalization used by composition builders and AutoMovieChain.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The node holder exposes only the tree, allowing chain implementations without coupling interface to a runtime class.
   */
  export type Part =
    | IAutoMovieComposition
    | IAutoMovieIntent
    | {
        /** Composition unwrapped by reference when a builder receives a chain or another node-bearing value. */
        readonly node: IAutoMovieComposition;
      };
}
