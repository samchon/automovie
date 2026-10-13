/** Closed builder-owned collision proxy parameters. */
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
