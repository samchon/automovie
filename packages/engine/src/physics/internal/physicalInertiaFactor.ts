import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * Factor a symmetric positive-definite inertia tensor without choosing axes.
 *
 * The upper triangle is authoritative, as for LAPACK DPOSV with UPLO=U;
 * independently accumulated lower entries may differ by roundoff. Diagonal
 * equilibration writes A=D C D with C's diagonal equal to one, then C=L L^T.
 * Every exactly independent coordinate uses its direct scalar division,
 * preserving representable counterspin cancellation without a square-root round
 * trip. Values are copied once. Nonfinite entries, nonpositive diagonal values
 * or Cholesky pivots return null, leaving the caller's established admission
 * path. Solves and products use the tensor's frame and units, with fresh
 * outputs.
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
  if (xx <= 0 || yy <= 0 || zz <= 0) return null;

  /*
   * Direct multiplication shares the same authoritative symmetric entries.
   */
  const apply: (vector: IAutoMovieVector3) => IAutoMovieVector3 = (
    vector: IAutoMovieVector3,
  ): IAutoMovieVector3 => ({
    x: xx * vector.x + xy * vector.y + xz * vector.z,
    y: xy * vector.x + yy * vector.y + yz * vector.z,
    z: xz * vector.x + yz * vector.y + zz * vector.z,
  });
  if (xy === 0 && xz === 0 && yz === 0)
    return {
      solve: (vector: IAutoMovieVector3): IAutoMovieVector3 => ({
        x: vector.x / xx,
        y: vector.y / yy,
        z: vector.z / zz,
      }),
      apply,
    };

  // Divide separately rather than form sqrt(Aii*Ajj): the product can
  // overflow or underflow even for a well-conditioned representable tensor.
  const dx: number = Math.sqrt(xx);
  const dy: number = Math.sqrt(yy);
  const dz: number = Math.sqrt(zz);
  const lyx: number = xy / dx / dy;
  const lzx: number = xz / dx / dz;
  const cyz: number = yz / dy / dz;
  // A positive definite tensor keeps both pivots positive; a pivot at or
  // below zero has no square root and the factorization does not exist.
  const pivotY: number = 1 - lyx * lyx;
  if (pivotY <= 0) return null;
  const lyy: number = Math.sqrt(pivotY);
  const lzy: number = (cyz - lzx * lyx) / lyy;
  const pivotZ: number = 1 - lzx * lzx - lzy * lzy;
  if (pivotZ <= 0) return null;
  const lzz: number = Math.sqrt(pivotZ);

  const independentX: boolean = xy === 0 && xz === 0;
  const independentY: boolean = xy === 0 && yz === 0;
  const independentZ: boolean = xz === 0 && yz === 0;

  /*
   * Forward/back substitution lends no scratch or right-hand-side record.
   */
  const solve: (vector: IAutoMovieVector3) => IAutoMovieVector3 = (
    vector: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const vx: number = vector.x;
    const vy: number = vector.y;
    const vz: number = vector.z;
    const ax: number = vx / dx;
    const ay: number = (vy / dy - lyx * ax) / lyy;
    const az: number = (vz / dz - lzx * ax - lzy * ay) / lzz;
    const bz: number = az / lzz;
    const by: number = (ay - lzy * bz) / lyy;
    const bx: number = ax - lyx * by - lzx * bz;
    return {
      x: independentX ? vx / xx : bx / dx,
      y: independentY ? vy / yy : by / dy,
      z: independentZ ? vz / zz : bz / dz,
    };
  };
  return {
    solve,
    apply,
  };
}

/*
 * Operations over one copied symmetric physical tensor in a fixed frame.
 */
export namespace physicalInertiaFactor {
  /*
   * Fixed-frame tensor operations using the factory's copied upper triangle.
   * All outputs are fresh; the borrowed input vector is neither changed nor
   * retained.
   */
  export interface IPrepared {
    /*
     * Solve A*x=vector in the common frame, with output units divided by
     * inertia.
     */
    solve(vector: IAutoMovieVector3): IAutoMovieVector3;

    /*
     * Apply A*vector in the common frame, with output units multiplied by
     * inertia.
     */
    apply(vector: IAutoMovieVector3): IAutoMovieVector3;
  }
}
