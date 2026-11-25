import type { IAutoMovieIntent } from "./IAutoMovieIntent";

/**
 * A time-scoped composition of intents: a caller-owned tree the schedule
 * resolver places on the film clock.
 *
 * - An intent is a leaf;
 * - `sequence` places its parts one after another;
 * - `parallel` starts its parts together and ends with the longest;
 * - `at` starts its part at an earlier part's anchor (its contact instant when
 *   the timing declares one, else its start) plus an offset, so a reaction
 *   aligns to the action it answers without coordinates or ordinals. It may
 *   name which instant of the anchor it means (`event`, with `index` where the
 *   name repeats) and which instant of its own part falls there (`align`), as
 *   BML's synchronisation constraints do; the anchor may then also be a cue
 *   track the laws declare, such as a dialogue's accents or a score's beats.
 */
export type IAutoMovieComposition =
  | IAutoMovieComposition.IIntent
  | IAutoMovieComposition.ISequence
  | IAutoMovieComposition.IParallel
  | IAutoMovieComposition.IAt;

/**
 * The four scheduling nodes and accepted builder inputs. Constructors share
 * intent and child-node references; keep the tree stable while resolving it.
 */
export namespace IAutoMovieComposition {
  /** A leaf. */
  export interface IIntent {
    /** Discriminator. */
    kind: "intent";

    /** The intent. */
    intent: IAutoMovieIntent;
  }

  /** Parts one after another. */
  export interface ISequence {
    /** Discriminator. */
    kind: "sequence";

    /**
     * Children in declaration order; each starts at the previous child's end.
     * An empty sequence has zero duration at its inherited start.
     */
    parts: readonly IAutoMovieComposition[];
  }

  /** Parts starting together. */
  export interface IParallel {
    /** Discriminator. */
    kind: "parallel";

    /**
     * Children in declaration order with a common start. Duration is their
     * latest end; an empty group has zero duration.
     */
    parts: readonly IAutoMovieComposition[];
  }

  /** A part aligned to an earlier anchor. */
  export interface IAt {
    /** Discriminator. */
    kind: "at";

    /**
     * The anchor id of an intent placed earlier in walk order, or the name of a
     * cue track.
     */
    anchor: string;

    /** Seconds after the anchor's instant; may be negative. */
    offset: number;

    /**
     * The anchor's named instant: one of its events, or `start` or `end`.
     * Absent, an intent's contact instant when its timing declares one, else
     * its start. Required when the anchor is a cue track.
     */
    event?: string;

    /**
     * Which occurrence of `event`, from 0, where the anchor has several of that
     * name; 0 when absent.
     */
    index?: number;

    /**
     * The instant of the part's own first intent that falls on the anchor's
     * instant: one of its events. Absent, the part starts there.
     */
    align?: string;

    /** The aligned part. */
    part: IAutoMovieComposition;
  }

  /** Anything a combinator accepts: a composition, an intent, or a chain's node. */
  export type Part =
    | IAutoMovieComposition
    | IAutoMovieIntent
    | {
        /**
         * Composition unwrapped by reference when a builder receives a chain or
         * another node-bearing value.
         */
        readonly node: IAutoMovieComposition;
      };
}
