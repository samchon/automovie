import type {
  IAutoMovieRecoveryInput,
  IAutoMovieRecoverySlabPair,
  IAutoMovieRecoveryTerminalSeed,
} from "..";

/**
 * Registered source and explicit physical station requests for fixed-section
 * Recovery.
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
  /** Name used for the collection and its saved contours. */
  name: string;

  /**
   * Distinct finite signed plane coordinates in millimetres, in the order to
   * observe.
   */
  coordinatesMm: readonly number[];

  /**
   * Optional original requested coordinate and closed loop addresses for
   * terminal tracing.
   */
  terminalSeeds?: readonly IAutoMovieRecoveryTerminalSeed[];

  /**
   * Optional finite ordered station pairs selecting separate source-slab
   * observations.
   */
  slabPairs?: readonly IAutoMovieRecoverySlabPair[];

  /**
   * Whether to include actual cut-emitting triangle IDs in supplied lineage
   * callbacks.
   */
  includeExactSourceLineage?: boolean;
}
