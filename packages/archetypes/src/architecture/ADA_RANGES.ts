/**
 * One height range the 2010 ADA Standards set, metres above the floor, with the
 * clause that sets it.
 */
interface IRange {
  /** The least height. */
  low: number;

  /** The greatest height. */
  high: number;

  /** The clause, quoted with its address. */
  source: string;
}

/**
 * The height ranges of the 2010 ADA Standards that more than one archetype
 * reads, each in the standard's own metric figures:
 *
 * - `reach`: 309.3 and 308.2.1, operable parts within a forward reach range, 15
 *   in (380 mm) to 48 in (1220 mm) above the floor.
 * - `hardware`: 404.2.7, a door's operable hardware 34 in (865 mm) to 48 in (1220
 *   mm) above the floor, the range a cabinet's pulls share.
 *
 * Every switch, control, call button, handle and pull whose height a range
 * bounds reads it here, so the figures and their citation have one owner.
 */
export const ADA_RANGES: Readonly<Record<"reach" | "hardware", IRange>> = {
  reach: {
    low: 0.38,
    high: 1.22,
    source:
      "2010 ADA Standards 309.3 and 308.2.1, operable parts within a forward reach range 15 in (380 mm) minimum and 48 in (1220 mm) maximum above the floor (https://www.access-board.gov/ada/chapter/ch03/)",
  },
  hardware: {
    low: 0.865,
    high: 1.22,
    source:
      "2010 ADA Standards 404.2.7, door hardware 34 in (865 mm) minimum and 48 in (1220 mm) maximum above the floor (https://www.access-board.gov/ada/chapter/ch04/)",
  },
};
