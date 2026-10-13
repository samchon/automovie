import { IAutoMoviePatternExclusion } from "./IAutoMoviePatternExclusion";
import { IAutoMovieSurfacePatternZone } from "./IAutoMovieSurfacePatternZone";

/**
 * A deterministic module-laying program over one host face.
 *
 * Tiles, bricks, stone slabs, boards, panels, and repeated ornament are not a
 * texture repeat. A texture repeat knows nothing about the real module size,
 * the joint between modules, the piece cut at a boundary, the opening the
 * pattern has to step around, or how many modules were consumed and how much of
 * them was thrown away. This record is the program that does: the author writes
 * the module law per zone, and the engine owns the parts that must be identical
 * every run — clipping, exclusion, cut classification, neighbour measurement,
 * seeded variation, and the take-off.
 *
 * Several zones in one pattern is how a transition is expressed: each zone lays
 * its own modules inside its own region, and the neighbour scan then measures
 * across the border between them exactly as it does inside one zone, so a grain
 * that turns or a joint that fails to line up at the transition is reported
 * with both occurrence ids rather than being invisible.
 */
export interface IAutoMovieSurfacePattern {
  /** Stable pattern id. */
  id: string;
  /** Areas of the face, each with its own module program. Never empty. */
  zones: IAutoMovieSurfacePatternZone[];
  /** Areas no module may cover, such as an opening or a drain. */
  exclusions: IAutoMoviePatternExclusion[];
  /** Nominal gap between neighbouring laid pieces in metres, at least zero. */
  joint: number;
  /** Metre slack a measured gap may differ from the nominal joint by. */
  jointTolerance: number;
  /** Greatest metre gap at which two laid pieces still count as neighbours. */
  adjacency: number;
  /** Smallest acceptable surviving fraction of a module, within `(0, 1]`. */
  minimumPiece: number;
  /**
   * Greatest tolerated grain deviation between neighbours in degrees, or
   * `null`.
   */
  grainToleranceDeg: number | null;
  /** Non-negative safe-integer seed driving every variant draw. */
  seed: number;
  /** Positive integer count of variants the seed may choose between. */
  variants: number;
}
