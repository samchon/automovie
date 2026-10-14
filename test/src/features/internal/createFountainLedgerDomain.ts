import type {
  IAutoMovieFluidDomain,
  IAutoMovieFluidDrain,
  IAutoMovieFluidSource,
} from "@automovie/interface";

import { flatBasin } from "./fluidFixtures";

/** Construct the original six-by-six basin with quarter-metre depth, half-metre cells and the flatBasin clock. Supplied source/drain arrays are borrowed; absent arrays are fresh empty lists. The four ledger entries own flow-window and sill expectations; this fixture does not integrate or admit the domain. */
export const createFountainLedgerDomain: (props: {
  sources?: IAutoMovieFluidSource[];
  drains?: IAutoMovieFluidDrain[];
}) => IAutoMovieFluidDomain = (props: {
  sources?: IAutoMovieFluidSource[];
  drains?: IAutoMovieFluidDrain[];
}): IAutoMovieFluidDomain =>
  flatBasin({
    columns: 6,
    rows: 6,
    depth: 0.25,
    overrides: {
      id: "fountain-basin",
      sources: props.sources ?? [],
      drains: props.drains ?? [],
    },
  });
