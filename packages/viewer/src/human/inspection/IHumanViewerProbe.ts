import type { IHumanShotHealth } from "./IHumanShotHealth.js";

/**
 * One `/health` probe of a viewer port.
 *
 * @author Samchon
 */
export interface IHumanViewerProbe {
  /**
   * The answer; null when the connection was refused, undefined when nothing complete answered.
   */
  health: IHumanShotHealth | null | undefined;

  /** Why no complete answer arrived, empty when one did. */
  failure: string;
}
