import { IAutoMovieAcceptanceCriterion } from "./IAutoMovieAcceptanceCriterion";
import { IAutoMovieSceneEvidence } from "./IAutoMovieSceneEvidence";

/** A required or optional acceptance scenario for a shot or film. */
export interface IAutoMovieAcceptanceScenario {
  /** Non-blank stable scenario id, unique under portable case folding. */
  id: string;

  /**
   * Screenplay scenes and optional canon claims this observable check verifies.
   *
   * Traceability is valid for every claim, but only a matching claim
   * verification owner can discharge that claim.
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
   * Observable frame, compiled event or runtime metric criterion. Film-level
   * frame and event criteria also name their owning shot.
   */
  criterion: IAutoMovieAcceptanceCriterion;

  /**
   * Whether current review and final compilation require exact passing evidence
   * for this scenario.
   */
  required: boolean;
}
