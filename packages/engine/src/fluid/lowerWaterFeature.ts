import { IAutoMovieFluidDomain, IAutoMovieWaterFeature } from "@automovie/interface";
import { sampleFluidSpray } from "./sampleFluidSpray";
import { fluidSurfaceGeometry } from "./fluidSurfaceGeometry";
import { sampleFluidDomain } from "./sampleFluidDomain";
import { simulateFluidDomain } from "./simulateFluidDomain";
import { IAutoMovieWaterFeatureFrame } from "./IAutoMovieWaterFeatureFrame";

/**
 * Lower one bound water feature to everything a renderer needs at a shot
 * second.
 *
 * A `static` feature always reads its authored step-0 state, which is what
 * makes a mirror pool read identically in every frame of a cut; `flowing` and
 * `simulated` read the fixed-step solve at that second. The distinction between
 * those two is a surface-animation hint the renderer applies, never a different
 * solve — two features over the same domain must never disagree about where the
 * water is.
 *
 * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Lowers the authored water mode to state, surface, and bounded spray.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Produces the renderer-ready result of the feature's independent fluid domain.
 * @author Samchon
 */
export const lowerWaterFeature = (props: {
  feature: IAutoMovieWaterFeature;
  domain: IAutoMovieFluidDomain;
  time: number;
  /**
   * Camera distance in metres driving spray LOD; defaults to `0`. It must be a
   * real number: {@link sampleFluidSpray} refuses a non-finite one rather than
   * thinning the mist to nothing and reading as a fountain that stopped.
   */
  cameraDistance?: number;
}): IAutoMovieWaterFeatureFrame => {
  const state =
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
