import type { AutoMovieArchetypeDoor } from "../../AutoMovieArchetypeDoor";

import {
  type IAutoMovieArchetypeBand,
  AutoMovieArchetypeBand,
} from "../../../core";

export namespace DoorBandsData {
  /*
   * The accessibility standard's door clauses.
   */
  export const ADA: string =
    "2010 ADA Standards (https://www.access-board.gov/ada/chapter/ch04/)";

  /*
   * The bands every door shares.
   */
  export const LEAF: Readonly<
    Partial<Record<AutoMovieArchetypeDoor.Dimension, IAutoMovieArchetypeBand>>
  > = {
    force: AutoMovieArchetypeBand.of(
      "N",
      11,
      22.2,
      `${ADA} 404.2.9, interior hinged and sliding doors open with at most 5 lbf (22.2 N); the lower end is half of it, an estimate`,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      25,
      45,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };

  /*
   * The bands of a hinged door's swing.
   */
  export const SWING: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.of(
    "degrees",
    90,
    90,
    `${ADA} 404.2.3 measures the clear width with the door open 90 degrees; no greater opening was found at a source`,
    true,
  );
}
