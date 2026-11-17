import type { IAutoMovieRecoveryCameraChartCreationOperation, IAutoMovieRecoveryCameraPairEstimate, IAutoMovieRecoveryCameraSceneInput, IAutoMovieRecoveryCameraTracksLinkageOperation, IAutoMovieRecoveryImageFeaturesExtractionOperation } from "../../index";


/**
 * Estimate the explicit seed using only globally admitted direct reciprocal links. This reconstructs pose support under the complete identity policy instead of deleting landmarks after a prior local-map fit has influenced its cameras.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Estimate the explicit seed using only globally admitted direct reciprocal links. This reconstructs pose support under the complete identity policy instead of
 * @evidence contracts/development/design.md#principled-representation Estimate the explicit seed using only globally admitted direct reciprocal links. This reconstructs pose support under the complete identity policy instead of
 * @evidence contracts/development/design.md#minimal-and-owned-surface createRecoveryCameraScene, initializeRecoverySceneSeed share IAutoMovieRecoverySceneSeedInitializationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoverySceneSeedInitializationOperation {
/**
 * Estimate the explicit seed using only globally admitted direct reciprocal links. This reconstructs pose support under the complete identity policy instead of deleting landmarks after a prior local-map fit has influenced its cameras.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Estimate the explicit seed using only globally admitted direct reciprocal links. This reconstructs pose support under the complete identity policy instead of
 * @evidence contracts/development/design.md#principled-representation Estimate the explicit seed using only globally admitted direct reciprocal links. This reconstructs pose support under the complete identity policy instead of
 * @evidence contracts/development/design.md#minimal-and-owned-surface createRecoveryCameraScene, initializeRecoverySceneSeed share IAutoMovieRecoverySceneSeedInitializationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export type Operation = (input: IAutoMovieRecoveryCameraSceneInput,
features: readonly ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[],
charts: readonly ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>[],
pairs: Parameters<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation>[1],
tracks: ReturnType<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation>["tracks"],
checkpoint: (phase: string, completed: number, total: number) => void) => IAutoMovieRecoveryCameraPairEstimate;
}

