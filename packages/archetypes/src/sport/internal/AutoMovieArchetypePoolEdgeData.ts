import type { AutoMovieArchetypePoolEdge } from "../AutoMovieArchetypePoolEdge";

import {
  type IAutoMovieArchetypeBand,
  AutoMovieArchetypeBand,
} from "../../core/index";

export namespace AutoMovieArchetypePoolEdgeData {
  /*
   * The facilities rules, read.
   */
  export const FR: string =
    "FINA Facilities Rules 2017-2021 (https://artisticswimming.ca/wp-content/uploads/2021/10/fina_facilities_2017-2021.pdf)";

  /*
   * The bands every segment shares.
   */
  export const WALL: Readonly<Partial<Record<AutoMovieArchetypePoolEdge.Dimension, IAutoMovieArchetypeBand>>> = {
    width: AutoMovieArchetypeBand.metres(
      2.5,
      2.5,
      `${FR} FR 2.5: lanes at least 2.5 m wide; the model takes the least`,
    ),
    freeboard: AutoMovieArchetypeBand.metres(
      0.3,
      0.3,
      `${FR} FR 2.4.3 and FR 2.15: the end wall to 0.3 m above the water for the touch panels`,
    ),
    poolDepth: AutoMovieArchetypeBand.metres(
      1.35,
      1.35,
      `${FR} FR 2.3: at least 1.35 m where starting platforms stand; the model takes the least`,
    ),
    ledgeDepth: AutoMovieArchetypeBand.metres(
      1.2,
      1.2,
      `${FR} FR 2.4.2: rest ledges not less than 1.2 m below the water; the model takes the least`,
    ),
    ledgeWidth: AutoMovieArchetypeBand.metres(
      0.1,
      0.15,
      `${FR} FR 2.4.2: rest ledges 0.1 to 0.15 m wide`,
    ),
  };
}
