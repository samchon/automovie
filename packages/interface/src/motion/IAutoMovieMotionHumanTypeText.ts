import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * Typing a text on a keyboard from the posture the performer is in (seated at a
 * desk, or standing at a counter), pressing each key with an index fingertip.
 * The keyboard is the scene's prop: its `homeRow` contact places the keys, its
 * `keys` field must span the letter rows, and the typist faces it from its `+Z`
 * side (`AutoMovieArchetypeKeyboard.create`).
 *
 * Each key press is a goal: the index fingertip of the hand on that key's side
 * comes down onto the key's centre by the key's travel and lifts again, while
 * the other hand's fingertip hovers over its home key. Only the index
 * fingertips are contact surfaces of the body, so this is two-finger typing;
 * touch typing with every finger waits on fingertip surfaces for the other
 * fingers. The keys lie on the standard 19.05 mm pitch with the usual row
 * stagger (ISO/IEC 9995; rows offset by a quarter and three quarters of a key),
 * a QWERTY layout, the space bar two rows below the home row pressed by the
 * right hand where it lies under that hand's home key, the bar being wide
 * enough to strike anywhere; a key the layout lacks is refused.
 *
 * Time between presses comes from typing skill: skilled typists strike about
 * every 0.15 to 0.2 s and novices far slower (Salthouse 1986, Psychol Bull
 * 99:303), so the interval runs from 0.5 s for a novice to 0.15 s for an elite
 * on the `speed` axis, with the cross-task timing variability of
 * `HumanSkill.jitter` (interval values provisional inside Salthouse's range).
 * Each press takes the first 40 % of its interval to reach the key, moving from
 * 15 mm above it, and the rest to lift; the key travels 4 mm (inside the 1.5 to
 * 6 mm of ergonomic keyboard standards). The keyboard should sit near elbow
 * height with the elbows near 90 degrees (ANSI/HFES 100-2007): one whose home
 * row lies more than 0.15 m from the elbows' height or beyond the forearms'
 * reach is refused. The body holds the posture it is entered in. Events
 * `press1` to `pressN`, one per key.
 */
export namespace IAutoMovieMotionHumanTypeText {
  /** Parameters. */
  export interface IParams {
    /**
     * The keyboard's prop subject: its `homeRow` affordance is the home row's
     * middle and its `keys` the key field, the typist on its `+Z` side
     * (`AutoMovieArchetypeKeyboard.create`'s contacts).
     */
    keyboard: string;

    /** The text, of keys the layout has (letters and spaces). */
    text: string;
  }

  /**
   * A keyboard as typing reads it: its home row's middle and the heading its
   * typist faces.
   */
  export interface IBoard {
    /** The home row's middle, world metres. */
    at: IAutoMovieVector3;

    /** The heading the typist faces, degrees about +Y. */
    yaw: number;
  }

  /**
   * A key's centre in the keyboard's frame, metres: `x` toward the user's left,
   * `z` away from the user, the home row's middle at the origin. Result
   * returned by typeText.key. The centre and the hand that presses it.
   */
  export type IKeyResult = {
    /**
     * Key centre in keyboard-local metres: +X toward the user's left, +Z away,
     * home-row middle at the origin.
     */
    at: IAutoMovieVector3;
    /** Hand assigned to press this key. */
    side: AutoMovieHumanSide;
  };
}
