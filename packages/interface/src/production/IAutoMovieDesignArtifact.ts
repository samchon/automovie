import { IAutoMovieAcceptanceScenario } from "./IAutoMovieAcceptanceScenario";
import { IAutoMovieFormationDesign } from "./IAutoMovieFormationDesign";
import { IAutoMovieModelRecipe } from "./IAutoMovieModelRecipe";
import { IAutoMovieProductionDesign } from "./IAutoMovieProductionDesign";
import { IAutoMovieShotContract } from "./IAutoMovieShotContract";
import { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * Union of every addressable production design value.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `IAutoMovieDesignArtifact` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `IAutoMovieDesignArtifact` for the narrative intent story design ownership system contract.
 */
export type IAutoMovieDesignArtifact =
  | IAutoMovieProductionDesign
  | IAutoMovieModelRecipe
  | IAutoMovieWorldDesign
  | IAutoMovieFormationDesign
  | IAutoMovieShotContract
  | IAutoMovieAcceptanceScenario;
