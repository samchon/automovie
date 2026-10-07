/**
 * Options of `measureHumanBodyBasisChannels`.
 *
 * @evidence contracts/common.md#principled-implementation The editor and diagnostics share one measuring owner and differ only by this filter.
 * @evidence contracts/common.md#clear-and-simple-design One optional flag in a named record.
 * @evidenceExclude contracts/common.md#prohibited-implementation-shortcuts A filter flag; it substitutes nothing.
 * @evidence contracts/common.md#meaningful-documentation States the flag's effect.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It selects channels; it defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It carries no spatial value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It renders nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is not an authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyChannelScaleOptions {
  /** Report only channels with a measurement; omitted reports every channel. */
  measuredOnly?: boolean;
}
