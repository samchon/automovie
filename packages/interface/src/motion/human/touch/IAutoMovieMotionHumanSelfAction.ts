import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";

/**
 * A whole-body self action while standing (#3285): the yawn-and-stretch with
 * both arms overhead, both arms raised in victory, a fist pump, a neck roll
 * and a shoulder roll. The body-directed touches of the same family (pats,
 * rubs, scratches, covers, pain holds) are rows of the `touch` law.
 *
 * Each action is a phrase: the parts rise to their place over the free-space
 * transport of the hand's travel (`AutoMovieMotionHumanTiming.transport`),
 * and at least as long as each raised arm's path needs to keep within the
 * audit's travel bound (`AutoMovieMotionHumanArmPlanned.reaching`), or
 * 0.4 s for the head and the shoulders, perform the stroke, hold and return
 * in the rise's time. Each arm's raise, hold and lowering are planned as one
 * trajectory over the clock's instants (`AutoMovieMotionHumanArm.carried`),
 * from the entry's angles to a named place of the air
 * (`AutoMovieMotionHumanTargetGrid.place`):
 * overhead above the shoulders for the stretch, palms up; overhead and
 * outside them for victory, the hands fists, as winners raise their arms
 * above the shoulders and away from the body with fists clenched (Hwang and
 * Matsumoto 2014, Motivation and Emotion: medal winners at the 2004 and
 * 2008 Olympic and 2004 Paralympic judo events, blind athletes among them);
 * at eye height a forearm ahead of the shoulder for the fist
 * pump, the forearm rising to it from an elbow near the body; its fist drops
 * a fifth of the arm and rises again `count` times. A neck roll circles the
 * head through a light share of the neck's flexion and lateral range, a
 * shoulder roll circles both shoulder girdles through a light share of
 * theirs. The stretch lasts 6 s in all, the yawn's duration of Provine 1986
 * (unverified); every other time and size is provisional.
 *
 * Events: the phrase instants.
 *
 * @evidence contracts/development/common.md#meaningful-documentation side: The arm of a fist pump; `right` when absent. count: Pumps or rolls; 3 for a pump, 2 for a roll when absent.
 * @evidence contracts/development/design.md#principled-representation side: The arm of a fist pump; `right` when absent. count: Pumps or rolls; 3 for a pump, 2 for a roll when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainManual.ts (HumanChainManual.selfAction, params); touch/selfAction.ts (selfAction.plan, context); touch/selfAction.ts (selfAction.plan); executable/cases/selfCases.ts (selfCases).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanHand.Side, IAutoMovieMotionManner.IManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanSelfAction {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The action by name, the hand of a one-arm action and the repetitions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed kind union.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The action. */
    kind: IAutoMovieMotionHumanSelfAction.Kind;

    /** The arm of a fist pump; `right` when absent. */
    side?: IAutoMovieMotionHumanHand.Side;

    /** Pumps or rolls; 3 for a pump, 2 for a roll when absent. */
    count?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner.IManner;
  }

  /**
   * Capture cases of the self-directed body actions (#3285) on one polygon man standing from quiet standing. The actions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Capture cases of the self-directed body actions (#3285) on one polygon man standing from quiet standing. The actions.
   * @evidence contracts/development/design.md#principled-representation Closed choices "stretch", "victory", "fistPump", "neckRoll", "shoulderRoll" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: executable/cases/selfCases.ts (selfCases); touch/selfAction.ts (selfAction.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in selfCases.
   */
  export type Kind =
    | "stretch"
    | "victory"
    | "fistPump"
    | "neckRoll"
    | "shoulderRoll";
}
