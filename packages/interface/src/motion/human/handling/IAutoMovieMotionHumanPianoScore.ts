import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanManipulate } from "./IAutoMovieMotionHumanManipulate";

/**
 * A seated performance on a fixed upright keyboard. Notes specify fingering
 * and physical key travel times. The pianoScore law admits the prop, score
 * timing and hand assignments at placement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the instrument and which inputs belong to the score.
 * @evidence contracts/development/design.md#principled-representation Represents the phrase as keyed, timed contacts in the instrument's own numbering.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns only the input to the registered pianoScore law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the canonical hand and digit identities.
 */
export interface IAutoMovieMotionHumanPianoScore {
  /** Subject id of the fixed upright piano whose buttons are played. */
  prop: string;

  /**
   * Nonempty notes in nondecreasing attack-start order, starting at
   * 0.25 seconds or later. Notes on one hand form a chord when all four
   * times match and the keys and digits are distinct. Leave time for the
   * hand to travel between successive voicings.
   */
  notes: readonly IAutoMovieMotionHumanPianoScore.INote[];
}

/**
 * The notes of the pianoScore authoring contract.
 */
export namespace IAutoMovieMotionHumanPianoScore {
  /**
   * One key depression, optional dwell and release; all times are seconds
   * since action start, with 0 < from < at <= release < to.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies each physical phase and its clock origin.
   * @evidence contracts/development/design.md#principled-representation Describes one independently moving key, with both hand and digit named.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Contains only the target, fingering and four authored phase boundaries.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The prop supplies travel, position and surface normal.
   */
  export interface INote {
    /** Key affordance, key1 (A0) through key88 (C8) on an upright piano. */
    key: string;

    /** Hand taking this note. Opposite hands can play overlapping notes on different keys. */
    side: AutoMovieHumanSide;

    /** Digit meeting the key. */
    digit: IAutoMovieMotionHumanManipulate.Finger;

    /** Attack begins with the fingertip on the undepressed key. */
    from: number;

    /** The key reaches the bottom of its travel. */
    at: number;

    /** The key begins to return. */
    release: number;

    /** The key returns to rest. */
    to: number;
  }
}
