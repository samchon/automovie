import type { IAutoMovieRecoverySourcePortReference } from "..";

/**
 * Caller-supplied source support for a named physical-boundary or cut
 * observation.
 */
export interface IAutoMovieRecoverySourcePort {
  /** Unique caller-supplied port name within this query. */
  id: string;

  /**
   * Typed saved curve, contact or named boundary address carried with this
   * port.
   */
  reference: IAutoMovieRecoverySourcePortReference;

  /** Lower, upper or physical original boundary role requested for this port. */
  side: "before" | "after" | "physical";

  /** Original triangles actually supporting this observed boundary. */
  faces: readonly number[];

  /**
   * Optional original vertex endpoint pairs restricting physical-boundary
   * edges.
   */
  edges?: readonly (readonly [number, number])[];
}
