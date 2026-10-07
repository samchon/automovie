import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanConstructionAdmission } from "../../common/structures/IAutoMovieHumanConstructionAdmission";
import type { IHumanFaceOralMeasurementRegistration } from "../anatomy/oral/IHumanFaceOralMeasurementRegistration";
import type { IHumanFaceResidentSourceRegion } from "../basis/IHumanFaceResidentSourceRegion";
import type { IAutoMovieHumanFacePeriocularMappingReport } from "./IAutoMovieHumanFacePeriocularMappingReport";

/**
 * All requested face geometry and its separate, unchanged admission outcome.
 * A rejected construction is inspectable, never an accepted editor state.
 * The numerical document remains the only editable source of the geometry.
 *
 * @evidence contracts/common.md#principled-implementation The complete model and exact source correspondence accompany their independent admission outcome.
 * @evidence contracts/common.md#clear-and-simple-design A single result retains geometry, generated hair IDs, reference and oral source transport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No rejected geometry is relabelled an accepted editor result.
 * @evidence contracts/common.md#meaningful-documentation Documents model ownership, source correspondence and the numerical document boundary.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceConstruction {
  /** Same owned model the ordinary builder admits. */
  model: IAutoMovieModel;

  /** Existing physical and requested measurement refusals, without tolerance changes. */
  admission: IAutoMovieHumanConstructionAdmission;

  /** Actual generated hair identities needed by the person's existing carry. */
  hairPartIds: readonly string[];

  /** Exact retained native region correspondence from this model's own gather. */
  sourceRegions: readonly IHumanFaceResidentSourceRegion[];

  /** Actual retired source-card vertices; generated brow acquisition cannot read them. */
  browReplacements: ReadonlyMap<string, ReadonlySet<number>>;

  /** Actual shape-only geometry, independent of admission success. */
  reference?: ReadonlyMap<string, readonly number[]>;

  /** Source correspondence of the constructed oral parts, not clinical acceptance. */
  oral?: IHumanFaceOralMeasurementRegistration;

  /** Actual material/pre-offset/offset readings, independent of physical acceptance. */
  periocularMappings?: IAutoMovieHumanFacePeriocularMappingReport[];
}
