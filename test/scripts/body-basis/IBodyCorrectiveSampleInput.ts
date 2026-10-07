import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBuild } from "@automovie/human/body/structures/IAutoMovieHumanBodyBuild";

import type { IBodyCorrectiveState } from "./IBodyCorrectiveState";
import type { IBodyCorrectiveWorld } from "./IBodyCorrectiveWorld";

/** One actual solver sample with its compiled same-shape authority. */
export interface IBodyCorrectiveSampleInput {
  world: IBodyCorrectiveWorld;
  state: IBodyCorrectiveState;
  /** Joint-path fraction, dimensionless. */
  t: number;
  /** Shape fraction, dimensionless. */
  u: number;
  basis: string;
  build: (
    document: IAutoMovieHumanBodyBasisDocument,
  ) => IAutoMovieHumanBodyBuild;
}
