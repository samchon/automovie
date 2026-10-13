/**
 * One named studio light's requested direction in the display frame.
 * The viewport owns validation and restores other lights before publication.
 *
 * @author Samchon
 */
export interface IConnectedBodyInspectionLightDirection {
  /** Existing named studio light. */
  name: string;

  /** Dimensionless direction from the origin, Y up and Z forward. */
  direction: readonly [number, number, number];
}
