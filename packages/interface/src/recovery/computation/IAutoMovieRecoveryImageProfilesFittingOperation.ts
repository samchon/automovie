import type { IAutoMovieEllipticLoft } from "../../index";


/**
 * Fit the aligned ellipse's four scalar fields with shared cubic algebra. Radius Bernstein controls must all remain positive; this sufficient whole-span condition rejects a candidate instead of clamping its fitted field.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Fit the aligned ellipse's four scalar fields with shared cubic algebra. Radius Bernstein controls must all remain positive; this sufficient whole-span
 * @evidence contracts/development/design.md#principled-representation Fit the aligned ellipse's four scalar fields with shared cubic algebra. Radius Bernstein controls must all remain positive; this sufficient whole-span
 * @evidence contracts/development/design.md#minimal-and-owned-surface fitAutoMovieRecoveryImageLoft, fitRecoveryImageProfiles share IAutoMovieRecoveryImageProfilesFittingOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryImageProfilesFittingOperation {
/**
 * Fit the aligned ellipse's four scalar fields with shared cubic algebra. Radius Bernstein controls must all remain positive; this sufficient whole-span condition rejects a candidate instead of clamping its fitted field.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Fit the aligned ellipse's four scalar fields with shared cubic algebra. Radius Bernstein controls must all remain positive; this sufficient whole-span
 * @evidence contracts/development/design.md#principled-representation Fit the aligned ellipse's four scalar fields with shared cubic algebra. Radius Bernstein controls must all remain positive; this sufficient whole-span
 * @evidence contracts/development/design.md#minimal-and-owned-surface fitAutoMovieRecoveryImageLoft, fitRecoveryImageProfiles share IAutoMovieRecoveryImageProfilesFittingOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export type Operation = (samples: readonly {
 /** Vertical observation station in the declared registered millimetre chart. */
yMm: number;
 /** Observed scalar profile values in the declared physical chart, aligned with the station. */
values: [number, number, number, number] }[],
spans: number,
minimumRankRatio: number) => {
 /** Fitted elliptic loft in the declared physical chart; numerical rank and source-fit qualifications remain separate. */
loft: IAutoMovieEllipticLoft;
 /** Dimensionless observed design singular ratio for the fitted scalar/profile system. */
rankRatio: number };
}

