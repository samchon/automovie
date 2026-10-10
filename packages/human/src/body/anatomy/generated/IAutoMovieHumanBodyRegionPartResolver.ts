import type { IAutoMovieHumanBodyPartResolution } from "./IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "./IAutoMovieHumanBodyRegionPartsInput";

/**
 * A region owner's answer for its own named parts.
 *
 * Each region returns only the parts it owns, each resolved with validation
 * or unavailable with its exact reason. `assembleHumanBodyGeneratedAnatomy`
 * refuses two regions answering one part.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodyRegionPartResolver = (
  input: IAutoMovieHumanBodyRegionPartsInput,
) => readonly IAutoMovieHumanBodyPartResolution[];
