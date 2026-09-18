import { AutoMovieFilmTime } from "./AutoMovieFilmTime";

/**
 * A cut or bounded transition at one side of a video edit.
 *
 * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `IAutoMovieFilmTransition` as the portable data boundary for the asset generation provider independence requirement.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `IAutoMovieFilmTransition` for the asset spec generation provider choice system contract.
 */
export type IAutoMovieFilmTransition =
  | {
      /** Zero-duration hard cut. */
      kind: "cut";
    }
  | {
      /** Cross-shot overlap using declared head and tail handles. */
      kind: "dissolve";
      /** Exact overlap duration. */
      duration: AutoMovieFilmTime;
    }
  | {
      /** In-segment fade without cross-shot overlap. */
      kind: "fade";
      /** Exact fade duration. */
      duration: AutoMovieFilmTime;
    };
