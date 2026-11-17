import type { IAutoMovieRecoveryCameraChartCreationOperation, IAutoMovieRecoveryCameraPairEstimate, IAutoMovieRecoveryCameraPairInput, IAutoMovieRecoveryImageFeaturesExtractionOperation, IAutoMovieRecoveryImageFeaturesMatchingOperation } from "../../index";


/**
 * Qualify completed automatic observations and assemble owned camera evidence. Every independent final gate runs when its required observations exist. A completed observation artifact may refuse its camera; only a candidate passing all gates exposes a relative transform. No shape reconstruction is performed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Qualify completed automatic observations and assemble owned camera evidence. Every independent final gate runs when its required observations exist. A
 * @evidence contracts/development/design.md#principled-representation Qualify completed automatic observations and assemble owned camera evidence. Every independent final gate runs when its required observations exist. A
 * @evidence contracts/development/design.md#minimal-and-owned-surface createRecoveryCameraEstimate, createRecoveryCameraMap share IAutoMovieRecoveryCameraEstimateCreationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryCameraEstimateCreationOperation {
/**
 * Qualify completed automatic observations and assemble owned camera evidence. Every independent final gate runs when its required observations exist. A completed observation artifact may refuse its camera; only a candidate passing all gates exposes a relative transform. No shape reconstruction is performed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Qualify completed automatic observations and assemble owned camera evidence. Every independent final gate runs when its required observations exist. A
 * @evidence contracts/development/design.md#principled-representation Qualify completed automatic observations and assemble owned camera evidence. Every independent final gate runs when its required observations exist. A
 * @evidence contracts/development/design.md#minimal-and-owned-surface createRecoveryCameraEstimate, createRecoveryCameraMap share IAutoMovieRecoveryCameraEstimateCreationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export type Operation = (input: IAutoMovieRecoveryCameraPairInput,
features: readonly ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[],
matches: ReturnType<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation>,
charts: [
    ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
  ],
checkpoint: (phase: string, completed: number, total: number) => void) => IAutoMovieRecoveryCameraPairEstimate;
}

