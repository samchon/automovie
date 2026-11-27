import type { IAutoMovieCurveGrid64 } from "@automovie/interface";

import { tessellateCurveGrid64 } from "./curve/internal/tessellateCurveGrid64";

/** Deterministic interpolation and tessellation of corresponding curve courses. */
export namespace AutoMovieEngineCurveGrid64 {
  /** Tessellate one admitted curve grid. */
  export function tessellate(
    input: IAutoMovieCurveGrid64.Input,
  ): IAutoMovieCurveGrid64.Result {
    return tessellateCurveGrid64(input);
  }
}
