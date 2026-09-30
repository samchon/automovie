import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalAngle } from "../measurements/IAutoMovieHumanBodyAnatomicalAngle";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyTomographicLength } from "../measurements/IAutoMovieHumanBodyTomographicLength";

/**
 * Target or observed osseous dimensions of one humerus.
 *
 * The humeral head is an articular ball, while the tubercles and shaft carry
 * distinct muscle origins and insertions. A glenohumeral rig centre and elbow
 * point do not determine the individual's shaft line or neck-shaft angle;
 * the current CT-backed head component consequently represents only its head.
 * The fields below can later constrain a separately generated full bone,
 * never ask the user to sculpt its vertices.
 * @author Samchon
 */
export type IAutoMovieHumanBodyHumerusMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    sphereFittedHeadRadius?: IAutoMovieHumanBodyTomographicLength;
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;
    neckShaftAngle?: IAutoMovieHumanBodyAnatomicalAngle;
  }>;
