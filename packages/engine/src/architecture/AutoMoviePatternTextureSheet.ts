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
 * @evidence contracts/common.md#principled-implementation A discriminated union on `kind`: the module variant fixes the sheet to each piece's centre, and the face variant maps a piece centre to sheet turns by subtracting `origin`, rotating by the grain and dividing by the tile size.
 * @evidence contracts/common.md#clear-and-simple-design Two variants for the two real meanings of a repeated finish, with `origin` present only on the variant that needs it, so a module sheet cannot carry an unused point.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No material or finish name selects a variant; the caller chooses one per call, and the consumer throws on a non-finite origin rather than substituting zero.
 * @evidence contracts/common.md#meaningful-documentation States what each variant shows, where the face sheet is anchored and in which units, how a piece's place is mapped onto it, and the refusal.
 * @evidenceExclude contracts/performance.md#cost-and-resources A two-variant tagged record with no code; its consumer spends constant arithmetic per occurrence on it and keeps no reference to the sheet or its origin.
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
