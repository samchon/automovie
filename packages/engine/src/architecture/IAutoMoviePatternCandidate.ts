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
 * @evidence contracts/common.md#principled-implementation A module is a rectangle given by centre, size and in-plane rotation, so its four corners are `±size / 2` turned by `rotationDeg` about `center`, the representation the clipper, reach check and instancer all derive from.
 * @evidence contracts/common.md#clear-and-simple-design Holds only what a generator decides per module, identity, placement, footprint, grain and flip, while clipping, cut state and variant are derived by the run.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `mirror` changes no footprint or instance slot and is visible only through the texture transform, and a mirrored pair is not a grain break; the run applies these rules to every candidate alike.
 * @evidence contracts/common.md#meaningful-documentation States who forms the corners and every refusal on a candidate, the metre and degree units, that `size.u` need not be the longer side, the rotation direction, the grain's modulo-180 reading, and what book-matching means for `mirror`.
 * @evidenceExclude contracts/performance.md#efficient-algorithms No code; each candidate is validated and cornered in constant time inside the run, whose cost is answered on `generateAutoMovieSurfacePattern`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The run consumes each candidate once per cell and keeps none, so there is no generator output to share across runs.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The author's generator returns it and the run copies the fields it keeps into a placement, retaining no reference to the candidate.
 */
export interface IAutoMoviePatternCandidate {
  /** Stable module identity, unique inside its zone. */
  id: string;

  /** Module centre in face-local metres. */
  center: IAutoMoviePatternPoint;

  /** Module footprint in metres; the joint is the gap the author leaves. */
  size: {
    /**
     * Module extent along its own U axis before rotation, in metres; it need
     * not be the longer side.
     */
    u: number;

    /** Module extent along its own V axis before rotation, in metres. */
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
