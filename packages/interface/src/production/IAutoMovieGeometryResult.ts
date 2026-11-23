/**
 * Compact result of measuring the current compiled geometry through a
 * production query.
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

      /**
       * Surface height in world meters; zero when no surface contains the
       * point.
       */
      height: number;

      /** Matching surface id, or null. */
      surface: string | null;

      /** Whether the surface is walkable. */
      walkable: boolean;
    }
  | {
      /** Generic current-compile measurement. */
      kind: "measurement";

      /**
       * Query-specific named metrics; each metric's units and meaning belong to
       * that query.
       */
      values: Record<string, number | string | boolean>;
    };
