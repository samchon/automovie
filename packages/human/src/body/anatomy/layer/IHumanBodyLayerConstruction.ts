import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanConstructionAdmission } from "../../../common/structures/IAutoMovieHumanConstructionAdmission";
import type { IHumanBodyLayerObservation } from "./IHumanBodyLayerObservation";

/**
 * Constructed native layer parts and their separate limited admission.
 * Rejected geometry remains available to explicit construction inspection.
 *
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
