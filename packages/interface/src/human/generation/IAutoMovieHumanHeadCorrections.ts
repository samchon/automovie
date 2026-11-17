/**
 * Corrections the secant passes put on the keys, each owned by the measure
 * it closes: millimetres, except the tip's lead, a factor.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Corrections the secant passes put on the keys, each owned by the measure it closes: millimetres, except the tip's lead, a factor.
 * @evidence contracts/development/design.md#principled-representation `nasion`: Nasion's height, for n-gn. `subnasale`: Subnasale's height, for n-sn. `lead`: Tip's lead, for sn-prn.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadLandmarks.layout. Also types AutoMovieHumanHeadLandmarks.NONE.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `nasion`, `subnasale`, `lead`, `zygion`, `gonion`, `menton`, `tape`, `ala`, `occiput`; callers supply the complete record.
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
