/**
 * An actual external channel's binding to its body endpoint gain.
 *
 * @evidence contracts/common.md#principled-implementation Preserves the driver endpoint and its actual external channel's positive endpoint for equality admission.
 * @evidence contracts/common.md#clear-and-simple-design Three source identities describe one binding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No permission flag replaces the actual binding or contribution.
 * @evidence contracts/common.md#meaningful-documentation Names each source identity.
 * @evidence contracts/modeling.md#parameter-channels The external channel consumes the existing body endpoint gain.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Carries no coordinate.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The enclosing source supplies partition identity.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#rendered-observation Establishes no rendered acceptance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing source channels own bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Converts no personal input.
 */
export interface IAutoMovieHumanEndpointSourceDriver {
  /** Actual external channel identity. */
  channel: string;
  /** Body-owned endpoint whose gain it consumes. */
  endpoint: string;
  /** Positive endpoint declared by that actual external channel. */
  positive: string;
}
