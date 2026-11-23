import type { IAutoMovieRecoveryImageFeaturesExtractionOperation } from "../../index";

/**
 * Compare every admitted descriptor pair once and retain unique mutual matches.
 * The strict Euclidean ratio requires a distinct second feature in the other
 * image. Reverse exact ties refuse rather than choosing a material identity by
 * array order. This appearance test proposes correspondences, not their truth.
 */

export namespace IAutoMovieRecoveryImageFeaturesMatchingOperation {
  /**
   * Compare every admitted descriptor pair once and retain unique mutual
   * matches. The strict Euclidean ratio requires a distinct second feature in
   * the other image. Reverse exact ties refuse rather than choosing a material
   * identity by array order. This appearance test proposes correspondences, not
   * their truth.
   */

  export type Operation = (
    first: readonly ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>["points"][number][],
    second: readonly ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>["points"][number][],
    ratio: number,
    maxPairs: number,
  ) => {
    /**
     * Original feature ordinal in the first image's selected feature
     * population.
     */
    firstIndex: number;

    /**
     * Original feature ordinal in the second image's selected feature
     * population.
     */
    secondIndex: number;

    /** First-image observation [x,y] in pixels. */
    first: [number, number];

    /** Second-image observation [x,y] in pixels. */
    second: [number, number];

    /** Sum of squared descriptor-component differences; dimensionless. */
    squaredDescriptorDistance: number;

    /**
     * Best-to-second-best descriptor distance ratio used by the declared
     * matching gate.
     */
    descriptorDistanceRatio: number;
  }[];
}
