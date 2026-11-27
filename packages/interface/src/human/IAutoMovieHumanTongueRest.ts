/**
 * The tongue at rest. All values are millimetres in the registered figure
 * frame: forward positions use +X, heights use +Y, and width is a lateral
 * half-extent rather than a coordinate or angle.
 */
export interface IAutoMovieHumanTongueRest {
  /** Forward place of the tip, behind the lower incisors. */
  tip: number;

  /** Forward place of the back, inside the pharynx. */
  back: number;

  /** Height of the tip's upper face. */
  tipTop: number;

  /** Height of the dorsum's top, over the molars. */
  dorsum: number;

  /** Height of the floor it rests on. */
  floor: number;

  /** Half width over the molars, inside the lower arch. */
  width: number;

  /** Forward place of the molars, where the dorsum is highest. */
  molars: number;
}
