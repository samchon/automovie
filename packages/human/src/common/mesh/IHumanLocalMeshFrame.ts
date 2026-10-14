import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One static mesh's publication frame, separate from its source metre frame.
 * The source remains owned by its geometry producer. Subtracting origin gives
 * the local mesh; the ordinary part translation restores its placement.
 *
 * @evidence contracts/common.md#principled-implementation Source mesh, publication origin and translated local mesh preserve metre placement by subtracting/restoring the origin; the geometry producer retains the source.
 * @evidence contracts/common.md#clear-and-simple-design The record separates frame publication from geometry generation and exposes source identity for prepared-frame admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Translation implies no welding/tolerance or expected source position substitution.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish original mesh, source-frame origin, translated positions and retained incidence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This frame shape performs no midpoint scan or Float32 validation; its producer owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source reference identifies the prepared owner but is not a content-version key; callers keep geometry unchanged until publication.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Frames retain borrowed source/unchanged attributes and translated positions under caller lifetime, with no acquired handle/task.
 *
 *
 * @author Samchon
 */
export interface IHumanLocalMeshFrame {
  /** Original geometry in the producer's metre frame. */
  source: IAutoMovieMesh;

  /** Source-frame position of the publication frame's origin. */
  origin: IAutoMovieVector3;

  /** Same vertices and incidence, translated into the publication frame. */
  mesh: IAutoMovieMesh;
}
