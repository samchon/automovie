import { IAutoMovieAcceptanceCriterion } from "./IAutoMovieAcceptanceCriterion";
import { IAutoMovieSceneEvidence } from "./IAutoMovieSceneEvidence";

/**
 * Required or optional observable acceptance of one shot or the whole film. Review evidence must match the current criterion and its target identity.
 *
 * @evidence contracts/common.md#principled-implementation Stable scenario identity binds a target and one typed criterion to current evidence; required scenarios must have exact passing evidence at review and final gates rather than an unrelated approval note.
 * @evidence contracts/common.md#clear-and-simple-design The record groups identity, target, criterion and requiredness, with optional screenplay traceability kept separate from the measurement and its review result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Traceability citations do not by themselves discharge a canon claim, and passing evidence for a different frame, event or criterion cannot satisfy this scenario.
 * @evidence contracts/common.md#meaningful-documentation Gives portable identity uniqueness, shot-versus-film targeting, film-level shot disambiguation, exact required evidence and the limited authority of optional claim citations.
 * @author Samchon
 */
export interface IAutoMovieAcceptanceScenario {
  /** Non-blank stable scenario id, unique under portable case folding. */
  id: string;

  /**
   * Screenplay scenes and optional canon claims this observable check verifies.
   *
   * Traceability is valid for every claim, but only a matching claim verification owner can discharge that claim.
   */
  evidence?: IAutoMovieSceneEvidence[];

  /** Scenario target. */
  target:
    | {
        /** Shot target. */
        kind: "shot";

        /** Shot id. */
        id: string;
      }
    | {
        /** Film target. */
        kind: "film";

        /** Film id. */
        id: string;
      };

  /**
   * Observable frame, compiled event or runtime metric criterion. Film-level frame and event criteria also name their owning shot.
   */
  criterion: IAutoMovieAcceptanceCriterion;

  /**
   * Whether current review and final compilation require exact passing evidence for this scenario.
   */
  required: boolean;
}
