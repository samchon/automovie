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
 * @evidence contracts/common.md#principled-implementation A returned construction keeps the complete stage geometry and original admission verdict together, with actual generated identities, source correspondence and independent mapping observations even when checks refuse.
 * @evidence contracts/common.md#clear-and-simple-design Model/admission remain separate and existing typed owners hold hair, material seats, source regions, reference and oral/mapping data.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inspectable refused geometry becomes no accepted editor state, source registration is not clinical acceptance and observations change no condition or tolerance.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes construction from admission; members identify owned geometry and each exact correspondence/observation population and its optional absence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This output schema executes no construction, admission or census algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Result ownership defines no pose/hair cache or shared geometry computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The construction caller owns model/maps/arrays; the type opens no evaluator or renderer handle.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceConstruction {
  /** Same stage-owned geometry submitted to ordinary admission; this construction may be refused. */
  model: IAutoMovieModel;

  /** Existing physical and requested measurement refusals, without tolerance changes. */
  admission: IAutoMovieHumanConstructionAdmission;

  /** Actual generated hair identities needed by the person's existing carry. */
  hairPartIds: readonly string[];

  /** Actual emitted per-part station layout and profile clearance, retained with the model's owned hair. */
  hairContactLayouts: ReadonlyMap<string, IHumanFaceHairContactLayout>;

  /** Exact registered material skin seats, keyed by physical domain then ID. */
  materialAttachments: ReadonlyMap<
    string,
    ReadonlyMap<number, IHumanFaceMaterialAttachment>
  >;

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
