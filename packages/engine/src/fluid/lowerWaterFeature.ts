import {
  IAutoMovieFluidDomain,
  IAutoMovieFluidState,
  IAutoMovieWaterFeature,
} from "@automovie/interface";

import { IAutoMovieWaterFeatureFrame } from "./IAutoMovieWaterFeatureFrame";
import { fluidSurfaceGeometry } from "./fluidSurfaceGeometry";
import { sampleFluidDomain } from "./sampleFluidDomain";
import { sampleFluidSpray } from "./sampleFluidSpray";
import { simulateFluidDomain } from "./simulateFluidDomain";

/**
 * Lower one bound water feature to everything a renderer needs at a shot
 * second.
 *
 * A `static` feature always reads its authored step-0 state, which is what
 * makes a mirror pool read identically in every frame of a cut; `flowing` and
 * `simulated` read the fixed-step solve at that second. The distinction
 * between those two is a surface-animation hint the renderer applies, never a
 * different solve, so two features over the same domain never disagree about
 * where the water is.
 *
 * Throws when `domain` is not the domain the feature binds, and whenever the
 * sampler, the surface or the spray throws: a non-finite second, a step past
 * the domain's budget, or a non-finite camera distance. The binding itself is
 * assumed to have passed `validateWaterFeatures`.
 *
 * @evidence contracts/common.md#principled-implementation Reads one state, step 0 for `static` and the snapped solve otherwise, and derives the surface and the spray from that same state object, so all three parts of a frame describe one instant of one domain.
 * @evidence contracts/common.md#clear-and-simple-design Composes the solver, the surface and the spray behind one call and owns only the mode choice and the binding check; the `flowing` hint stays with the renderer that animates it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A domain the feature does not bind is refused instead of drawn under the feature's name, and the camera distance default of zero is the documented nearest LOD, not a guess for a missing value.
 * @evidence contracts/common.md#meaningful-documentation States what each mode reads and why, that the hint never changes the solve, every refusal, and the validation premise; the camera distance property states its unit, default and refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Delegates every computation; the solve, surface and spray costs are answered on `simulateFluidDomain`, `fluidSurfaceGeometry` and `sampleFluidSpray`.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares one solved state between the surface and the spray of a frame instead of solving twice; nothing is reused across frames, so a renderer calling this per frame pays the stateless replay `simulateFluidDomain` documents.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned frame owns the state, the surface and the spray it carries.
 */
export const lowerWaterFeature = (props: {
  /** The binding being drawn; its `domain` must name `domain.id`. */
  feature: IAutoMovieWaterFeature;

  /** The fluid domain the feature binds. */
  domain: IAutoMovieFluidDomain;

  /** Shot second to sample; ignored by a `static` feature. */
  time: number;

  /**
   * Camera distance in metres driving spray LOD; defaults to `0`. It must be a
   * real number: `sampleFluidSpray` refuses a non-finite one rather than
   * thinning the mist to nothing and reading as a fountain that stopped.
   */
  cameraDistance?: number;
}): IAutoMovieWaterFeatureFrame => {
  if (props.feature.domain !== props.domain.id)
    throw new Error(
      `water feature "${props.feature.id}" binds fluid domain "${props.feature.domain}", not "${props.domain.id}"`,
    );
  const state: IAutoMovieFluidState =
    props.feature.mode === "static"
      ? simulateFluidDomain(props.domain, 0)
      : sampleFluidDomain(props.domain, props.time);
  return {
    feature: props.feature.id,
    state,
    surface: fluidSurfaceGeometry({ domain: props.domain, state }),
    spray: sampleFluidSpray({
      domain: props.domain,
      state,
      cameraDistance: props.cameraDistance ?? 0,
    }),
  };
};
