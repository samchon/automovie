import type { IUpperLimbObservationMeasurement } from "./IUpperLimbObservationMeasurement";
import type { IUpperLimbHairContactObservation } from "./IUpperLimbHairContactObservation";
import type { IUpperLimbObservationIdentity } from "./IUpperLimbObservationIdentity";
import type { IAutoMovieHumanBodyBuild } from "@automovie/human";

/** Current document, input identity and consumer readings of one upper limb observation. */
export interface IUpperLimbObservationReport extends IUpperLimbObservationIdentity {
  /** Actual solved body document, shaped rest landmarks and final public frames; positions remain metres rather than report scalar millimetres. */
  bodyWitness: Pick<IAutoMovieHumanBodyBuild, "evaluatedDocument" | "landmarks" | "bones">;
  /** Final Float32 one-skin correspondence and final posed rig readings. */
  performed: readonly IUpperLimbObservationMeasurement[];

  /** Actual pre-contact input admission; absence means no generated hair contact was invoked. */
  contact: IUpperLimbHairContactObservation | null;

  /** Scope limits remain attached to the readings rather than inferred as acceptance. */
  qualification: readonly string[];
}
