import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";

/**
 * Canonical person document and borrowed face materials for shared skin colour.
 * The derivation reads the admitted face override and basis skin albedo, then
 * creates a body document without changing either input. The material owner
 * retains optical qualification; this carrier establishes no tissue measurement.
 *
 * @evidence contracts/common.md#principled-implementation Keeps the document override and basis material reference distinct so the derivation uses their existing colour precedence.
 * @evidence contracts/common.md#clear-and-simple-design One input record carries the two existing sources used by the shared-colour adapter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries actual face materials and person input without an inferred skin colour or subject default.
 * @evidence contracts/common.md#meaningful-documentation States borrowed material ownership and the derivation's nonmutating boundary.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This carrier defines no part or assembly.
 * @evidence contracts/modeling.md#parameter-channels Preserves the face document's named colour override; the derivation refuses a separately authored body colour.
 * @evidenceExclude contracts/modeling.md#emitted-geometry This carrier selects no primitive population.
 * @evidence contracts/modeling.md#spatial-conventions Face material and document colour channels retain their linear RGB encoding; this carrier converts none.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The person assembly owns the joined skin boundary; this carrier constructs no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled person owns seam observation; the carrier displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Material and document owners qualify optical values; this carrier establishes no new anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Colour admission belongs to the derivation and document owners; this carrier admits no range.
 * @evidence contracts/anatomy.md#parametric-authority Retains the canonical numerical person document and fixed basis materials without a new personal geometry input.
 * @author Samchon
 */
export interface IDeriveHumanPersonBodyProps {
  /** Person whose face supplies the single skin colour shared with its body. */
  document: IAutoMovieHumanPersonDocument;

  /** Borrowed face basis materials, providing skin albedo before overrides. */
  faceMaterials: readonly IAutoMovieMaterial[];
}
