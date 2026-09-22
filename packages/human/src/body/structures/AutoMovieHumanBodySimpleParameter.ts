/**
 * A simple body parameter, or one the expansion derives from them, as the
 * abscissa of a term curve in the simple-tier table.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Names the five physical parameters and the derived body fat figures a relation can be read over.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Enumerates the curve abscissae the expansion table admits, including the derived excess body fat.
 * @author Samchon
 */
export type AutoMovieHumanBodySimpleParameter =
  | "sex"
  | "ageYears"
  | "bodyMassIndex"
  | "muscle"
  /** Deurenberg's body fat percent less the sex's essential fat. */
  | "excessFatPercent";
