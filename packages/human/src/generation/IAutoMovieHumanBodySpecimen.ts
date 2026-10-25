/**
 * The achieved public inputs of the calibration specimen that the shape law
 * compares a person's inputs with.
 *
 * A measurement law scales a calibrated girth or length by the ratio of the
 * person's input to the specimen's own input under the same definition, so
 * a definition offset common to both cancels; these are those specimen
 * inputs, copied from its typed parameters by the shape-basis fitter.
 */
export interface IAutoMovieHumanBodySpecimen {
  /** Body control values by control name, in each control's own unit (mm for lengths and girths). */
  controls: Record<string, number>;

  /** Head length (glabella to opisthocranion), mm. */
  headLength: number;

  /** Head breadth (euryon to euryon), mm: the length times the cephalic index over 100. */
  headBreadth: number;
}
