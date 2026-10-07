import { IPortraitNeckShape } from "./structures/IPortraitNeckShape";

/**
 * Default neck sections in millimetres, centred behind the facial plane. The
 * posterior axis and separate anterior/posterior radii define the throat and
 * nape envelopes.
 *
 * The section sizes come from one population, not from any subject: the
 * `lower` section is scaled so that its perimeter, measured as two half ellipses, equals 363.7 mm,
 * the mean of the female (329.8 mm, n = 1986) and male (397.6 mm, n = 4082)
 * `neckcircumference` means of the ANSUR II public data release, computed from
 * its records. The other sections keep their earlier proportions to `lower`.
 * Equal sex weights suit a default that names no sex, as the default cranium
 * width (150.7 mm against the same release's 147.8 mm and 154.3 mm head
 * breadth means) already does. The earlier sections had a perimeter of 267 mm,
 * below the release's female fifth percentile (302 mm). The posterior wall of each section stays where the
 * earlier default put it, so the additional girth extends anteriorly. The
 * anterior and posterior split and the section heights remain authored
 * conventions, not measurements of a subject.
 */
export const portraitNeckShape: IPortraitNeckShape = {
  upper: { y: -107, width: 47.7, front: 44.9, back: 57.2, centre: -37.8 },
  lower: { y: -145, width: 58.5, front: 53.1, back: 61.3, centre: -36.7 },
  crop: { y: -150, width: 59.9, front: 53.1, back: 61.3, centre: -36.7 },
};
