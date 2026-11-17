import type { IAutoMovieModel } from "../model/IAutoMovieModel";

/**
 * Data and callback contracts shared by the ValidateTextureScale operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Measure mesh UV bounding spans, reject normalized spans over1+1e-9 and warn when repeating surface-metre tile size exceeds the span. Member documentation states the supplied records, units and absence meanings used by validateTextureScale.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The validator measures UV bounds and reports normalized-span errors or repeating-tile warnings; it does not infer texture scale from unavailable external mesh bytes.
 * @evidence contracts/development/design.md#principled-representation models provides resident mesh UVs and named bindings; normalized and surface-metre UV modes keep distinct scale meanings during validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateTextureScale, used by validateTextureScale. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieValidateTextureScale {
  /**
   * Measure mesh UV bounding spans, reject normalized spans over1+1e-9 and warn when repeating surface-metre tile size exceeds the span.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Measure mesh UV bounding spans, reject normalized spans over1+1e-9 and warn when repeating surface-metre tile size exceeds the span. Member documentation states the supplied records, units and absence meanings used by validateTextureScale.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The validator measures UV bounds and reports normalized-span errors or repeating-tile warnings; it does not infer texture scale from unavailable external mesh bytes.
   * @evidence contracts/development/design.md#principled-representation models provides resident mesh UVs and named bindings; normalized and surface-metre UV modes keep distinct scale meanings during validation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateTextureScale.IProps, used by validateTextureScale. Its models members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Borrowed current models whose resident mesh UVs and named material bindings supply scale meaning. */
    models: readonly IAutoMovieModel[];
  };
}
