import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Factor a symmetric positive-definite inertia tensor without choosing axes.
 *
 * The upper triangle is authoritative, as for LAPACK DPOSV with UPLO=U;
 * independently accumulated lower entries may differ by roundoff. Diagonal
 * equilibration writes A=D C D with C's diagonal equal to one, then C=L L^T.
 * Values are copied once. Nonfinite entries, nonpositive diagonal values or
 * Cholesky pivots return null, leaving the caller's established admission path.
 * Solves and products use the tensor's frame and units, with fresh outputs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines authoritative triangular storage, diagonal equilibration, SPD failure, units and independently owned solve/product outputs.
 * @evidence contracts/development/implementation.md#principled-implementation Uses diagonally equilibrated Cholesky and forward/back substitution for the same symmetric system as LAPACK DPOSV. Positive finite pivots admit the represented tensor; near-singular rounding may refuse preparation rather than regularize a physical tensor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Captures six tensor entries, factors their dimensionless correlation matrix once and exposes inverse application for airborne rates/seed columns plus direct application for momentum reconstruction.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No determinant cutoff, diagonal adjustment, inverse approximation, fixture branch or physical tolerance changes admission. The unused lower triangle is a documented storage convention, not a symmetry test.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed-size preparation and each right-hand-side solve take constant arithmetic and storage. The seed consumer solves directly for its three rotated basis columns without materializing an inverse, and ordinary rates allocate no matrix or eigenvectors.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each closure captures the actual six copied tensor coordinates and their factor, shared by physical rates and tangent columns. Changing the source rows cannot alter the owned preparation, and output mutation cannot affect later solves.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One factor owns fixed scalar tensor and Cholesky data without a query population, source rows or callbacks. The shape-history epoch releases it with its issued instants; returned vectors are independent.
 */
export function physicalInertiaFactor(
  tensor: readonly (readonly number[])[],
): physicalInertiaFactor.IPrepared | null {
  const xx: number = tensor[0]![0]!;
  const xy: number = tensor[0]![1]!;
  const xz: number = tensor[0]![2]!;
  const yy: number = tensor[1]![1]!;
  const yz: number = tensor[1]![2]!;
  const zz: number = tensor[2]![2]!;
  if (!(xx > 0 && yy > 0 && zz > 0) ||
      !Number.isFinite(xx) || !Number.isFinite(xy) || !Number.isFinite(xz) ||
      !Number.isFinite(yy) || !Number.isFinite(yz) || !Number.isFinite(zz))
    return null;

  // Divide separately rather than form sqrt(Aii*Ajj): the product can
  // overflow or underflow even for a well-conditioned representable tensor.
  const dx: number = Math.sqrt(xx);
  const dy: number = Math.sqrt(yy);
  const dz: number = Math.sqrt(zz);
  const lyx: number = (xy / dx) / dy;
  const lzx: number = (xz / dx) / dz;
  const cyz: number = (yz / dy) / dz;
  const lyy: number = Math.sqrt(1 - lyx * lyx);
  const lzy: number = (cyz - lzx * lyx) / lyy;
  const lzz: number = Math.sqrt((1 - lzx * lzx) - lzy * lzy);
  if (!(lyy > 0 && lzz > 0) || !Number.isFinite(lyx) ||
      !Number.isFinite(lzx) || !Number.isFinite(lyy) ||
      !Number.isFinite(lzy) || !Number.isFinite(lzz)) return null;

  /** Forward/back substitution lends no scratch or right-hand-side record. */
  const solve: (vector: IAutoMovieVector3) => IAutoMovieVector3 = (
    vector: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const ax: number = vector.x / dx;
    const ay: number = (vector.y / dy - lyx * ax) / lyy;
    const az: number = ((vector.z / dz - lzx * ax) - lzy * ay) / lzz;
    const bz: number = az / lzz;
    const by: number = (ay - lzy * bz) / lyy;
    const bx: number = (ax - lyx * by) - lzx * bz;
    return { x: bx / dx, y: by / dy, z: bz / dz };
  };
  return {
    solve,
    apply: (vector: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: xx * vector.x + xy * vector.y + xz * vector.z,
      y: xy * vector.x + yy * vector.y + yz * vector.z,
      z: xz * vector.x + yz * vector.y + zz * vector.z,
    }),
  };
}

/**
 * Operations over one copied symmetric physical tensor in a fixed frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation IPrepared states solve/product units, authoritative triangle and fresh vector ownership.
 * @evidence contracts/development/design.md#principled-representation Represents the standard SPD linear operator and its factor rather than principal axes; tensor-frame vectors retain their caller's units under multiplication or division by inertia.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Airborne rates and the takeoff integrand consume solve; dense momentum reconstruction consumes apply. The factor and copied coordinates remain private to the factory.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No caller-supplied trusted flag or mutable matrix storage is exposed. Numeric SPD admission remains with the factory and no body or action vocabulary enters the representation.
 */
export namespace physicalInertiaFactor {
  /**
   * Fixed-frame tensor operations using the factory's copied upper triangle.
   * All outputs are fresh; the borrowed input vector is neither changed nor retained.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish inverse and direct application with explicit units and ownership.
   * @evidence contracts/development/design.md#principled-representation A prepared SPD operator in the tensor frame; solve divides a vector's unit by kg m squared and apply multiplies it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Contains exactly the two numerical operations used by the airborne ODE, defect check and takeoff seed, with no public factor storage or mutation handle.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares IAutoMovieVector3 without wrapper units, fixture fields or independently optional preparation flags.
   */
  export interface IPrepared {
    /** Solve A*x=vector in the common frame, with output units divided by inertia. */
    solve(vector: IAutoMovieVector3): IAutoMovieVector3;

    /** Apply A*vector in the common frame, with output units multiplied by inertia. */
    apply(vector: IAutoMovieVector3): IAutoMovieVector3;
  }
}
