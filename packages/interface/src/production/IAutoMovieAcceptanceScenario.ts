import { IAutoMovieSceneEvidence } from "./IAutoMovieSceneEvidence";
import { IAutoMovieAcceptanceCriterion } from "./IAutoMovieAcceptanceCriterion";

/**
 * A required or optional acceptance scenario for a shot or film.
 *
 * @evidence requirements/production-design/art-direction-and-visual-language.md#production-design-art-direction-acceptance Exposes `IAutoMovieAcceptanceScenario` as the portable data boundary for the production design art direction acceptance requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-visual-language-acceptance Types `IAutoMovieAcceptanceScenario` for the narrative intent visual language acceptance system contract.
 */
export interface IAutoMovieAcceptanceScenario {
  /**
   * Non-blank stable scenario id, unique under portable case folding.
   *
   * @evidence requirements/production-design/art-direction-and-visual-language.md#production-design-art-direction-acceptance Exposes `id` as the portable data boundary for the production design art direction acceptance requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-visual-language-acceptance Types `id` for the narrative intent visual language acceptance system contract.
   */
  id: string;

  /**
   * Screenplay scenes and optional canon claims this observable check verifies.
   *
   * Traceability is valid for every claim, but only a matching claim
   * verification owner can discharge that claim.
   *
   * @evidence requirements/production-design/art-direction-and-visual-language.md#production-design-art-direction-acceptance Exposes `evidence` as the portable data boundary for the production design art direction acceptance requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-visual-language-acceptance Types `evidence` for the narrative intent visual language acceptance system contract.
   */
  evidence?: IAutoMovieSceneEvidence[];

  /**
   * Scenario target.
   *
   * @evidence requirements/production-design/art-direction-and-visual-language.md#production-design-art-direction-acceptance Exposes `target` as the portable data boundary for the production design art direction acceptance requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-visual-language-acceptance Types `target` for the narrative intent visual language acceptance system contract.
   */
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
   *
   * @evidence requirements/production-design/art-direction-and-visual-language.md#production-design-art-direction-acceptance Exposes `criterion` as the portable data boundary for the production design art direction acceptance requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-visual-language-acceptance Types `criterion` for the narrative intent visual language acceptance system contract.
   */
  criterion: IAutoMovieAcceptanceCriterion;

  /**
   * Whether current review and final compilation require exact passing evidence
   * for this scenario.
   *
   * @evidence requirements/production-design/art-direction-and-visual-language.md#production-design-art-direction-acceptance Exposes `required` as the portable data boundary for the production design art direction acceptance requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-visual-language-acceptance Types `required` for the narrative intent visual language acceptance system contract.
   */
  required: boolean;
}
