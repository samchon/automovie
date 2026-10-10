/**
 * The tongue passage a face basis's oral contact evaluates.
 *
 * A tongue past the incisal plane must be thinner, over the slab of half-width
 * `slabMetres` about that plane, than both the interincisal and interlabial
 * apertures, because a constant-volume muscular hydrostat cannot be pressed
 * through closed teeth or sealed lips.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceContactPassage {
  /** ID of the tongue surface. */
  surface: string;

  /** Tongue protrusion channel. */
  channel: string;

  /** Slab half-width about the incisal plane, in metres. */
  slabMetres: number;
}
