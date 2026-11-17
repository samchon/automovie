import type { IAutoMovieRecoveryCameraChartCreationOperation, IAutoMovieRecoveryCameraMapEstimate, IAutoMovieRecoveryCameraMapInput, IAutoMovieRecoveryCameraTracksLinkageOperation, IAutoMovieRecoveryImageFeaturesExtractionOperation } from "../../index";


/**
 * Build one conditional three-camera map from automatic shared observations. Only qualified seed pairs create 3D points. Third-image observations cannot influence those points before resection, preventing circular registration. Joint fitting subsequently uses only seed observations and resection inliers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Build one conditional three-camera map from automatic shared observations. Only qualified seed pairs create 3D points. Third-image observations cannot
 * @evidence contracts/development/design.md#principled-representation Build one conditional three-camera map from automatic shared observations. Only qualified seed pairs create 3D points. Third-image observations cannot
 * @evidence contracts/development/design.md#minimal-and-owned-surface createRecoveryCameraMap share IAutoMovieRecoveryCameraMapCreationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryCameraMapCreationOperation {
/**
 * Build one conditional three-camera map from automatic shared observations. Only qualified seed pairs create 3D points. Third-image observations cannot influence those points before resection, preventing circular registration. Joint fitting subsequently uses only seed observations and resection inliers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Build one conditional three-camera map from automatic shared observations. Only qualified seed pairs create 3D points. Third-image observations cannot
 * @evidence contracts/development/design.md#principled-representation Build one conditional three-camera map from automatic shared observations. Only qualified seed pairs create 3D points. Third-image observations cannot
 * @evidence contracts/development/design.md#minimal-and-owned-surface createRecoveryCameraMap share IAutoMovieRecoveryCameraMapCreationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export type Operation = (input: IAutoMovieRecoveryCameraMapInput,
features: readonly ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[],
charts: readonly ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>[],
pairs: Parameters<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation>[1],
descriptorComparisons: number,
checkpoint: (phase: string, completed: number, total: number) => void) => IAutoMovieRecoveryCameraMapEstimate;
}

