import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanConstructionAdmission } from "../../../common/structures/IAutoMovieHumanConstructionAdmission";
import type { IHumanBodyLayerObservation } from "./IHumanBodyLayerObservation";

/**
 * Constructed native layer parts and their separate limited admission.
 * Rejected geometry remains available to explicit construction inspection.
 *
 * @evidence contracts/common.md#principled-implementation Geometry and original observations remain available independently of acceptance.
 * @evidence contracts/common.md#clear-and-simple-design One result couples emitted parts with their owning observation and admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejected offsets are never marked accepted.
 * @evidence contracts/common.md#meaningful-documentation States construction inspection and acceptance separately.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The constructor owns part identities.
 * @evidenceExclude contracts/modeling.md#parameter-channels Contains no authoring input.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Carries the constructor's emitted geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The constructor and observation define their units.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The constructor defines the shared sheets.
 * @evidenceExclude contracts/modeling.md#rendered-observation Body and person consumers observe these parts.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The field retains its original qualification.
 * @evidenceExclude contracts/anatomy.md#permitted-range The surface owner measures offset conditions.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This output supplies no personal vertices.
 * @author Samchon
 */
export interface IHumanBodyLayerConstruction {
  /** Disjoint dermal outer, fascial inner and nonempty rim members of one subcutaneous shell. */
  parts: IAutoMovieModel["parts"];

  /** Source skin scalar appearance, copied as an untextured inspection finish. */
  material: IAutoMovieModel["materials"][number];

  /** Original native observation population and qualification. */
  observation: IHumanBodyLayerObservation;

  /** Limited offset admission, with unknown reach retained as a failure. */
  admission: IAutoMovieHumanConstructionAdmission;
}
