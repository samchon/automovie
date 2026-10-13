import { AutoMovieFilmTime } from "./AutoMovieFilmTime";

/** A cut or bounded transition at one side of a video edit. */
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
