import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import type { IBodyCorrectivePublication } from "./IBodyCorrectivePublication";
import type { IBodyCorrectiveState } from "./IBodyCorrectiveState";

/** The corrective solver over one owned working basis. */
export interface IBodyCorrectiveSession {
  /** Solve one state, appending its ramps, rows and actual records. */
  solve(state: IBodyCorrectiveState): void;
  /** Correctives accepted so far and their stored rest-space rows. */
  published(): IBodyCorrectivePublication;
  /** Input plus every corrective accepted so far. */
  working(): IAutoMovieHumanBodyBasis;
}
