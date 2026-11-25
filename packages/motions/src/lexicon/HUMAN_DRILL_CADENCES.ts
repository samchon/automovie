import type { IAutoMovieMotionHumanDrillRegulation } from "@automovie/interface";

/**
 * The drill cadences and paces by regulation, steps a minute and metres.
 *
 * - `british1792`: ordinary time 75, quick time 108 and quickest (wheeling) time
 *   120 on a 30-inch (0.762 m) pace: Dundas's Rules and Regulations (1792) as
 *   reproduced by the Hamilton Papers' annotations (founders.archives.gov,
 *   Hamilton 01-24-02-0270 and -0384) and the Napoleonic infantry march rates
 *   compiled by Rod's Wargaming; provisional until the regulation's text is
 *   read.
 * - `french1791`: ordinary 76 and accelerated 100 on two French feet (0.65 m):
 *   the Règlement of 1 August 1791 as reported in the Vicomte de Noailles's
 *   letter to Hamilton (1800); provisional until its text is read.
 * - `us2021`: quick time 120 and double time 180 on 30 inches: US Army TC 3-21.5,
 *   Drill and Ceremonies, the march's own `HumanGait.MARCH` and
 *   `HumanGait.DOUBLE`.
 *
 * `HumanGait.march` reads a row by its `regulation` and its time by name; the
 * pace is every marcher's, as a regulation prescribes one step to all.
 */
export const HUMAN_DRILL_CADENCES: Readonly<
  Record<
    IAutoMovieMotionHumanDrillRegulation.Name,
    IAutoMovieMotionHumanDrillRegulation
  >
> = {
  british1792: {
    times: { ordinary: 75, quick: 108, quickest: 120 },
    pace: 0.762,
  },
  french1791: { times: { ordinary: 76, accelerated: 100 }, pace: 0.65 },
  us2021: { times: { quick: 120, double: 180 }, pace: 0.762 },
};
