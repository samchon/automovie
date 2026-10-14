import type { IAutoMovieHumanFaceUpperLashPopulation } from "../anatomy/lash/IAutoMovieHumanFaceUpperLashPopulation";

/**
 * The upper lash row's profile for each eye.
 *
 * Each side takes one explicit population: strand count and maximum centreline length,
 * launch elevation, curl, fan, root radius, taper and per-strand variation,
 * within that profile's authoring envelopes. Count is not card density or a
 * measured follicle count; zero emits no shafts on that side.
 * Angles use the attached population's live globe-to-root frame, whose axes
 * follow the registered skin row and current ocular owner. Length and radius
 * retain millimetres.
 *
 * @evidence contracts/common.md#principled-implementation Independent anatomical-eye upper profiles feed explicit shaft populations rooted on registered live anterior skin, with globe-to-root direction and row tangent supplying the current frame.
 * @evidence contracts/common.md#clear-and-simple-design Two canonical upper population records separate side shape/count from the parent upper/lower replacement selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The actual population owner admits a [0,1024] rendering count and retained profile even at zero; equal arc-length roots and conventional shape envelopes establish neither measured follicles nor clinical length/angle capacity.
 * @evidence contracts/common.md#meaningful-documentation Side identity, live frame, metric units and explicit zero emission distinguish authored upper shafts from source-card density.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The pair performs no root sampling or tube construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source root/frame reuse is consumer-owned, not memoization in these profiles.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller profile records acquire no shaft meshes or source images.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceUpperLashPair {
  /** Lash profile of the anatomical left eye. */
  left: IAutoMovieHumanFaceUpperLashPopulation;

  /** Lash profile of the anatomical right eye. */
  right: IAutoMovieHumanFaceUpperLashPopulation;
}
