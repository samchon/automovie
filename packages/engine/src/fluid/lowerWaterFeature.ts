import {
  IAutoMovieFluidState,
  type IAutoMovieLowerWaterFeature,
  type IAutoMovieWaterFeatureFrame,
} from "@automovie/interface";

import { fluidSurfaceGeometry } from "./fluidSurfaceGeometry";
import { sampleFluidDomain } from "./sampleFluidDomain";
import { sampleFluidSpray } from "./sampleFluidSpray";
import { simulateFluidDomain } from "./simulateFluidDomain";

/**
 * Lower one bound water feature to its state, surface and spray at a shot
 * second.
 *
 * A static feature reads step zero and ignores time; flowing and simulated use
 * sampleFluidDomain's converted step for the shot second. The latter modes use
 * the same solve for unchanged domain/time, while static can intentionally
 * differ. The viewer records flowing as metadata; its stock material does not
 * consume that flag or flow vectors for animation.
 *
 * Throws for a feature/domain id mismatch and propagates child failures.
 * Non-finite time is refused only for nonstatic modes; non-finite camera
 * distance is refused for every mode. The caller must run domain/binding
 * admission, whose documented arithmetic and containment gaps remain; lowering
 * does not revalidate them.
 */
export const lowerWaterFeature: (
  props: IAutoMovieLowerWaterFeature.IProps,
) => IAutoMovieWaterFeatureFrame = (
  props: IAutoMovieLowerWaterFeature.IProps,
): IAutoMovieWaterFeatureFrame => {
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
