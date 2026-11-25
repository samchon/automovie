/** Explicit intended collision primitive retained in external-model provenance. */
export type IAutoMovieGeneratedCollisionProxy =
  | {
      /** Capsule used by deterministic collision and mass queries. */
      recipe: "capsule-v1";

      /** Positive radius and cylindrical-body height in production meters. */
      parameters: {
        /** Capsule and cylindrical-body radius in meters. */
        radius: number;

        /** Cylindrical-body height excluding spherical caps, in meters. */
        height: number;
      };
    }
  | {
      /** Axis-aligned box used by deterministic collision and mass queries. */
      recipe: "box-v1";

      /** Positive full extents in production meters. */
      parameters: {
        /** Full local-X extent in meters. */
        width: number;

        /** Full local-Y extent in meters. */
        height: number;

        /** Full local-Z extent in meters. */
        depth: number;
      };
    };
