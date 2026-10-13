/** Closed builder-owned measurement proxy parameters. */
export type IAutoMovieGeneratedMeasurementProxy =
  | {
      /** Axis-aligned box used by distance and projected-size queries. */
      recipe: "box-v1";

      /** Positive full extents in production meters. */
      parameters: { width: number; height: number; depth: number };
    }
  | {
      /** Humanoid landmark envelope used by reach and stature queries. */
      recipe: "humanoid-landmarks-v1";

      /** Positive stature, shoulder width and hip width in production meters. */
      parameters: {
        height: number;
        shoulderWidth: number;
        hipWidth: number;
      };
    };
