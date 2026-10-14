import type { IAutoMovieHumanBodyPartResolution } from "./IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "./IAutoMovieHumanBodyRegionPartsInput";

/**
 * A region owner's answer for its own named parts.
 *
 * Each region returns only the parts it owns, each resolved with validation or unavailable with its exact reason. `assembleHumanBodyGeneratedAnatomy` refuses two regions answering one part.
 *
 * @evidence contracts/common.md#principled-implementation A region callback reads admitted source/anatomy and returns only its owned independently qualified part resolutions.
 * @evidence contracts/common.md#clear-and-simple-design Region responsibility is a typed callback; the assembler owns duplicate ownership refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A region cannot use another region's placeholder to claim anatomical validity.
 * @evidence contracts/common.md#meaningful-documentation The comment defines owned outputs and the assembler's duplicate-answer refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The resolver signature supplies no algorithm for a region implementation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Callback typing coordinates no in-flight regional generation or memoized output.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A function type acquires no region workspace, basis loader or task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyRegionPartResolver = (
  input: IAutoMovieHumanBodyRegionPartsInput,
) => readonly IAutoMovieHumanBodyPartResolution[];
