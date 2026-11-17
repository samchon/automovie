/**
 * Original saved longitudinal interval and ordinary open-pair occurrence.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Original saved interval ordinal. Original saved open-pair ordinal within that interval.
 * @evidence contracts/development/design.md#principled-representation Original saved interval ordinal.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryAnalyticDomain share IAutoMovieRecoveryOpenPairAddress's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryOpenPairAddress {
 
 /** Original saved interval ordinal. */
  interval: number;

 
 /** Original saved open-pair ordinal within that interval. */
  pair: number;
}
