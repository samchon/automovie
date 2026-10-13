import { IAutoMovieAcceptanceScenario } from "./IAutoMovieAcceptanceScenario";
import { IAutoMovieFormationDesign } from "./IAutoMovieFormationDesign";
import { IAutoMovieModelRecipe } from "./IAutoMovieModelRecipe";
import { IAutoMovieProductionDesign } from "./IAutoMovieProductionDesign";
import { IAutoMovieShotContract } from "./IAutoMovieShotContract";
import { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * Values stored by the six addressable production-design setters. The accompanying design target selects which value family is admitted.
 *
 * @evidence contracts/common.md#principled-implementation The union covers production, model recipe, world, formation, shot and acceptance records, matching the design target families and their schema-specific setters before mutation enters the project graph.
 * @evidence contracts/common.md#clear-and-simple-design Existing design records are reused directly rather than wrapped in another common payload; the separately typed target owns stable addressing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An arbitrary object is not an addressable design artifact, and setting a model cannot borrow another family's validation merely because the raw JSON is structurally similar.
 * @evidence contracts/common.md#meaningful-documentation Identifies the six setter-owned value families and states that target selection controls which schema is admitted for mutation.
 * @author Samchon
 */
export type IAutoMovieDesignArtifact =
  | IAutoMovieProductionDesign
  | IAutoMovieModelRecipe
  | IAutoMovieWorldDesign
  | IAutoMovieFormationDesign
  | IAutoMovieShotContract
  | IAutoMovieAcceptanceScenario;
