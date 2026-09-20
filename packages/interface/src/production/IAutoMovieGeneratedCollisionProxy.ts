/**
 * Closed builder-owned collision proxy parameters.
 *
 * @evidence requirements/evidence-and-provenance/third-party-sources-rights-and-attribution.md#third-party-generated-source Exposes `IAutoMovieGeneratedCollisionProxy` as the portable data boundary for the third party generated source requirement.
 * @evidence specifications/evidence-and-provenance/third-party-sources-rights-and-attribution.md#evp-generated-provider-provenance Types `IAutoMovieGeneratedCollisionProxy` for the evp generated provider provenance system contract.
 */
export type IAutoMovieGeneratedCollisionProxy =
  | {
      /** Capsule used by deterministic collision and mass queries. */
      recipe: "capsule-v1";

      /** Positive radius and cylindrical-body height in production meters. */
      parameters: { radius: number; height: number };
    }
  | {
      /** Axis-aligned box used by deterministic collision and mass queries. */
      recipe: "box-v1";

      /** Positive full extents in production meters. */
      parameters: { width: number; height: number; depth: number };
    };
