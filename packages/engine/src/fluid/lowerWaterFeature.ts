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
 * Lower one bound water feature to its state, surface and spray at a shot second.
 *
 * A static feature reads step zero and ignores time; flowing and simulated use sampleFluidDomain's converted step for the shot second. The latter modes use the same solve for unchanged domain/time, while static can intentionally differ. The viewer records flowing as metadata; its stock material does not consume that flag or flow vectors for animation.
 *
 * Throws for a feature/domain id mismatch and propagates child failures. Non-finite time is refused only for nonstatic modes; non-finite camera distance is refused for every mode. The caller must run domain/binding admission, whose documented arithmetic and containment gaps remain; lowering does not revalidate them.
 *
 * @evidence contracts/common.md#principled-implementation Derives surface and spray from one state: step zero for static or the converted shot-time solve otherwise. This preserves one step within this returned frame, assuming an admitted unchanged domain; child numerical gaps are not repaired by composition.
 * @evidence contracts/common.md#clear-and-simple-design Composes solver, surface and spray and owns only mode selection and feature/domain identity. The returned frame does not carry mode; consumers can pass the binding's mode to the viewer as optional metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A domain the feature does not bind is refused instead of drawn under the feature's name, and the camera distance default of zero is the documented nearest LOD, not a guess for a missing value.
 * @evidence contracts/common.md#meaningful-documentation States each mode's clock, static time bypass, actual viewer metadata use, identity/child refusals and caller admission limits; camera distance gives metres and default zero.
 * @evidence contracts/performance.md#efficient-algorithms For n steps, C cells, F faces, S sources, D drains and P returned particles, child replay, surface and spray cost O(C + F + n * (C + F + S + D) + emitters + P) time and O(C + F + P) storage under representable spray indices. Static still allocates a state and full surface; no cheap zero-step payload is assumed.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares one solved state between the surface and the spray of a frame instead of solving twice; nothing is reused across frames, so a renderer calling this per frame pays the stateless replay `simulateFluidDomain` documents.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned frame owns the state, the surface and the spray it carries.
 */
export const lowerWaterFeature: (props: {
  feature: IAutoMovieWaterFeature;
  domain: IAutoMovieFluidDomain;
  time: number;
  cameraDistance?: number;
}) => IAutoMovieWaterFeatureFrame = (props: {
  /** The binding being drawn; its `domain` must name `domain.id`. */
  feature: IAutoMovieWaterFeature;

  /** The fluid domain the feature binds. */
  domain: IAutoMovieFluidDomain;

  /** Shot second to sample; ignored by a `static` feature. */
  time: number;

  /**
   * Camera distance in metres driving spray LOD; defaults to zero. sampleFluidSpray refuses non-finite distance and clamps negative distance to the nearest LOD.
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
