import type { IAutoMoviePatternExclusion } from "./IAutoMoviePatternExclusion";
import type { IAutoMovieSurfacePatternZone } from "./IAutoMovieSurfacePatternZone";

/**
 * A deterministic module-laying program over one host face.
 *
 * Tiles, bricks, stone slabs, boards, panels, and repeated ornament are not a
 * texture repeat. A texture repeat knows nothing about the real module size,
 * the joint between modules, the piece cut at a boundary, the opening the
 * pattern has to step around, or how many modules were consumed and how much of
 * them was thrown away. This record is the program that does: the author writes
 * the module law per zone, and the engine owns the parts that must be identical
 * every run, namely clipping, exclusion, cut classification, neighbour
 * measurement, seeded variation, and the take-off.
 *
 * Several zones in one pattern is how a transition is expressed: each zone lays
 * its own modules inside its own region, and the neighbour scan then measures
 * across the border between them exactly as it does inside one zone, so a grain
 * that turns or a joint that fails to line up at the transition is reported
 * with both occurrence ids rather than being invisible.
 *
 * {@link generateAutoMovieSurfacePattern} throws for a declaration whose ids are
 * blank or repeated, whose zones or exclusions overlap one another, or whose
 * numeric fields leave the ranges stated below; measured defects of a valid
 * declaration come back as findings. Lengths are face-local metres.
 */
export interface IAutoMovieSurfacePattern {
  /**
   * Stable, non-blank pattern id; every occurrence and finding of a run cites
   * it.
   */
  id: string;

  /**
   * Areas of the face, each with its own module program. Never empty, zone ids
   * are unique, and no two zone regions may overlap.
   */
  zones: IAutoMovieSurfacePatternZone[];

  /**
   * Convex areas subtracted from every zone's coverage, such as an opening or a
   * drain. A piece an exclusion reaches keeps its outline and reports the lost
   * area as an `unsupported-piece` finding. Ids are unique and no two may
   * overlap.
   */
  exclusions: IAutoMoviePatternExclusion[];

  /** Nominal gap between neighbouring laid pieces in metres, at least zero. */
  joint: number;

  /**
   * Metre slack a measured gap may differ from the nominal joint by, at least
   * zero.
   */
  jointTolerance: number;

  /**
   * Edge-normal projection-gap cutoff in metres, at least zero, applied only to
   * pairs selected by the producer's adjacent centre buckets; it is not an
   * exhaustive Euclidean-distance neighbourhood.
   */
  adjacency: number;

  /** Smallest acceptable surviving fraction of a module, within `(0, 1]`. */
  minimumPiece: number;

  /**
   * Greatest tolerated grain deviation between neighbours in degrees, at least
   * zero, or `null` to skip the grain comparison.
   */
  grainToleranceDeg: number | null;

  /** Non-negative safe-integer seed driving every variant draw. */
  seed: number;

  /** Positive safe-integer count of variants the seed may choose between. */
  variants: number;
}
