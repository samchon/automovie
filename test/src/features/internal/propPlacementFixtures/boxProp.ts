import type { IAutoMoviePropSpec } from "@automovie/interface";
import { createModel } from "../fixtures";

/** A box prop of the default 0.4 x 0.6 x 0.2 model, with no relations yet. */
export const boxProp = (node: string): IAutoMoviePropSpec => ({
  node,
  model: { ...createModel(null), id: node },
  articulation: null,
});
