import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * A whole-body self action while standing: the yawn-and-stretch with both arms
 * overhead, both arms raised in victory, a fist pump, a neck roll and a
 * shoulder roll. The body-directed touches of the same family (pats, rubs,
 * scratches, covers, pain holds) are rows of the `touch` law.
 *
 * Each action is a phrase: the parts rise to their place over the free-space
 * transport of the hand's travel (`AutoMovieMotionHumanTiming.transport`), and
 * at least as long as each raised arm's path needs to keep within the audit's
 * travel bound (`AutoMovieMotionHumanArmPlanned.reaching`), or 0.4 s for the
 * head and the shoulders, perform the stroke, hold and return in the rise's
 * time. Each arm's raise, hold and lowering are planned as one trajectory over
 * the clock's instants (`AutoMovieMotionHumanArm.carried`), from the entry's
 * angles to a named place of the air (`AutoMovieMotionHumanTargetGrid.place`):
 * overhead above the shoulders for the stretch, palms up; overhead and outside
 * them for victory, the hands fists, as winners raise their arms above the
 * shoulders and away from the body with fists clenched (Hwang and Matsumoto
 * 2014, Motivation and Emotion: medal winners at the 2004 and 2008 Olympic and
 * 2004 Paralympic judo events, blind athletes among them); at eye height a
 * forearm ahead of the shoulder for the fist pump, the forearm rising to it
 * from an elbow near the body; its fist drops a fifth of the arm and rises
 * again `count` times. A neck roll circles the head through a light share of
 * the neck's flexion and lateral range, a shoulder roll circles both shoulder
 * girdles through a light share of theirs. The stretch lasts 6 s in all, the
 * yawn's duration of Provine 1986 (unverified); every other time and size is
 * provisional.
 *
 * Events: the phrase instants.
 */
export namespace IAutoMovieMotionHumanSelfAction {
  /** Parameters. */
  export interface IParams {
    /** The action. */
    kind: IAutoMovieMotionHumanSelfAction.Kind;

    /** The arm of a fist pump; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** Pumps or rolls; 3 for a pump, 2 for a roll when absent. */
    count?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * Capture cases of the self-directed body actions on one polygon man standing
   * from quiet standing. The actions.
   */
  export type Kind =
    | "stretch"
    | "victory"
    | "fistPump"
    | "neckRoll"
    | "shoulderRoll";
}
