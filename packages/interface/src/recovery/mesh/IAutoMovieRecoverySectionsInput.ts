import type {
  IAutoMovieRecoveryInput,
  IAutoMovieRecoverySlabPair,
  IAutoMovieRecoveryTerminalSeed,
} from "../../index";

/**
 * A named collection of fixed physical cuts through one registered mesh.
 * Coordinates are signed distances along the normalized axis from the
 * registered origin; the caller establishes their feature meaning. Every mesh
 * component intersecting each plane remains admitted.
 */
export interface IAutoMovieRecoverySectionsInput extends Pick<
  IAutoMovieRecoveryInput,
  | "verticesMm"
  | "triangles"
  | "axis"
  | "reference"
  | "toleranceMm"
  | "maxSpans"
  | "exactCoordinateAliases"
  | "sourceOrientationSign"
  | "cornerDegrees"
> {
  /** Stable collection name prefixed to every resulting contour curve. */
  name: string;

  /**
   * Nonempty finite distinct signed millimetre coordinates; input order is
   * retained. Optional terminal observations append their source-observed event
   * and bracket planes.
   */
  coordinatesMm: readonly number[];

  /**
   * Optional existing closed loops to follow toward increasing coordinates;
   * omitted preserves exactly the requested plane collection. Source-observed
   * critical planes and brackets are appended while retaining all intersecting
   * source components.
   */
  terminalSeeds?: readonly IAutoMovieRecoveryTerminalSeed[];

  /**
   * Optional finite source-slab observations. Both increasing bounds must occur
   * in coordinatesMm; all source components remain present and exact
   * port/critical evidence is delivered through onSourceSlab. Omitted preserves
   * ordinary curve-only observation.
   */
  slabPairs?: readonly IAutoMovieRecoverySlabPair[];

  /**
   * Retain exact cutter-emitted source faces for lineage even without a slab
   * pair. These acquisition-only copies do not enter returned curve
   * coefficients. Omitted preserves ordinary lineage retention.
   */
  includeExactSourceLineage?: boolean;
}
