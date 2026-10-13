/**
 * The channels the identity parameters are projected back from: each is read
 * through the inverse of its first term row, after the other rows naming that
 * channel are removed.
 *
 * @evidence contracts/common.md#principled-implementation Channel names select the first term whose inverse reads identity after removing other terms that name that channel.
 * @evidence contracts/common.md#clear-and-simple-design The inverse binding table is independent of the numeric expansion rows.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bindings refer to existing legacy channels rather than inventing an anatomical measurement for identity.
 * @evidence contracts/common.md#meaningful-documentation The comment states the inverse order and names the simple parameter each binding recovers.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The identity projection bindings declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The identity projection bindings schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The identity projection bindings type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeIdentity {
  /** The channel `sex` is read from. */
  sex: string;

  /** The channel `ageYears` is read from. */
  ageYears: string;

  /** The channel `muscle` is read from. */
  muscle: string;
}
