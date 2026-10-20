/**
 * Compact result of measuring the current compiled geometry through a production query.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union separates Euclidean distance, terrain sample and query-specific scalar summaries; engine query adapters derive values from the supplied current compiled records and refuse unresolved selectors.
 * @evidence contracts/common.md#clear-and-simple-design Dedicated distance and ground fields expose their fixed units, while the measurement map carries heterogeneous named metrics for reach, formation, camera, effect, pose and film-time queries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No containing ground surface yields the explicit zero-height, null-surface, non-walkable result; unresolved actors or landmarks throw rather than being returned as successful zero distances.
 * @evidence contracts/common.md#meaningful-documentation Defines result kinds, meter units, terrain absence and the query-dependent metric map whose individual units belong to the requested query.
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

      /** Surface height in world meters; zero when no surface contains the point. */
      height: number;

      /** Matching surface id, or null. */
      surface: string | null;

      /** Whether the surface is walkable. */
      walkable: boolean;
    }
  | {
      /** Generic current-compile measurement. */
      kind: "measurement";

      /** Query-specific named metrics; each metric's units and meaning belong to that query. */
      values: Record<string, number | string | boolean>;
    };
