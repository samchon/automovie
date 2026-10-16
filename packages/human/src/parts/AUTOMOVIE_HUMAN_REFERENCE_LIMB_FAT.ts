import { IAutoMovieHumanSubcutaneousFat } from "../structures/IAutoMovieHumanSubcutaneousFat";

/**
 * Regional subcutaneous fat over the limbs at which the limb relief tables describe the skin, millimetres: the mean of the 30-year-old European woman and man of average build as this package's converter resolves them (woman 6.7, 11.2, 3.4, 16.6, 14.9, 9.3; man 3.7, 6.6, 2.0, 9.8, 8.8, 5.4 for the fields in order). The tables' heights and widths were fitted to, or read from, average adult bodies, whose bellies show through about this much fat, so a relief's deep form is recovered by taking this layer's smoothing away, and laid under each person's own layer. Grade: derived from the converter's median adults.
 */
export const AUTOMOVIE_HUMAN_REFERENCE_LIMB_FAT: Pick<
  IAutoMovieHumanSubcutaneousFat,
  | "upperArmFront"
  | "upperArmBack"
  | "forearm"
  | "thighFront"
  | "thighBack"
  | "calf"
> = {
  upperArmFront: 5.2,
  upperArmBack: 8.9,
  forearm: 2.7,
  thighFront: 13.2,
  thighBack: 11.9,
  calf: 7.4,
};
