import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * Where one material's texture sheet is pinned on the face.
 *
 * The two answers are the two things a repeated finish can mean. A tile carries
 * its own image, so every piece shows the same one and the sheet travels with
 * the piece. A slab, a board, and a panel are cut out of one sheet, so where a
 * piece sits decides what it shows, and the sheet stays where the face put it.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `AutoMoviePatternTextureSheet` defines where one material's texture sheet is pinned on the face. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `AutoMoviePatternTextureSheet` structures where one material's texture sheet is pinned on the face for the system that resolves the declared physical-module pattern deterministically.
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
