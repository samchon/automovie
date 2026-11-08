import type { IAutoMovieIntent } from "./IAutoMovieIntent";

/**
 * A time-scoped composition of intents: an immutable tree the schedule
 * resolver places on the film clock.
 *
 * - an intent is a leaf;
 * - `sequence` places its parts one after another;
 * - `parallel` starts its parts together and ends with the longest;
 * - `at` starts its part at an earlier part's anchor (its contact instant
 *   when the timing declares one, else its start) plus an offset, so a
 *   reaction aligns to the action it answers without coordinates or ordinals.
 */
export type AutoMovieComposition =
  | AutoMovieComposition.IIntent
  | AutoMovieComposition.ISequence
  | AutoMovieComposition.IParallel
  | AutoMovieComposition.IAt;
/** Companion types of {@link AutoMovieComposition}. */
export namespace AutoMovieComposition {
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

    /** The parts in order. */
    parts: readonly AutoMovieComposition[];
  }

  /** Parts starting together. */
  export interface IParallel {
    /** Discriminator. */
    kind: "parallel";

    /** The parts. */
    parts: readonly AutoMovieComposition[];
  }

  /** A part aligned to an earlier anchor. */
  export interface IAt {
    /** Discriminator. */
    kind: "at";

    /** The anchor id of an intent placed earlier in walk order. */
    anchor: string;

    /** Seconds after the anchor's instant; may be negative. */
    offset: number;

    /** The aligned part. */
    part: AutoMovieComposition;
  }

  /** Anything a combinator accepts: a composition, an intent, or a chain's node. */
  export type Part =
    | AutoMovieComposition
    | IAutoMovieIntent
    | { readonly node: AutoMovieComposition };

  /**
   * Normalize a part to a composition node.
   *
   * @param part The part.
   * @returns Its node.
   */
  export function of(part: Part): AutoMovieComposition {
    if ("node" in part) return part.node;
    if ("kind" in part) return part;
    return { kind: "intent", intent: part };
  }

  /**
   * Parts one after another.
   *
   * @param parts The parts.
   * @returns The sequence.
   */
  export function sequence(...parts: Part[]): ISequence {
    return { kind: "sequence", parts: parts.map(of) };
  }

  /**
   * Parts starting together.
   *
   * @param parts The parts.
   * @returns The parallel group.
   */
  export function parallel(...parts: Part[]): IParallel {
    return { kind: "parallel", parts: parts.map(of) };
  }

  /**
   * A part aligned to an earlier anchor.
   *
   * @param anchor The anchor id.
   * @param part The part.
   * @param offset Seconds after the anchor's instant.
   * @returns The aligned part.
   */
  export function at(anchor: string, part: Part, offset: number = 0): IAt {
    return { kind: "at", anchor, offset, part: of(part) };
  }
}
