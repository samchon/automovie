import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";

/**
 * Data and callback contracts shared by the ResolveMutualGoal operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Both shoulder points and the shared meeting are world metres; reach and straight-arm limit are metres, with positive reach no larger than limit. The solver owns reach admission and refusal when the common point exceeds either arm's limit; the distance tuple keeps a before b.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieResolveMutualGoal contracts used by packages/engine/src/composition/resolveAutoMovieMutualGoal.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Both shoulder points and the shared meeting are world metres; reach and straight-arm limit are metres, with positive reach no larger than limit. The solver owns reach admission and refusal when the common point exceeds either arm's limit; the distance tuple keeps a before b. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieResolveMutualGoal contract belongs to interface; packages/engine/src/composition/resolveAutoMovieMutualGoal.ts and packages/motions/src/handling/handshake.ts use its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieResolveMutualGoal {
  /**
   * One person's acting arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Both shoulder points and the shared meeting are world metres; reach and straight-arm limit are metres, with positive reach no larger than limit. The solver owns reach admission and refusal when the common point exceeds either arm's limit; the distance tuple keeps a before b.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieResolveMutualGoal.ISide keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Both shoulder points and the shared meeting are world metres; reach and straight-arm limit are metres, with positive reach no larger than limit. The solver owns reach admission and refusal when the common point exceeds either arm's limit; the distance tuple keeps a before b. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieResolveMutualGoal.ISide contract belongs to interface; packages/engine/src/composition/resolveAutoMovieMutualGoal.ts and packages/motions/src/handling/handshake.ts use this boundary. Runtime computation remains with those consumers.
   */
  export interface ISide {
    /** The acting shoulder joint, world metres. */
    shoulder: IAutoMovieVector3;

    /** Comfortable shoulder-to-contact distance, metres; positive. */
    reach: number;

    /** Full shoulder-to-contact reach with the elbow straight, metres; at least `reach`. */
    limit: number;
  }

  /**
   * The meeting.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Both shoulder points and the shared meeting are world metres; reach and straight-arm limit are metres, with positive reach no larger than limit. The solver owns reach admission and refusal when the common point exceeds either arm's limit; the distance tuple keeps a before b.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieResolveMutualGoal.IGoal keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Both shoulder points and the shared meeting are world metres; reach and straight-arm limit are metres, with positive reach no larger than limit. The solver owns reach admission and refusal when the common point exceeds either arm's limit; the distance tuple keeps a before b. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieResolveMutualGoal.IGoal contract belongs to interface; packages/engine/src/composition/resolveAutoMovieMutualGoal.ts and packages/motions/src/handling/handshake.ts use this boundary. Runtime computation remains with those consumers.
   */
  export interface IGoal {
    /** Where the hands meet, world metres. */
    point: IAutoMovieVector3;

    /** Each shoulder's distance to it, metres: `a` first. */
    distance: [number, number];
  }

  /**
   * The point where two people's hands meet when both reach for it: a
   * handshake's clasp, a handover's exchange, a high five.
   *
   * Neither person's goal is the other's hand, which moves; both aim at one
   * shared point both can reach comfortably, the way joint-action studies find
   * people converge on it. Each person has a comfortable reach, the
   * shoulder-to-hand distance of the family's working elbow flexion, and the
   * point is where both arms are at it at once: in the vertical plane through
   * the two acting shoulders, the lower of the two points that lie one
   * comfortable reach from each shoulder, so the hands meet below the line
   * between the shoulders. For two equal people that is the midpoint between
   * them, where human-human handovers take place (Hansen et al. 2017,
   * Human-human handover tasks and how distance and object mass matter,
   * Perceptual and Motor Skills 124(1), reviewed by Kopnarski et al. 2023,
   * Front. Psychol. 14:1147296), `sqrt(reach^2 - h^2)` below the shoulders at
   * the horizontal half gap `h`. Between people of unequal stature the same
   * rule moves the point up and toward the taller one, who reaches down more
   * steeply and less far forward while the shorter one reaches forward: the
   * exchange height rises with stature (Sutiphotinun et al. 2020, reviewed by
   * Kopnarski 2023). The rule for unequal partners is provisional, as no study
   * of the clasp point of partners of unequal stature or arm length was
   * located; it replaces a horizontal division with a mean height that left
   * the taller partner's arm straight at the end of its reach.
   *
   * Shoulders farther apart than the two comfortable reaches leave no such
   * point, so both arms extend by one common factor of their comfortable
   * reaches and the hands meet on the line between the shoulders; shoulders
   * nearer than the difference of the reaches shorten both the same way. An
   * action that has its own preferred contact height (`height`, as an object
   * is handed over at chest height) passes it: the point then lies at that
   * height where both arms are the same fraction of their comfortable reaches
   * (by bisection along the horizontal line between the shoulders, on which
   * one distance grows as the other shrinks), and the height is moved to the
   * nearest one inside the band both straight arms reach there.
   *
   * A meeting is refused, not stretched, when it lies beyond a straight arm:
   * the error gives both limits and the widest horizontal shoulder gap the
   * pair can close, so the author moves the people instead of receiving an arm
   * torn off its shoulder.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Both shoulder points and the shared meeting are world metres; reach and straight-arm limit are metres, with positive reach no larger than limit. The solver owns reach admission and refusal when the common point exceeds either arm's limit; the distance tuple keeps a before b.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieResolveMutualGoal.IInput keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Both shoulder points and the shared meeting are world metres; reach and straight-arm limit are metres, with positive reach no larger than limit. The solver owns reach admission and refusal when the common point exceeds either arm's limit; the distance tuple keeps a before b. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieResolveMutualGoal.IInput contract belongs to interface; packages/engine/src/composition/resolveAutoMovieMutualGoal.ts and packages/motions/src/handling/handshake.ts use this boundary. Runtime computation remains with those consumers.
   */
  export type IInput = {
    /** One person. */ a: IAutoMovieResolveMutualGoal.ISide;
    /** The other person. */ b: IAutoMovieResolveMutualGoal.ISide;
    /**
     * The height the action itself prefers for the contact, world metres, when
     * it has one (an object handed over at chest height): the point lies at it,
     * or at the nearest height both straight arms reach.
     */
    height?: number;
  };
}
