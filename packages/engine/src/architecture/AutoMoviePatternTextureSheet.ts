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
 * @evidence contracts/development/design.md#principled-representation A discriminated union on `kind`: the module variant fixes the sheet to each piece's centre, and the face variant maps a piece centre to sheet turns by subtracting `origin`, rotating by the grain and dividing by the tile size, which is the rigid placement of one continuous sheet on the face.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two variants for the two meanings of a repeated finish, with `origin` present only where it is read, so a module sheet cannot carry an ignored origin.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No material or finish name selects a variant; the caller chooses one per call, and the consumer throws on a non-finite origin rather than substituting zero.
 * @evidence contracts/development/common.md#meaningful-documentation The documentation states what each variant means physically, how the consumer maps a piece centre under each, and the non-finite origin refusal; each member states its role and unit.
 */
export type AutoMoviePatternTextureSheet =
  | {
      /** Every piece shows the same image, centred on the piece itself. */
      kind: "module";
    }
  | {
      /** One sheet runs across the whole face and pieces are cut out of it. */
      kind: "face";

      /** Face-local metre point the sheet's own origin sits at; finite. */
      origin: IAutoMoviePatternPoint;
    };
