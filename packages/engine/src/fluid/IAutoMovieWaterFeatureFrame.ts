import {
  IAutoMovieFluidSpraySample,
  IAutoMovieFluidState,
  IAutoMovieFluidSurface,
} from "@automovie/interface";

/**
 * One frame of a bound water feature, as `lowerWaterFeature` returns it: the
 * solved state, its drawable surface, and its spray, all at one step.
 *
 * @evidence contracts/common.md#principled-implementation The surface and the spray are derived from the very `state` object carried here, so `surface.step`, `spray.step` and `state.step` always agree and a renderer cannot pair a surface with another instant's spray.
 * @evidence contracts/common.md#clear-and-simple-design Groups the three interface records a renderer needs per feature per frame plus the feature id, adding no field the interface records do not already define.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is precomputed or approximated for the renderer; every member is the engine's own derivation from the one state.
 * @evidence contracts/common.md#meaningful-documentation States the producer, that all members share one step, and what each member is derived from.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record with no runtime body; the derivation costs are answered on `lowerWaterFeature`'s callees.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fresh frame per call; nothing is cached.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns the state's lattice arrays, the surface buffers sized by the lattice, and at most the domain's spray particle cap.
 * @author Samchon
 */
export interface IAutoMovieWaterFeatureFrame {
  /** Id of the `IAutoMovieWaterFeature` the frame belongs to. */
  feature: string;

  /** The solved fluid state, step 0 for a `static` feature. */
  state: IAutoMovieFluidState;

  /** Free-surface geometry derived from `state`. */
  surface: IAutoMovieFluidSurface;

  /** Bounded decorative spray sampled from `state` at the requested camera distance. */
  spray: IAutoMovieFluidSpraySample;
}
