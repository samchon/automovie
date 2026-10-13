import { IAutoMovieWorldBounds } from "./IAutoMovieWorldBounds";

/**
 * Named deterministic effect region binding a world-meter volume to a declared recipe and seed.
 *
 * @evidence contracts/common.md#principled-implementation An existing recipe, admitted axis-aligned volume and safe-integer seed define a reproducible bounded effect stream; shot cues select this stable zone instead of constructing a new recipe per activation.
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
