import type { IAutoMovieHumanOralCavitySection } from "./IAutoMovieHumanOralCavitySection";
import type { IAutoMovieHumanTongueRest } from "./IAutoMovieHumanTongueRest";
import type { IAutoMovieHumanToothPlacement } from "./IAutoMovieHumanToothPlacement";

/**
 * One person's oral anatomy in the registered figure frame: +X forward, +Y up
 * and +Z left. Lengths and coordinates are millimetres; `cant` is the
 * dimensionless rise per backward millimetre. Contact samples use normalized
 * half-width shares, not angular phase.
 */
export interface IAutoMovieHumanOralAnatomy {
  /** Stomion's height. */
  stomion: number;

  /** Half width, midline to cheilion. */
  width: number;

  /** Upper vermilion height. */
  upper: number;

  /** Lower vermilion height. */
  lower: number;

  /** Subnasale's height. */
  subnasale: number;

  /** Menton's height. */
  menton: number;

  /** Contact line's height at shares 0, 1/16 .. 1 of the half width. */
  contact: number[];

  /** Half-height of the slit at the midline. */
  slit: number;

  /** Forward place of the lips at the stomion on the midline. */
  front: number;

  /** Teeth, upper then lower, left then right, from the midline back. */
  teeth: IAutoMovieHumanToothPlacement[];

  /** Upper incisal edge at the midline, `[x, y]`. */
  edge: [number, number];

  /** Rise of the occlusal plane per millimetre backward. */
  cant: number;

  /** The lining's front wall, round the outside of the front teeth and gums. */
  vestibule: IAutoMovieHumanOralCavitySection;

  /** The lining's section over the first molars. */
  molars: IAutoMovieHumanOralCavitySection;

  /** The lining's section at the oropharynx, round the tongue's base. */
  oropharynx: IAutoMovieHumanOralCavitySection;

  /**
   * The pharynx's back wall, where the lining closes behind the oropharynx,
   * `[x, y]`.
   */
  pharynx: [number, number];

  /**
   * Alveolar ridge behind the upper incisors, where a tip touches for /t/, `[x,
   * y]`.
   */
  ridge: [number, number];

  /** Palate's vault over the molars, `[x, y]`. */
  palate: [number, number];

  /** Tongue at rest. */
  tongue: IAutoMovieHumanTongueRest;
}
