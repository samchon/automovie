import {
  IAutoMovieFluidSpraySample,
  IAutoMovieFluidState,
  IAutoMovieFluidSurface,
} from "@automovie/interface";

/**
 * One bound-water-feature frame returned by lowerWaterFeature: solved state, drawable surface and decorative spray, all produced from one state in that call. This structural interface does not enforce matching steps on caller-constructed records; child numerical/admission limits still apply.
 *
 * @evidence contracts/common.md#principled-implementation lowerWaterFeature passes one solved state into both child producers, which copy its step. That producer establishes the shared instant; the interface alone cannot reject manually mismatched records or certify finite child outputs.
 * @evidence contracts/common.md#clear-and-simple-design Groups state, surface, spray and the owning feature id for one lowering result; it introduces no runtime wrapper or second solver state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record has no runtime substitutions or fixture-dependent fields; producer-derived members retain the approximations and numerical gaps of the solver, surface and spray.
 * @evidence contracts/common.md#meaningful-documentation Identifies the producer and member ownership, shared-state derivation and structural/numerical limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record with no runtime body; the derivation costs are answered on `lowerWaterFeature`'s callees.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The interface coordinates no runtime reuse; lowerWaterFeature shares its one state within a call and caches no frames.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declares no resource lifetime operation; a produced frame transfers fresh state/surface/spray arrays to its caller, bounded per admitted domain but not across caller-retained frames.
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
