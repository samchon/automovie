import type { IAutoMovieFluidDomain } from "./IAutoMovieFluidDomain";
import type { IAutoMovieWaterFeature } from "./IAutoMovieWaterFeature";

/**
 * Lower one bound water feature to its state, surface and spray at a shot
 * second.
 */
export namespace IAutoMovieLowerWaterFeature {
  /**
   * Lower one bound water feature to its state, surface and spray at a shot
   * second.
   *
   * A static feature reads step zero and ignores time; flowing and simulated
   * use sampleFluidDomain's converted step for the shot second. The latter
   * modes use the same solve for unchanged domain/time, while static can
   * intentionally differ. The viewer records flowing as metadata; its stock
   * material does not consume that flag or flow vectors for animation.
   *
   * Throws for a feature/domain id mismatch and propagates child failures.
   * Non-finite time is refused only for nonstatic modes; non-finite camera
   * distance is refused for every mode. The caller must run domain/binding
   * admission, whose documented arithmetic and containment gaps remain;
   * lowering does not revalidate them.
   */
  export type IProps = {
    /** The binding being drawn; its `domain` must name `domain.id`. */
    feature: IAutoMovieWaterFeature;

    /** The fluid domain the feature binds. */
    domain: IAutoMovieFluidDomain;

    /** Shot second to sample; ignored by a `static` feature. */
    time: number;

    /**
     * Camera distance in metres driving spray LOD; defaults to zero.
     * sampleFluidSpray refuses non-finite distance and clamps negative distance
     * to the nearest LOD.
     */
    cameraDistance?: number;
  };
}
