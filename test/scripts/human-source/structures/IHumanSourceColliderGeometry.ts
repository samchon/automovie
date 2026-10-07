import type { IHumanSourceColliderQueryFailure } from "./IHumanSourceColliderQueryFailure.ts";

/**
 * Query readiness of one registered contact collider at its source neutral.
 *
 * @author Samchon
 */
export interface IHumanSourceColliderGeometry {
  /** Original contact collider position in the source declaration. */
  collider: number;

  /** Actual source surface identity. */
  surface: string;

  /** Resident surface triangles and registered closure triangles. */
  surfaceTriangles: number;

  /** See `surfaceTriangles`. */
  closureTriangles: number;

  /** Distinct source vertices referenced by those triangles. */
  residentPoints: number;

  /** Actual engine queries attempted at those resident source points. */
  queriesAttempted: number;

  /** Constructor and point-query failures, kept separately from successful readings. */
  failures: IHumanSourceColliderQueryFailure[];
}
