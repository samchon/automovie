import type { IAutoMovieFluidDrain, IAutoMovieFluidSource } from "@automovie/interface";
import { flatBasin } from "./fluidFixtures";

/** The original six-by-six quarter-metre water depth at the fixed dyadic clock. */
export const createFountainLedgerDomain = (props: {
  sources?: IAutoMovieFluidSource[];
  drains?: IAutoMovieFluidDrain[];
}) =>
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

