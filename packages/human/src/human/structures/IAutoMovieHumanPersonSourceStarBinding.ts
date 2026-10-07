import type { IAutoMovieHumanPersonSourceStarWeight } from "./IAutoMovieHumanPersonSourceStarWeight";

/**
 * How one sample reads the source normal field under one incident parent: the
 * weighted stars it requires, their identity, and the chart coordinates and
 * corner keys it interpolates them with.
 *
 * @evidence contracts/common.md#principled-implementation A sample's normal is fixed by its preimage stars and chart, so one binding serves the field and the transport identity.
 * @evidence contracts/common.md#clear-and-simple-design Four fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The identity is the exact weighted-key list, so two parents with different stars never compare equal.
 * @evidence contracts/common.md#meaningful-documentation States what each field holds.
 * @evidence contracts/modeling.md#shared-boundaries Equal identities on both partitions give a shared sample one normal.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The binding defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The binding carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The binding emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Chart coordinates are dimensionless.
 * @evidenceExclude contracts/modeling.md#rendered-observation The binding is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The binding carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The binding admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The binding converts no input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceStarBinding {
  /** The required stars, sorted by key. */
  weights: IAutoMovieHumanPersonSourceStarWeight[];

  /** The serialized weighted-key list, equal for equal stars. */
  identity: string;

  /** The sample's two chart coordinates in the parent. */
  coordinates: readonly [number, number];

  /** The star key of each of the parent's three chart corners. */
  keys: string[];
}
