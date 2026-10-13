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
 *
 * {@link generateAutoMovieSurfacePattern} refuses a declaration whose zones or
 * exclusions overlap one another, or whose numeric fields leave the ranges
 * stated below; measured defects of a valid declaration come back as findings.
 *
 * @evidence contracts/common.md#principled-implementation A declarative laying program: per-zone lattices filled by a pure author generator, plus pattern-wide joint, adjacency, minimum-piece and grain limits the run measures; byte-identical output rests on the generator being pure and on `seed` being the only source of variation.
 * @evidence contracts/common.md#clear-and-simple-design Pattern-wide law (joint, exclusions, seed, variant count) lives here and each zone owns its region, lattice and generator, so a material transition is two zones rather than a mode flag on one.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No bond, module size or ornament is built in; the only fixed values are the validated ranges, and overlapping zones or exclusions are refused by name instead of being resolved by declaration order.
 * @evidence contracts/common.md#meaningful-documentation States why a pattern is not a texture repeat, the split between author and engine, how zones express a transition, the metre unit and range of every joint field, what a null grain tolerance means, and which declarations are refused.
 * @evidenceExclude contracts/performance.md#cost-and-resources A declaration that computes nothing itself; its fields bound the generator's cost (pairwise zone and exclusion overlap checks, at most `AUTOMOVIE_MAX_PATTERN_CELLS` lattice cells per zone, `adjacency` limiting the neighbour scan), no run result is cached against it, and it retains only its generator closures and polygons while the caller holds it.
 * @author Samchon
 */
export interface IAutoMovieSurfacePattern {
  /** Stable pattern id; every occurrence and finding of a run cites it. */
  id: string;
  /**
   * Areas of the face, each with its own module program. Never empty, and no
   * two zone regions may overlap.
   */
  zones: IAutoMovieSurfacePatternZone[];
  /**
   * Convex areas no module may cover, such as an opening or a drain. No two may
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
   * Greatest metre gap at which two laid pieces still count as neighbours, at
   * least zero.
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
  /** Positive integer count of variants the seed may choose between. */
  variants: number;
}
