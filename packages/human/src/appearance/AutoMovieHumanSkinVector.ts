/**
 * Three-component vector arithmetic in millimetres for the skin appearance
 * modules, on plain tuples so per-vertex loops allocate nothing larger.
 */
export namespace AutoMovieHumanSkinVector {
  /** A point or direction `[x, y, z]`. */
  export type Vec3 = [number, number, number];

  /**
   * Point of a flat buffer.
   *
   * @param buffer Flat `[x, y, z, ...]` buffer
   * @param index Vertex index
   * @returns The vertex's triple
   */
  export function at(buffer: readonly number[], index: number): Vec3 {
    return [buffer[3 * index]!, buffer[3 * index + 1]!, buffer[3 * index + 2]!];
  }

  /**
   * Sum.
   *
   * @param a First vector
   * @param b Second vector
   * @returns `a + b`
   */
  export function add(a: Vec3, b: Vec3): Vec3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /**
   * Difference.
   *
   * @param a First vector
   * @param b Second vector
   * @returns `a - b`
   */
  export function sub(a: Vec3, b: Vec3): Vec3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /**
   * Scalar multiple.
   *
   * @param a Vector
   * @param k Factor
   * @returns `k a`
   */
  export function scale(a: Vec3, k: number): Vec3 {
    return [a[0] * k, a[1] * k, a[2] * k];
  }

  /**
   * Dot product.
   *
   * @param a First vector
   * @param b Second vector
   * @returns `a . b`
   */
  export function dot(a: Vec3, b: Vec3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /**
   * Cross product.
   *
   * @param a First vector
   * @param b Second vector
   * @returns `a x b`
   */
  export function cross(a: Vec3, b: Vec3): Vec3 {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /**
   * Euclidean length.
   *
   * @param a Vector
   * @returns `|a|`
   */
  export function norm(a: Vec3): number {
    return Math.hypot(a[0], a[1], a[2]);
  }

  /**
   * Unit vector of the same direction.
   *
   * @param a Vector
   * @returns `a / |a|`, or `+Y` for the zero vector
   */
  export function normalize(a: Vec3): Vec3 {
    const n: number = norm(a);
    return n > 0 ? scale(a, 1 / n) : [0, 1, 0];
  }

  /**
   * Mean of the vertices of a flat buffer.
   *
   * @param buffer Flat `[x, y, z, ...]` buffer
   * @returns The centroid, or the origin for an empty buffer
   */
  export function centroid(buffer: readonly number[]): Vec3 {
    const c: Vec3 = [0, 0, 0];
    for (let i: number = 0; i < buffer.length; i += 3) {
      c[0] += buffer[i]!;
      c[1] += buffer[i + 1]!;
      c[2] += buffer[i + 2]!;
    }
    return scale(c, 1 / Math.max(1, buffer.length / 3));
  }

  /**
   * Hermite step of a value clamped to `[0, 1]`.
   *
   * @param t Input
   * @returns `3t^2 - 2t^3` of the clamped input
   */
  export function smooth(t: number): number {
    const c: number = Math.min(1, Math.max(0, t));
    return c * c * (3 - 2 * c);
  }
}
