import { AutoMovieGravity } from "@automovie/engine";

import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeBow } from "../AutoMovieArchetypeBow";
import * as BowBandsData from "./internal/BowBandsData";

/*
 * The band of each free dimension of createBow a kind's model and draw
 * weight leave, by kind, with the sources they are read at: kept apart from the
 * producer so each file stays within its size. Read only as `createBow.BANDS`;
 * a recurve's brace is its model's (`createBow.BRACES`), and every band names
 * its source, one not read at its primary source provisional.
 */
export const BOW_BANDS: Readonly<
  Record<
    AutoMovieArchetypeBow.Kind,
    Readonly<Partial<Record<AutoMovieArchetypeBow.Dimension, IAutoMovieArchetypeBand>>>
  >
> = {
  longbow: {
    length: AutoMovieArchetypeBand.metres(
      1.67,
      66 * AutoMovieArchetypeUnits.INCH,
      BowBandsData.WARBOW,
    ),
    depth: AutoMovieArchetypeBand.metres(0.02979, 0.02979, BowBandsData.WARBOW),
    nockHeight: AutoMovieArchetypeBand.metres(
      0.5 * AutoMovieArchetypeUnits.INCH,
      0.5 * AutoMovieArchetypeUnits.INCH,
      BowBandsData.NOCK_BORROWED,
      true,
    ),
  },
  recurve: {
    depth: AutoMovieArchetypeBand.metres(0.03, 0.04, BowBandsData.POWER, true),
    draw: AutoMovieArchetypeBand.of(
      "N",
      49 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      54 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      BowBandsData.KSL,
      true,
    ),
    mass: AutoMovieArchetypeBand.of("kg", 1.133, 1.338, BowBandsData.RISERS, true),
    nockHeight: AutoMovieArchetypeBand.metres(
      0.5 * AutoMovieArchetypeUnits.INCH,
      0.5 * AutoMovieArchetypeUnits.INCH,
      BowBandsData.EASTON,
    ),
  },
  horseBow: {
    depth: AutoMovieArchetypeBand.metres(0.03, 0.04, BowBandsData.POWER, true),
    brace: AutoMovieArchetypeBand.metres(0.14, 0.15, BowBandsData.HORSE_BOW),
    nockHeight: AutoMovieArchetypeBand.metres(
      0.5 * AutoMovieArchetypeUnits.INCH,
      0.5 * AutoMovieArchetypeUnits.INCH,
      BowBandsData.NOCK_BORROWED,
      true,
    ),
  },
  crossbow: {
    length: AutoMovieArchetypeBand.metres(
      30 * AutoMovieArchetypeUnits.INCH,
      30 * AutoMovieArchetypeUnits.INCH,
      `${BowBandsData.PAYNE}: p. 101, the bow "Between extremes, 2 ft. 6 in."`,
    ),
    depth: AutoMovieArchetypeBand.metres(
      1.5 * AutoMovieArchetypeUnits.INCH,
      1.5 * AutoMovieArchetypeUnits.INCH,
      `${BowBandsData.PAYNE}: p. 93, the stock's "Thickness, 1½ in.", the fore-stock the bow hand takes`,
    ),
    brace: AutoMovieArchetypeBand.metres(
      5 * AutoMovieArchetypeUnits.INCH,
      5 * AutoMovieArchetypeUnits.INCH,
      `${BowBandsData.PAYNE}: p. 116, "the front of the string should be 5 in. from the inside upper edge of the centre of the bow"`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      10 * AutoMovieArchetypeUnits.POUND,
      12 * AutoMovieArchetypeUnits.POUND,
      `${BowBandsData.PAYNE}: p. 15, the sporting crossbow "from 10 lbs. to 12 lbs. if a cranequin"; Chapter XIX's crossbow, built here, is the sporting one, "of slightly larger size" in war`,
    ),
  },
};
