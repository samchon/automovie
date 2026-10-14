/**
 * Page margin around a drawing's extent, in page millimetres.
 *
 * Fixed rather than authored: it is the border of the sheet, not a property of
 * the design, and making it a parameter would let two derivations of one
 * revision differ in a way nobody could see and every digest would notice.
 */
export const AUTOMOVIE_DRAWING_SVG_MARGIN = 10;
