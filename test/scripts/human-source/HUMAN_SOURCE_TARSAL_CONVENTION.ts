import type { IHumanSourceTarsalConvention } from "./structures/IHumanSourceTarsalConvention.ts";

/**
 * Authored outline of the tarsal plates the cage registers as arc extents.
 *
 * Heights are conventional figures: the upper plate is stated as 8 to 12 mm
 * and the lower as 3 to 4 mm high (Ferreira et al. 2020, Cancers 12(3):658,
 * citing its own reference 1); the midpoints 10 mm and 3.5 mm are taken.
 *
 * The outline of the upper plate follows its measured transverse widths in
 * Korean cadavers (Hwang 2013, Anat Cell Biol 46(2):93): 21.8 mm at the lower
 * border, 16.2 mm at mid height and 8.3 mm at the upper border. Read as a
 * height over the distance from the lid centre, the plate is full height
 * within 4.15 mm, half height at 8.1 mm and ends at 10.9 mm, joined linearly.
 *
 * No width was read for the lower plate, so it takes the same outline scaled
 * to its own height. That, the linear joins and the choice of midpoints are
 * authoring conventions; none is a measurement of this source or of a person.
 */
export const HUMAN_SOURCE_TARSAL_CONVENTION: IHumanSourceTarsalConvention = {
  upperHeightMetres: 0.01,
  lowerHeightMetres: 0.0035,
  halfWidthsMetres: [0.00415, 0.0081, 0.0109],
  heightFractions: [1, 0.5, 0],
};
