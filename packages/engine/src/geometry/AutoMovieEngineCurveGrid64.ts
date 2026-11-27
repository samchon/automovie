import type { IAutoMovieCurveGrid64 } from "@automovie/interface";

import { tessellateAutoMovieCurveGrid64 } from "./curve/internal/tessellateAutoMovieCurveGrid64";

/** Deterministic interpolation and tessellation of corresponding curve courses. */
export namespace AutoMovieEngineCurveGrid64 {
  /** Tessellate one admitted curve grid. */
  export function tessellate(
    input: IAutoMovieCurveGrid64.Input,
  ): IAutoMovieCurveGrid64.Result {
    return tessellateAutoMovieCurveGrid64(input);
  }
}
