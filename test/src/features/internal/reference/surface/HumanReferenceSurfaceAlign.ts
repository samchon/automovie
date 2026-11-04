/**
 * Rigid alignment of one point set onto another, used to remove where a body
 * segment sits before its shape is compared across people.
 */
export namespace HumanReferenceSurfaceAlign {
  /**
   * The least-squares rigid motion taking one point set onto another: the
   * rotation from the unit quaternion of Horn's closed form (J. Opt. Soc. Am.
   * A 4(4), 1987, 629-642), the dominant eigenvector of his symmetric 4x4
   * matrix, found here by Jacobi rotations; the translation joins the
   * centroids. Scale is not fitted, since the caller has scaled both sets to
   * one stature.
   *
   * @param list Indices of the points to align.
   * @param from Coordinate `a` of point `v` in the set to move.
   * @param to Coordinate `a` of point `v` in the set to reach.
   * @returns The row-major 3x3 rotation, and the translation applied after it.
   */
  export function rigid(
    list: number[],
    from: (v: number, a: number) => number,
    to: (v: number, a: number) => number,
  ): [number[], number[]] {
    // Refer both sets to their centroids.
    const cf: number[] = [0, 0, 0];
    const ct: number[] = [0, 0, 0];
    for (const v of list)
      for (let a: number = 0; a < 3; a++) {
        cf[a] += from(v, a) / list.length;
        ct[a] += to(v, a) / list.length;
      }

    // The cross-covariance of the centred sets, Horn's sums S_xx to S_zz.
    const S: number[] = new Array<number>(9).fill(0);
    for (const v of list)
      for (let a: number = 0; a < 3; a++)
        for (let b: number = 0; b < 3; b++) S[3 * a + b] += (from(v, a) - cf[a]!) * (to(v, b) - ct[b]!);

    const [xx, xy, xz, yx, yy, yz, zx, zy, zz]: [number, number, number, number, number, number, number, number, number] =
      S as [number, number, number, number, number, number, number, number, number];
    const N: number[][] = [
      [xx + yy + zz, yz - zy, zx - xz, xy - yx],
      [yz - zy, xx - yy - zz, xy + yx, zx + xz],
      [zx - xz, xy + yx, -xx + yy - zz, yz + zy],
      [xy - yx, zx + xz, yz + zy, -xx - yy + zz],
    ];
    const V: number[][] = [0, 1, 2, 3].map((i: number): number[] =>
      [0, 1, 2, 3].map((j: number): number => (i === j ? 1 : 0)),
    );

    // Jacobi sweeps diagonalise N; the columns of V become its eigenvectors.
    for (let sweep: number = 0; sweep < 50; sweep++) {
      let off: number = 0;
      for (let p: number = 0; p < 4; p++) for (let q: number = p + 1; q < 4; q++) off += N[p]![q]! ** 2;
      if (off < 1e-24 * (1 + N.reduce((s: number, row: number[], i: number): number => s + row[i]! ** 2, 0))) break;

      for (let p: number = 0; p < 4; p++)
        for (let q: number = p + 1; q < 4; q++) {
          if (N[p]![q] === 0) continue;

          const theta: number = (N[q]![q]! - N[p]![p]!) / (2 * N[p]![q]!);
          const t: number = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
          const c: number = 1 / Math.sqrt(t * t + 1);
          const s: number = t * c;
          for (let k: number = 0; k < 4; k++) {
            const a: number = N[k]![p]!;
            const b: number = N[k]![q]!;
            N[k]![p] = c * a - s * b;
            N[k]![q] = s * a + c * b;
          }
          for (let k: number = 0; k < 4; k++) {
            const a: number = N[p]![k]!;
            const b: number = N[q]![k]!;
            N[p]![k] = c * a - s * b;
            N[q]![k] = s * a + c * b;
          }
          for (let k: number = 0; k < 4; k++) {
            const a: number = V[k]![p]!;
            const b: number = V[k]![q]!;
            V[k]![p] = c * a - s * b;
            V[k]![q] = s * a + c * b;
          }
        }
    }

    // The unit quaternion of the most positive eigenvalue is the best rotation.
    let best: number = 0;
    for (let i: number = 1; i < 4; i++) if (N[i]![i]! > N[best]![best]!) best = i;

    const w: number = V[0]![best]!;
    const x: number = V[1]![best]!;
    const y: number = V[2]![best]!;
    const z: number = V[3]![best]!;
    const R: number[] = [
      w * w + x * x - y * y - z * z,
      2 * (x * y - w * z),
      2 * (x * z + w * y),
      2 * (x * y + w * z),
      w * w - x * x + y * y - z * z,
      2 * (y * z - w * x),
      2 * (x * z - w * y),
      2 * (y * z + w * x),
      w * w - x * x - y * y + z * z,
    ];
    const t: number[] = [0, 1, 2].map(
      (a: number): number => ct[a]! - (R[3 * a]! * cf[0]! + R[3 * a + 1]! * cf[1]! + R[3 * a + 2]! * cf[2]!),
    );

    return [R, t];
  }
}
