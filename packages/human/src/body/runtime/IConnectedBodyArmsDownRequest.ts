/**
 * A worker request to solve the arms-down pose for a body document.
 *
 * @author Samchon
 */
export interface IConnectedBodyArmsDownRequest {
  /**
   * Request kind.
   *
   */
  operation: "armsDown";

  /**
   * Serialized document whose arms are solved.
   *
   */
  document: string;
}
