import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * One module a zone's own program proposes, before any clipping.
 *
 * `generateAutoMovieSurfacePattern` forms the module's four corners by turning
 * `±size / 2` by `rotationDeg` about `center`, and throws on the first
 * candidate whose id is blank or repeated in its zone, whose centre, rotation
 * or grain is not finite, whose size is not above zero, or whose corners reach
 * further than the zone's `reach` from the cell origin.
 *
 * @author Samchon
 */
export interface IAutoMoviePatternCandidate {
  /** Stable module identity, unique inside its zone. */
  id: string;

  /** Module centre in face-local metres. */
  center: IAutoMoviePatternPoint;

  /** Module footprint in metres; the joint is the gap the author leaves. */
  size: {
    /** Module extent along its own long axis before rotation, in metres. */
    u: number;

    /** Module extent across that axis before rotation, in metres. */
    v: number;
  };

  /**
   * In-plane module rotation in degrees, counter-clockwise about the normal.
   */
  rotationDeg: number;

  /** Material grain direction in degrees; read modulo 180. */
  grainDeg: number;

  /**
   * Whether the piece is laid face-flipped, its own U axis reversed.
   *
   * This is what book-matching is: two slabs cut from one block and opened like
   * a page, so the second shows the first's image reversed. A rectangle is
   * unchanged by that flip, so the piece keeps the same footprint and the same
   * instance slot; what reverses is the material across it, which is why the
   * flip only becomes visible through
   * {@link autoMoviePatternTextureTransforms}.
   *
   * It is not the grain turned. {@link grainDeg} states the direction the grain
   * runs on the surface either way, so a mirrored pair whose grain runs one way
   * is continuous grain and is not reported as a break.
   */
  mirror: boolean;
}
