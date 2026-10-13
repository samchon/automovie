import { AutoMovieFilmTime } from "./AutoMovieFilmTime";

/**
 * A cut or bounded transition at one side of a video edit.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union distinguishes zero-length cut, cross-shot dissolve and in-segment fade; authored time is converted onto the production frame grid before timeline assembly.
 * @evidence contracts/common.md#clear-and-simple-design Duration exists only on transitions that consume frames, and handle ownership stays with the surrounding video edit rather than this boundary choice.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Dissolve requires declared source handles and fade consumes its segment; neither kind authorizes invented footage or an implicit duration.
 * @evidence contracts/common.md#meaningful-documentation Explains hard-cut duration, dissolve overlap and handle use, and the distinct in-segment fade meaning.
 * @author Samchon
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
