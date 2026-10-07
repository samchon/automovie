import type { IAutoMovieHumanConstructionAdmission } from "../../common/structures/IAutoMovieHumanConstructionAdmission";
import type { IAutoMovieHumanPersonGenerationBuild } from "./IAutoMovieHumanPersonGenerationBuild";

/** Complete same-source person construction and its separate admission outcome.
 *
 * @evidence contracts/common.md#principled-implementation The full same-source person result retains its body, bones and boundary beside explicit admission.
 * @evidence contracts/common.md#clear-and-simple-design Extends the actual person build result instead of creating a separate renderer or geometry path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejected constructions remain explicitly rejected.
 * @evidence contracts/common.md#meaningful-documentation States complete source context and the editor acceptance boundary.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonConstruction extends IAutoMovieHumanPersonGenerationBuild {
  /** Rejected coarse geometry remains inspectable and is never an accepted editor result. */
  admission: IAutoMovieHumanConstructionAdmission;
}
