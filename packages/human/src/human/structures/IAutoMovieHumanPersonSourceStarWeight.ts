/**
 * One weighted source star a sample's normal reads: an original source vertex on one normal domain, keyed `<vertex>:<domain>`, and its preimage weight.
 *
 * @evidence contracts/common.md#principled-implementation An original vertex and normal domain form a composite star key, retaining distinct contact normals even when positions share one canonical sample.
 * @evidence contracts/common.md#clear-and-simple-design A key and affine weight are the minimal terms needed to compare and interpolate a normal star contribution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The key encodes source topology and domain rather than a person name or a measurement-specific exception.
 * @evidence contracts/common.md#meaningful-documentation Documentation defines the colon-separated vertex/domain key and identifies the weight as a source preimage coefficient.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One weighted-star record performs no arithmetic; the normal field builder selects interpolation and normalization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This coefficient has no lookup or shared execution; binding identity construction determines whether weighted stars are equivalent.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The string and number fields acquire no resources and have the lifetime of their owning binding array.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceStarWeight {
  /** The star key, `<original vertex>:<normal domain>`. */
  key: string;

  /** The sample's preimage weight on that vertex. */
  weight: number;
}
