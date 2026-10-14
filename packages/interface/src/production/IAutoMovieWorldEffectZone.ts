import { IAutoMovieWorldBounds } from "./IAutoMovieWorldBounds";

/**
 * Named deterministic effect region binding a world-meter volume to a declared recipe and seed.
 *
 * @evidence contracts/common.md#principled-implementation World admission checks recipe membership, nonempty bounded corners and nonnegative safe-integer seed. Materialization additionally uses the selected cue and shot or film owner, taking 52 bits from a domain-separated digest for the stream seed; equal zone seeds alone do not imply equal streams and truncation permits collisions. Bounds select initial positions rather than confining later drift.
 * @evidence contracts/common.md#clear-and-simple-design Spatial bounds and stream seed stay on the zone while recipe behavior and temporal cue intensity remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing recipes, inverted bounds and invalid seeds refuse; no region is inferred from a shot name or test-specific world arrangement.
 * @evidence contracts/common.md#meaningful-documentation Defines stable zone identity, existing recipe reference, world-meter volume and deterministic seed range.
 * @author Samchon
 */
export interface IAutoMovieWorldEffectZone {
  /** Stable zone id. */
  id: string;

  /** Existing deterministic effect recipe id. */
  recipe: string;

  /** World-space volume. */
  bounds: IAutoMovieWorldBounds;

  /** Explicit non-negative safe-integer deterministic zone seed. */
  seed: number;
}
