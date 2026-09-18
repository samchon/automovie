/**
 * The exact reason a logical volume's quantity is an approximation.
 *
 * Stated once and attached to the volume finding, so nobody has to find it in a
 * document to know that the number they are about to order concrete against is
 * a sum over cells rather than the volume of their union.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-quantities-waste Discloses that summed convex-cell volumes may double-count overlaps instead of presenting that take-off as an exact union.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Supplies the exact approximation reason attached to cell-sum volume findings while distinguishing exact shell measurement and faceted gaps.
 */
export const AUTOMOVIE_QUANTITY_CELL_UNION_APPROXIMATION =
  "a logical volume stated as convex cells is the union of them, and this is the sum of the cells: overlapping cells are counted once each. A volume stated as a closed boundary shell is measured exactly, and a space that declares itself faceted is reported as a gap of its own";
