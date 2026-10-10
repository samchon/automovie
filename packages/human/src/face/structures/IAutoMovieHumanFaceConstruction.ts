import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanConstructionAdmission } from "../../common/structures/IAutoMovieHumanConstructionAdmission";
import type { IHumanFaceOralMeasurementRegistration } from "../anatomy/oral/IHumanFaceOralMeasurementRegistration";
import type { IHumanFaceResidentSourceRegion } from "../basis/IHumanFaceResidentSourceRegion";
import type { IAutoMovieHumanFacePeriocularMappingReport } from "./IAutoMovieHumanFacePeriocularMappingReport";
import type { IHumanFaceHairContactLayout } from "../anatomy/hair/IHumanFaceHairContactLayout";
import type { IHumanFaceMaterialAttachment } from "./IHumanFaceMaterialAttachment";

/**
 * All requested face geometry and its separate, unchanged admission outcome.
 * A rejected construction is inspectable, never an accepted editor state.
 * The numerical document remains the only editable source of the geometry.
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

  /** Actual emitted per-part station layout and profile clearance, retained with the model's owned hair. */
  hairContactLayouts: ReadonlyMap<string, IHumanFaceHairContactLayout>;

  /** Exact registered material skin seats, keyed by physical domain then ID. */
  materialAttachments: ReadonlyMap<string, ReadonlyMap<number, IHumanFaceMaterialAttachment>>;

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
