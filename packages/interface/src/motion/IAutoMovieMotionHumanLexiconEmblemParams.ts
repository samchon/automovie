import type { IAutoMovieMotionHumanHandToFace } from "./IAutoMovieMotionHumanHandToFace";
import type { IAutoMovieMotionHumanGesture } from "./IAutoMovieMotionHumanGesture";
import type { IAutoMovieMotionHumanTouch } from "./IAutoMovieMotionHumanTouch";

/**
 * Open parameters of the emblem lexicon family, keyed by each runtime export
 * name.
 */
export interface IAutoMovieMotionHumanLexiconEmblemParams {
  /**
   * The military hand salute (US Army TC 3-21.5): the forefinger's end at the
   * right brow, the hand in line with the forearm, the upper arm level.
   */
  salute: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "target" | "effector" | "kind" | "hand" | "elbow"
  >;

  /**
   * Hush: the forefinger upright across the lips, its middle on them and the
   * palm turned to the other side, so the thumb's side of the finger meets the
   * mouth and the wrist stays near straight (provisional: the hold, the fifth
   * of a hand the tip stands above the lips, and the twentieth of a hand, the
   * finger's half thickness, its axis stands off them).
   */
  hush: Omit<IAutoMovieMotionHumanHandToFace.IParams, "kind">;

  /**
   * Palms together ahead of the chest, as a prayer or a greeting (wai, gassho):
   * the gesture's held meeting of the two palms.
   */
  palmsTogether: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** A hand on the heart: the right palm on the left chest. */
  handOnHeart: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "target" | "effector" | "kind" | "hand"
  >;

  /**
   * The blown kiss's send, performed after `blownKiss`: the open hand, palm up,
   * swept forward from the lips and held a moment at the shoulder's height,
   * 0.818 of the stature, the forearm and the hand's length, 0.146 and 0.108 of
   * it, ahead of the performer (Drillis and Contini's segment proportions, as
   * Winter's Biomechanics and Motor Control of Human Movement tabulates them),
   * in the performer's own statures so it fits every body.
   */
  blownKissSend: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "target" | "effector" | "kind" | "hold"
  >;

  /**
   * A blown kiss: the fingertips to the lips, then away (provisional: the
   * outward throw is the retraction). The hand leans half way between upright
   * and level, the fingers pointing up and back at the mouth with the palm
   * toward the chin, so the forearm comes from below.
   */
  blownKiss: Omit<IAutoMovieMotionHumanHandToFace.IParams, "kind">;

  /**
   * A facepalm: the palm over the face, the head bowed into it (15 degrees,
   * provisional).
   */
  facepalm: Omit<IAutoMovieMotionHumanHandToFace.IParams, "kind">;

  /** Both hands raised in surrender. */
  handsUp: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** A stop sign: the palm held out. */
  halt: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** A summons: the beckoning hand. */
  comeHere: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /** "I do not know": the shrug with the palms turned up. */
  dontKnow: Omit<IAutoMovieMotionHumanGesture.IParams, "kind">;

  /**
   * A thumbs up: the fist held out before the shoulder, turned a quarter in its
   * palm's plane and then aimed so the straight thumb itself stands up (it lies
   * about 35 degrees off the knuckle line, so the quarter turn alone left it 42
   * degrees off).
   */
  thumbsUp: Omit<
    IAutoMovieMotionHumanGesture.IParams,
    "kind" | "shape" | "turn" | "aim"
  >;

  /**
   * A thumbs down: the fist ahead of the shoulder with the forearm turned over
   * and the elbow raised outward, aimed so the straight thumb itself points
   * down.
   */
  thumbsDown: Omit<
    IAutoMovieMotionHumanGesture.IParams,
    "kind" | "shape" | "aim"
  >;

  /**
   * The OK sign: the forefinger and thumb in a ring, held out (first pass,
   * provisional attitude).
   */
  okSign: Omit<IAutoMovieMotionHumanGesture.IParams, "kind" | "shape">;

  /**
   * The V sign: forefinger and middle finger spread, held out (first pass,
   * provisional attitude).
   */
  victorySign: Omit<IAutoMovieMotionHumanGesture.IParams, "kind" | "shape">;

  /** Crossed fingers, held out (first pass, provisional attitude). */
  crossedFingers: Omit<IAutoMovieMotionHumanGesture.IParams, "kind" | "shape">;

  /**
   * Counting one on the fingers, from the forefinger on (one convention;
   * cultures differ).
   */
  countOne: Omit<IAutoMovieMotionHumanGesture.IParams, "kind" | "shape">;

  /** Counting two on the fingers. */
  countTwo: Omit<IAutoMovieMotionHumanGesture.IParams, "kind" | "shape">;

  /** Counting three on the fingers. */
  countThree: Omit<IAutoMovieMotionHumanGesture.IParams, "kind" | "shape">;

  /** Counting four on the fingers. */
  countFour: Omit<IAutoMovieMotionHumanGesture.IParams, "kind" | "shape">;

  /** Counting five on the fingers: the open hand. */
  countFive: Omit<IAutoMovieMotionHumanGesture.IParams, "kind" | "shape">;

  /**
   * A shaken fist: the raised fist swung from side to side (first pass on the
   * wave's stroke, provisional).
   */
  shakeFist: Omit<IAutoMovieMotionHumanGesture.IParams, "kind" | "shape">;

  /**
   * The hand set for a finger snap: the middle fingertip on the thumb's, held
   * out (first pass: the snap's release is not moved).
   */
  fingerSnap: Omit<IAutoMovieMotionHumanGesture.IParams, "kind" | "shape">;

  /**
   * Air quotes: both hands raised with two fingers hooked (first pass on the
   * raised hands of a cheer; the fingers do not flex twice yet).
   */
  airQuotes: Omit<IAutoMovieMotionHumanGesture.IParams, "kind" | "shape">;

  /** A hand over the mouth, as at a gasp or a yawn. */
  coverMouth: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "target" | "effector" | "kind" | "hand"
  >;

  /** Both hands over the ears. */
  coverEars: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "target" | "other" | "effector" | "kind" | "hand"
  >;
}
