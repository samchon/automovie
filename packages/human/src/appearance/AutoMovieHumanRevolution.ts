import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Surfaces of revolution about a local axis, placed into the model frame.
 *
 * Eye parts (sclera, cornea, iris) are rotationally symmetric about the
 * visual axis to the precision these renders resolve, so each is a profile
 * curve in the `(x, rho)` half-plane revolved about local +X. The profile
 * carries the shape; the angular segment count only sets tessellation.
 * Normals come from the profile tangent, so a profile with a sharp corner
 * is passed as separate strips rather than averaged across the corner.
 *
 * Local frame: x along the axis, y up, z = x cross y; angle theta runs from
 * +z toward +y, so `y = rho sin(theta)` and `z = rho cos(theta)`.
 */
export namespace AutoMovieHumanRevolution {
  /** One revolved strip. */
  export interface IStrip {
    /**
     * Profile points `[x, rho]` in millimetres, at least two, ordered so
     * that the rotated tangent `(d rho, -d x)` points to the visible side.
     */
    profile: Array<[number, number]>;

    /** Angular segments around the axis, at least three. */
    segments: number;
  }

  /** Rigid placement of the local frame in the model. */
  export interface IFrame {
    /** Origin of the local frame in model metres. */
    origin: [number, number, number];

    /** Unit local +X in the model frame. */
    axis: [number, number, number];

    /** Unit local +Y in the model frame, orthogonal to `axis`. */
    up: [number, number, number];
  }

  /**
   * Revolve strips into one indexed mesh in model metres.
   *
   * @param props.strips Profiles to revolve; each gets its own vertices
   * @param props.frame Placement of the local frame
   * @param props.uv Optional texture coordinate of a local point in mm; null emits no UVs
   * @param props.color Optional linear RGB multiplier of a local point in mm and its profile index; null emits no colours
   * @returns Mesh with positions in metres, unit normals and optional UV0/colours
   */
  export function mesh(props: {
    strips: IStrip[];
    frame: IFrame;
    uv: ((x: number, y: number, z: number) => [number, number]) | null;
    color:
      | ((x: number, y: number, z: number) => [number, number, number])
      | null;
  }): IAutoMovieMesh {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    // Model basis: local x, y and z = x cross y.
    const ex: [number, number, number] = props.frame.axis;
    const ey: [number, number, number] = props.frame.up;
    const ez: [number, number, number] = cross(ex, ey);
    const o: [number, number, number] = props.frame.origin;

    for (const strip of props.strips) {
      const base: number = positions.length / 3;
      const n: number = strip.profile.length;
      const ring: number = strip.segments + 1;

      for (let i: number = 0; i < n; ++i) {
        const [x, rho] = strip.profile[i]!;

        // Profile tangent by one-sided differences at the ends and central
        // differences inside; the profile normal is the tangent rotated
        // toward the visible side.
        const [x0, r0] = strip.profile[Math.max(0, i - 1)]!;
        const [x1, r1] = strip.profile[Math.min(n - 1, i + 1)]!;
        const tx: number = x1 - x0;
        const tr: number = r1 - r0;
        const length: number = Math.hypot(tx, tr) || 1;
        const nx: number = tr / length;
        const nr: number = -tx / length;

        // The seam column is duplicated (ring = segments + 1) so UVs and
        // colours need not wrap across one vertex.
        for (let k: number = 0; k < ring; ++k) {
          const theta: number = (2 * Math.PI * k) / strip.segments;
          const s: number = Math.sin(theta);
          const c: number = Math.cos(theta);
          const ly: number = rho * s;
          const lz: number = rho * c;
          const ny: number = nr * s;
          const nz: number = nr * c;

          // Millimetres to metres for the position only; normals are unit.
          for (let a: number = 0; a < 3; ++a) {
            positions.push(
              o[a]! + (x * ex[a]! + ly * ey[a]! + lz * ez[a]!) / 1000,
            );
            normals.push(nx * ex[a]! + ny * ey[a]! + nz * ez[a]!);
          }
          if (props.uv !== null) uvs.push(...props.uv(x, ly, lz));
          if (props.color !== null) colors.push(...props.color(x, ly, lz));
        }
      }

      // Quads between consecutive profile rings, wound counterclockwise as
      // seen from the profile normal's side: for a disc growing in rho at
      // constant x, (b - a) x (c - a) points along +x, as (d rho, -d x) does.
      for (let i: number = 0; i + 1 < n; ++i)
        for (let k: number = 0; k < strip.segments; ++k) {
          const a: number = base + i * ring + k;
          const b: number = a + 1;
          const c: number = a + ring;
          const d: number = c + 1;
          indices.push(a, b, c, b, d, c);
        }
    }

    return {
      positions,
      normals,
      uvs: props.uv === null ? null : uvs,
      ...(props.color === null ? {} : { colors }),
      indices,
      skin: null,
    };
  }
}

/**
 * Cross product.
 *
 * @param a Left vector
 * @param b Right vector
 * @returns `a x b`
 */
function cross(
  a: [number, number, number],
  b: [number, number, number],
): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
