import type { AutoMovieArchetypeWindow } from "../AutoMovieArchetypeWindow";

import {
  type IAutoMovieArchetypeBand,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
} from "../../core/index";

import { ADA_RANGES } from "../constants/ADA_RANGES";

export namespace AutoMovieArchetypeWindowData {
  /*
   * Window sizes, for which no standard was read.
   */
  export const SIZE: string = "window opening size, not read at a source";

  /*
   * The sill band between the residential and the commercial fall-protection
   * triggers.
   */
  export const SILL: string =
    "sill below the 36 in (914 mm) at which IBC 2021 1015.8 requires fall protection (https://up.codes/s/window-openings) and above the 24 in of IRC R312.2.1, which was not read";

  /*
   * The bands every window shares.
   */
  export const SHARED: Readonly<Partial<Record<AutoMovieArchetypeWindow.Dimension, IAutoMovieArchetypeBand>>> =
    {
      width: AutoMovieArchetypeBand.metres(0.6, 1.2, SIZE, true),
      height: AutoMovieArchetypeBand.metres(0.9, 1.2, SIZE, true),
      sillHeight: AutoMovieArchetypeBand.metres(
        24 * AutoMovieArchetypeUnits.INCH,
        0.914,
        SILL,
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        40,
        90,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    };

  /*
   * The band of a handle that stands at a height of its own, on a stile.
   */
  export const HANDLE: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
    0.95,
    ADA_RANGES.reach.high,
    `${ADA_RANGES.reach.source}; the part of the range above the sill`,
  );
}
