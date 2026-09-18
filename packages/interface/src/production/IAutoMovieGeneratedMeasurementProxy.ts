/**
 * Closed builder-owned measurement proxy parameters.
 *
 * @evidence requirements/evidence-and-provenance/third-party-sources-rights-and-attribution.md#third-party-generated-source Exposes `IAutoMovieGeneratedMeasurementProxy` as the portable data boundary for the third party generated source requirement.
 * @evidence specifications/evidence-and-provenance/third-party-sources-rights-and-attribution.md#evp-generated-provider-provenance Types `IAutoMovieGeneratedMeasurementProxy` for the evp generated provider provenance system contract.
 */
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
