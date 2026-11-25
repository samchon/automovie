import type { IAutoMovieRecoveryCameraMapBudget } from "@automovie/interface";
import type { triangulateRecoveryCameraPoint } from "@automovie/recovery";

/** A stereo chart with unequal focal scales, different centres and a quarter-turn. */
export namespace recoveryStereoChart {
  /** K1 maps (x, y) to (4x + 2, 8y - 1). */
  export const first: Parameters<typeof triangulateRecoveryCameraPoint>[2] = {
    matrix: [4, 0, 2, 0, 8, -1, 0, 0, 1],
    inverse: [1 / 4, 0, -1 / 2, 0, 1 / 8, 1 / 8, 0, 0, 1],
  };

  /** K2 maps (x, y) to (8x - 3, 16y + 1). */
  export const second: Parameters<typeof triangulateRecoveryCameraPoint>[3] = {
    matrix: [8, 0, -3, 0, 16, 1, 0, 0, 1],
    inverse: [1 / 8, 0, 3 / 8, 0, 1 / 16, -1 / 16, 0, 0, 1],
  };

  /** World to the reference camera. */
  export const identity: Parameters<typeof triangulateRecoveryCameraPoint>[4] = {
    rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    translation: [0, 0, 0],
  };

  /** Maps (x, y, z) to (1 - y, x, z). */
  export const pose: Parameters<typeof triangulateRecoveryCameraPoint>[4] = {
    rotation: [0, -1, 0, 1, 0, 0, 0, 0, 1],
    translation: [1, 0, 0],
  };

  /** Sixteen times K2⁻ᵀ [t]× R K1⁻¹, with integer entries. */
  export const fundamental: number[] = [0, 0, 0, 0, 0, -1, 4, 0, -7];

  /** Projection of (1, 2, 4) into the reference camera. */
  export const firstPixel: [number, number] = [3, 3];

  /** Projection of the same point into the second camera. */
  export const secondPixel: [number, number] = [-5, 5];

  /** A rank floor below both fixtures' nonzero directions. */
  export const minimumRatio: number = 1 / 256;

  /** Work limits for two four-column views and tiny map designs. */
  export const budget: IAutoMovieRecoveryCameraMapBudget = {
    maxPixels: 16,
    maxDescriptorPairs: 4,
    maxTracks: 2,
    maxObservations: 4,
    maxResectionTrials: 1,
    minimumResectionTrials: 1,
    maxLocalRefinements: 1,
    maxRefinementIterations: 1,
    maxLinearEntries: 64,
    maxSingularSweeps: 64,
  };

  /**
   * The dyadic DLT entries have resolved third directions. Allow the solver's
   * 1e-12 Jacobi stopping tolerance amplified by the inverse 1/256 rank floor,
   * then round up for projection and the homogeneous division at depth four.
   */
  export const projectionTolerance: number = 2e-9;
}
