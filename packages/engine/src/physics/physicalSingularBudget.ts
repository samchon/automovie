import type { IAutoMovieSingularMatrixBudget } from "../math/IAutoMovieSingularMatrixBudget";

/**
 * Shared SVD work budget for physical target designs. A design has at most
 * 1024 residual rows and 64 coordinates, so 65536 entries bound it exactly;
 * 64 Jacobi sweeps and a 1e-10 pair-orthogonality limit are the factorization
 * policy every physical target solve already shares.
 */
export const physicalSingularBudget: IAutoMovieSingularMatrixBudget = {
  maxEntries: 65536,
  maxSweeps: 64,
  orthogonalityTolerance: 1e-10,
};
