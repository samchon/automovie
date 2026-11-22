import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionMeeting } from "../compose/IAutoMovieMotionMeeting";

/**
 * A high five, a low five or a fist bump between two standing partners: both
 * bring one hand to one shared point between them and meet there at one
 * shared instant (#3284), the mutual goal the handshake uses
 * (`AutoMovieMotionMeeting`).
 *
 * The meeting point is the pair's mutual goal (`resolveAutoMovieMutualGoal`
 * on both acting arms as the handshake reads them, `handshake.arm`, as the
 * handover does): the action prefers the mean of the two crown heights for a
 * high five, of their waist heights for a low five and of their chest
 * heights for a fist bump (provisional), and the point lies at that height
 * where both arms are the same share of their comfortable reaches, moved
 * down or up only as far as both arms' reach demands. Partners of unequal
 * stature therefore meet where the shorter one can reach. Seated partners
 * whose arms alone fall short lean their trunks forward over the seat, the
 * arm's target first, in equal shares of each hip's flexion room
 * (`HumanSeatedReach`, Chan and Dubey 1995); partners no point lies within
 * both arms of, leaned as far as they can, are refused, never stretched. Each
 * role's hand reaches it in the free-space transport time of its distance
 * (`AutoMovieMotionHumanTiming.transport`); the pair meets when the slower
 * arrives, both stay 0.1 s (provisional, the rebound) and go back in the
 * reach's time. The palms (or the fists) face each other, each surface's
 * skin on the point.
 *
 * With `prop`, each role brings the prop its hand holds instead of the hand:
 * the prop's point (a glass's `lip`) comes to the shared point with the
 * vessel upright, so two glasses meet rim to rim as in a toast, and the
 * hand keeps its prop afterwards (`HumanHeld`).
 *
 * Events: the phrase instants, with `meet` at `ready` and `rebound` at
 * `relax`; both partners share `meet`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation kind: The variant; `high` when absent. hand: The hand; `right` when absent. prop: The subject id of the prop the hand holds, whose point meets the partner's in place of the hand: two glasses clinked in a toast. No prop when absent.
 * @evidence contracts/development/design.md#principled-representation kind: The variant; `high` when absent. hand: The hand; `right` when absent. prop: The subject id of the prop the hand holds, whose point meets the partner's in place of the hand: two glasses clinked in a toast. No prop when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/HumanMutual.ts (HumanMutual.highFive, params); chain/HumanChainMutual.ts (HumanChainMutual.highFive, params); touch/highFive.ts (highFive.plan, context); touch/highFive.ts (highFive.meeting, kind); actions/HumanMutual.ts (HumanMutual.highFive); touch/highFive.ts (highFive.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanSide, IAutoMovieMotionMeeting.IWindow, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanHighFive {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The partner, the variant and the hand.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The variant is a closed union.
   */
  export interface IParams {
    /** The partner. */
    partner: string;

    /** The variant; `high` when absent. */
    kind?: IAutoMovieMotionHumanHighFive.Kind;

    /** The hand; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** The subject id of the prop the hand holds, whose point meets the partner's in place of the hand: two glasses clinked in a toast. No prop when absent. */
    prop?: string;

    /** The prop's point that meets, one of its affordance ids; `lip` when absent. */
    point?: string;

    /** The film seconds the hands meet over (`IAutoMovieMotionMeeting.IWindow`), which both roles give alike: they meet no earlier than `from`, each hand leaving its rest only its own reach's time before, and part at `to`; the natural meeting when absent. */
    window?: IAutoMovieMotionMeeting.IWindow;

    /** A world point the hand is brought to in place of the pair's own meeting point, metres: the one point several pairs meet at, as glasses in a toast of four. The pair's shared instants are kept. The pair's own point when absent. */
    at?: IAutoMovieVector3;
  }

  /**
   * The meeting kind of a variant for a hand. The variants.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The meeting kind of a variant for a hand. The variants.
   * @evidence contracts/development/design.md#principled-representation Closed choices "high", "low", "fist" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: touch/highFive.ts (highFive.meeting, kind); touch/highFive.ts (highFive.HEIGHTS); touch/highFive.ts (highFive.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in highFive.meeting.
   */
  export type Kind = "high" | "low" | "fist";
}
