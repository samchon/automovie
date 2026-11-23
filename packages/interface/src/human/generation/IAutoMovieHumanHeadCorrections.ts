/**
 * Corrections the secant passes put on the keys, each owned by the measure
 * it closes: millimetres, except the tip's lead, a factor.
 */
export interface IAutoMovieHumanHeadCorrections {
  /** Nasion's height, for n-gn. */
  nasion: number;

  /** Subnasale's height, for n-sn. */
  subnasale: number;

  /** Tip's lead, for sn-prn. */
  lead: number;

  /** Face's half width at the zygion, for zy-zy. */
  zygion: number;

  /** Jaw arch's half width at the gonion, for go-go. */
  gonion: number;

  /** The jaw's border at the midline, for the menton's height, v-me. */
  menton: number;

  /** Tape the vault's exponent closes, for the head circumference. */
  tape: number;

  /** The nose's half width, for al-al. */
  ala: number;

  /** The vault's reach behind its centre, for g-op. */
  occiput: number;
}
