import type { IAutoMovieHumanConstructionAdmission } from "../../common/structures/IAutoMovieHumanConstructionAdmission";
import type { IAutoMovieHumanPersonGenerationBuild } from "./IAutoMovieHumanPersonGenerationBuild";

/** Complete same-source person construction and its separate admission outcome.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonConstruction extends IAutoMovieHumanPersonGenerationBuild {
  /** Rejected coarse geometry remains inspectable and is never an accepted editor result. */
  admission: IAutoMovieHumanConstructionAdmission;

  /**
   * Original face-only admission and its own census, before body-layer
   * refusals are included in the person's combined acceptance decision.
   */
  faceAdmission: IAutoMovieHumanConstructionAdmission;
}
