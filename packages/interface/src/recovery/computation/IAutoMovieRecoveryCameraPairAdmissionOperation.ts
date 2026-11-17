import type { IAutoMovieRecoveryCameraChartCreationOperation, IAutoMovieRecoveryCameraPairInput } from "../../index";


/**
 * Admit the complete closed resident pair before any image-sized allocation. Calibration, provenance and rigidity remain caller assertions. All numeric operating points and loop limits must be finite and explicit; representable supplied pixel charts are constructed once for the later numerical phases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The two admitted intrinsic camera charts in input-view order. Total admitted image pixel population, used for work and retention bounds.
 * @evidence contracts/development/design.md#principled-representation Total admitted image pixel population, used for work and retention bounds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface admitRecoveryCameraMap, admitRecoveryCameraPair, estimateAutoMovieRecoveryCameraPair share IAutoMovieRecoveryCameraPairAdmissionOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryCameraPairAdmissionOperation {
/**
 * Admit the complete closed resident pair before any image-sized allocation. Calibration, provenance and rigidity remain caller assertions. All numeric operating points and loop limits must be finite and explicit; representable supplied pixel charts are constructed once for the later numerical phases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The two admitted intrinsic camera charts in input-view order. Total admitted image pixel population, used for work and retention bounds.
 * @evidence contracts/development/design.md#principled-representation Total admitted image pixel population, used for work and retention bounds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface admitRecoveryCameraMap, admitRecoveryCameraPair, estimateAutoMovieRecoveryCameraPair share IAutoMovieRecoveryCameraPairAdmissionOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export type Operation = (input: IAutoMovieRecoveryCameraPairInput) => {
 
 /** The two admitted intrinsic camera charts in input-view order. */
charts: [
    ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
  ];
 
 /** Total admitted image pixel population, used for work and retention bounds. */
pixels: number;
};
}

