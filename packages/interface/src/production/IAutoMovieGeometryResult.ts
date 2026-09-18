/**
 * Geometry result intentionally remains compact and query-specific.
 *
 * @evidence requirements/agent-authoring/partial-work.md#agent-partial-result-control Exposes `IAutoMovieGeometryResult` as the portable data boundary for the agent partial result control requirement.
 * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-result-checkpoint Types `IAutoMovieGeometryResult` for the spec authoring partial result checkpoint system contract.
 */
export type IAutoMovieGeometryResult =
  | {
      /** Distance in meters. */
      kind: "distance";

      /** Measured value. */
      meters: number;
    }
  | {
      /** Ground sample. */
      kind: "ground";

      /** Surface height in meters. */
      height: number;

      /** Matching surface id, or null. */
      surface: string | null;

      /** Whether the surface is walkable. */
      walkable: boolean;
    }
  | {
      /** Generic current-compile measurement. */
      kind: "measurement";

      /** Machine-readable metric names and scalar or text values. */
      values: Record<string, number | string | boolean>;
    };
