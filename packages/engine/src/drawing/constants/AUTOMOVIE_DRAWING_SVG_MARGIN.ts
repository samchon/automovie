/**
 * Page margin around a drawing's extent, in page millimetres.
 *
 * Fixed rather than authored: it is the border of the sheet, not a property of
 * the design, and making it a parameter would let two derivations of one
 * revision differ in a way nobody could see and every digest would notice.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Gives every derived SVG a fixed ten-millimetre page border independent of author input or model extent.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Expands the scaled drawing bounds by `10` page millimetres on each side when computing the canonical SVG viewport.
 */
export const AUTOMOVIE_DRAWING_SVG_MARGIN = 10;
