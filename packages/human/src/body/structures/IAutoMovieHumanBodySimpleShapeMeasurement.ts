/**
 * One optional exterior measurement of the simple tier and the channel its
 * own `HUMAN_BODY_MEASUREMENTS` rule solves.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeMeasurement {
  /** The simple parameter the measurement sets. */
  parameter:
    | "waistMetres"
    | "hipsMetres"
    | "bustMetres"
    | "shoulderMetres"
    | "thighMetres"
    | "upperArmMetres"
    | "calfMetres";

  /** The body channel its rule solves. */
  channel: string;
}
