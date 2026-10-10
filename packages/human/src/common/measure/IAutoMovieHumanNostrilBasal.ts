/**
 * One registered nostril sample polygon read in a basal view
 * (`readHumanNostrilBasal`); its reader and source registration own the
 * distinction between this convention and a measured opening.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanNostrilBasal {
  /** Area enclosed by the angularly ordered projected samples, square metres. */
  area: number;

  /** Longest chord of the projected margin, metres. */
  longAxis: number;

  /** Extent of the projected margin perpendicular to the long axis, metres. */
  shortAxis: number;
}
