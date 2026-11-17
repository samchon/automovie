import type { IAutoMovieRecoveryCameraPairInput } from "../../index";


/**
 * Build a supplied pinhole K and its analytic inverse in the resident pixel chart. Check pixel-step round trips before any correspondence is normalized. A large principal offset may destroy pixel differences even when each scalar is finite. Such a chart refuses rather than being recentered with unknown provenance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Build a supplied pinhole K and its analytic inverse in the resident pixel chart. Check pixel-step round trips before any correspondence is normalized. A large
 * @evidence contracts/development/design.md#principled-representation Build a supplied pinhole K and its analytic inverse in the resident pixel chart. Check pixel-step round trips before any correspondence is normalized. A large
 * @evidence contracts/development/design.md#minimal-and-owned-surface admitRecoveryCameraPair, admitRecoveryCameraScene, createRecoveryCameraChart share IAutoMovieRecoveryCameraChartCreationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryCameraChartCreationOperation {
/**
 * Build a supplied pinhole K and its analytic inverse in the resident pixel chart. Check pixel-step round trips before any correspondence is normalized. A large principal offset may destroy pixel differences even when each scalar is finite. Such a chart refuses rather than being recentered with unknown provenance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Build a supplied pinhole K and its analytic inverse in the resident pixel chart. Check pixel-step round trips before any correspondence is normalized. A large
 * @evidence contracts/development/design.md#principled-representation Build a supplied pinhole K and its analytic inverse in the resident pixel chart. Check pixel-step round trips before any correspondence is normalized. A large
 * @evidence contracts/development/design.md#minimal-and-owned-surface admitRecoveryCameraPair, admitRecoveryCameraScene, createRecoveryCameraChart share IAutoMovieRecoveryCameraChartCreationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export type Operation = (view: IAutoMovieRecoveryCameraPairInput["views"][number]) => {
 /** Row-major 3 by 3 supplied pinhole intrinsic matrix K in the resident pixel-centre chart. */
matrix: number[];
 /** Analytic inverse of the supplied pinhole K, mapping pixel homogeneous coordinates to camera rays. */
inverse: number[] };
}

