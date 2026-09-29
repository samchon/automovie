import type { IAutoMovieHumanBodyClavicleMeasurements } from "./IAutoMovieHumanBodyClavicleMeasurements";
import type { IAutoMovieHumanBodyDeltoidMeasurements } from "./IAutoMovieHumanBodyDeltoidMeasurements";
import type { IAutoMovieHumanBodyHumerusMeasurements } from "./IAutoMovieHumanBodyHumerusMeasurements";
import type { IAutoMovieHumanBodyPectoralisMajorMeasurements } from "./IAutoMovieHumanBodyPectoralisMajorMeasurements";
import type { IAutoMovieHumanBodyScapulaMeasurements } from "./IAutoMovieHumanBodyScapulaMeasurements";
import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";

/**
 * One side's shoulder-complex measurements, with independently owned parts.
 *
 * Clavicle and scapula have different thoracic articulations; humerus turns
 * at the glenoid. Deltoid and pectoralis major attach across these bones and
 * the chest. A single `leftShoulder` rig transform or skin morph cannot be
 * substituted for these components. The authored data are optional direct
 * dimensions/volumes, while geometry, attachments and motion are generated
 * and validated separately.
 * @author Samchon
 */
export type IAutoMovieHumanBodyShoulderMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
  clavicle?: IAutoMovieHumanBodyClavicleMeasurements;
  scapula?: IAutoMovieHumanBodyScapulaMeasurements;
  humerus?: IAutoMovieHumanBodyHumerusMeasurements;
  deltoid?: IAutoMovieHumanBodyDeltoidMeasurements;
  pectoralisMajor?: IAutoMovieHumanBodyPectoralisMajorMeasurements;
  }>;
