/**
 * Default, authoring interval and ground of one lid tissue dimension, in
 * millimetres.
 *
 * `kind` separates what a read source measured from what was derived from
 * measured values and from what is authored where no source answers.
 * `ground` names the source with its quantity, site and population, or the
 * derivation, or says that the value is authored. The interval is an
 * authoring envelope for an editor; it is not a clinical normal range, and
 * the lid frame still refuses a value the constructed lid cannot hold.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularScalarDescriptor {
  /** Default value. */
  defaultMm: number;

  /** Lower end of the authoring envelope. */
  minimumMm: number;

  /** Upper end of the authoring envelope. */
  maximumMm: number;

  /** Whether the default was measured by a read source, derived from measured values, or authored. */
  kind: "measured" | "derived" | "authored";

  /** Source with quantity, site and population, or the derivation, or the statement that it is authored. */
  ground: string;
}
