import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * Where one material's texture sheet is pinned on the face.
 *
 * The two answers are the two things a repeated finish can mean. A tile carries
 * its own image, so every piece shows the same one and the sheet travels with
 * the piece. A slab, a board, and a panel are cut out of one sheet, so where a
 * piece sits decides what it shows, and the sheet stays where the face put it.
 *
 * `autoMoviePatternTextureTransforms` reads it: `module` makes each piece's
 * centre sample the sheet at `(0.5, 0.5)`, while `face` places each piece's
 * centre on the sheet measured from `origin`, turned by the piece's grain and
 * divided by the tile size. A non-finite `face` origin is refused with a throw.
 *
 * @author Samchon
 */
export type AutoMoviePatternTextureSheet =
  | {
      /** Every piece shows the same image, centred on the piece itself. */
      kind: "module";
    }
  | {
      /** One sheet runs across the whole face and pieces are cut out of it. */
      kind: "face";

      /** Face-local metre point the sheet's own origin sits at. */
      origin: IAutoMoviePatternPoint;
    };
