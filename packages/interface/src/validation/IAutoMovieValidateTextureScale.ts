import type { IAutoMovieModel } from "../model/IAutoMovieModel";

/** Data and callback contracts shared by the ValidateTextureScale operations. */
export namespace IAutoMovieValidateTextureScale {
  /**
   * Measure mesh UV bounding spans, reject normalized spans over1+1e-9 and warn
   * when repeating surface-metre tile size exceeds the span.
   */
  export type IProps = {
    /**
     * Borrowed current models whose resident mesh UVs and named material
     * bindings supply scale meaning.
     */
    models: readonly IAutoMovieModel[];
  };
}
