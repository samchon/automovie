import { EquineHarness } from "../../animals/equine/EquineHarness";
import { AutoMovieArchetypeUnits } from "../../core/index";

/*
 * The measurements of cart grips, couplings and rider supports.
 */
export namespace createCartMeasures {
  /*
   * A wheelbarrow handgrip's length, metres: the 130 mm of the Matador M-130-L4
   * data sheet.
   */
  export const GRIP: number = 0.13;

  /*
   * A cart's single tree ahead of its axle, metres, a provisional value: not read
   * at a source. It sets how far the coupling stands ahead of the axle, so it is
   * read by a towing ride. The source to read is a carriage builder's draft of a
   * gig or a road cart (The Hub, the Carriage Journal's drafts).
   */
  export const SINGLE_TREE: number = 0.9;

  /*
   * The rest geometry of a cart's driving lines, metres: `elbow`, the height
   * above the seat of the point each line's held run is laid toward, the middle
   * of the women's and men's means of ANSUR II's elbow rest height (232.4 and
   * 245.0 mm), computed from the 1,986 women's and 4,082 men's public records
   * (https://www.openlab.psu.edu/ansur2/). It shapes the lines at rest only; a
   * driver's hands choose where along the held runs they hold.
   */
  export const REST: Readonly<{ elbow: number }> = {
    elbow: (0.2324 + 0.245) / 2,
  };

  /*
   * A single horse's driving lines' length from the bit, metres: IVC Carriage's
   * stock horse lines of 14 ft, "measure the distance from the horse's mouth to
   * your hands, and then add at least an extra two feet"
   * (https://cdn.shopify.com/s/files/1/0046/6819/4886/files/Reins.pdf).
   */
  export const LINES: number = 14 * AutoMovieArchetypeUnits.FOOT;

  /*
   * A single horse's driving line's width, metres: the 3/4 in leather reins IVC
   * Carriage finds most hands, and a larger horse, prefer
   * (https://cdn.shopify.com/s/files/1/0046/6819/4886/files/Reins.pdf).
   */
  export const LINE: number = (3 / 4) * AutoMovieArchetypeUnits.INCH;

  /*
   * A trace's radius, metres: in a single horse's harness a trace is the same
   * leather strap as the rest of the harness, so it takes the harness's strap
   * (`EquineHarness.ESTIMATES.strap`, a construction estimate no act reads, the
   * strap's width unread).
   */
  export const TRACE: number = EquineHarness.ESTIMATES.strap;

  /*
   * A rickshaw's seat above the ground, metres, a provisional value: not read at
   * a source. The source to read is a museum record or a period rule that gives
   * the seat's height (the Hong Kong rules of 1882 give its width and its
   * distance to the footboard only).
   */
  export const RICKSHAW_SEAT: number = 0.9;

  /*
   * A rickshaw's shafts apart at the runner's hands, centre to centre, metres, a
   * provisional value: not read at a source. The source to read is a museum
   * record with the shafts' spacing.
   */
  export const RICKSHAW_SHAFTS: number = 0.55;

  /*
   * A rickshaw seat's width, metres: 21 in, the Hong Kong public rickshaw rules
   * of 1882 (The China Mail, quoted at
   * https://industrialhistoryhk.org/hong-kong-rickshaw-design/).
   */
  export const RICKSHAW_SEAT_WIDTH: number = 21 * AutoMovieArchetypeUnits.INCH;

  /*
   * A rickshaw's footboard ahead of its seat, metres: 23 in from the seat to the
   * front of the footboard, the same rules, taken along the rickshaw.
   */
  export const RICKSHAW_FOOTBOARD: number = 23 * AutoMovieArchetypeUnits.INCH;
}
