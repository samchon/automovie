import type { IAutoMovieHumanBodyAnatomicalResolution } from "./IAutoMovieHumanBodyAnatomicalResolution";
import type { IAutoMovieHumanBodyGeneratedSkin } from "./IAutoMovieHumanBodyGeneratedSkin";
import type { IAutoMovieHumanBodyPartResolution } from "./IAutoMovieHumanBodyPartResolution";

/**
 * Resolution report for the connected exterior and individually named parts.
 *
 * A one-piece render skin cannot certify its bones, muscles and adipose.
 * Each internal component reports its own held-out surface validation or a
 * precise unavailable reason. This is generated output, never an authored
 * mesh cache in the body document.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyGeneratedAnatomy {
  /** Single connected body exterior with its own validation. */
  readonly skin: IAutoMovieHumanBodyAnatomicalResolution<
    "skin",
    IAutoMovieHumanBodyGeneratedSkin
  >;
  /** Independently resolved or refused bony and soft-tissue interiors. */
  readonly parts: readonly IAutoMovieHumanBodyPartResolution[];
}
