import type { IHumanConstructionCheck } from "../../common/basis/IHumanConstructionCheck";
import type { IAutoMovieHumanFaceConstruction } from "../structures/IAutoMovieHumanFaceConstruction";
import type { IAutoMovieHumanFacePeriocularMappingReport } from "../structures/IAutoMovieHumanFacePeriocularMappingReport";

/** One owned geometry stage whose original admission and publication remain separate.
 *
 * @author Samchon
 */
export interface IHumanFaceConstructionStage {
  /** Complete geometry and original source correspondence before admission. */
  value: Omit<IAutoMovieHumanFaceConstruction, "admission">;

  /** Original physical and requested measurement conditions on this geometry. */
  checks: readonly IHumanConstructionCheck[];

  /** Existing success-only observers; construction inspection does not publish them. */
  publish: () => void;

  /** Optional mapping observations read only by explicit construction inspection. */
  readMappings?: () => IAutoMovieHumanFacePeriocularMappingReport[];
}
