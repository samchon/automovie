import { AutoMovieHumanLoftMesh } from "./AutoMovieHumanLoftMesh";

/**
 * Thin tubes that draw construction curves as ordinary mesh geometry.
 *
 * The engine model has no line primitive, so construction (principal
 * sections, central axes) is emitted as tubes of a small physical radius
 * swept along the very points the generator evaluates from its curves. The
 * tube is a display of the curve, never an input to the skin.
 */
export namespace AutoMovieHumanLoftTube {
  /** Number of vertices around each tube cross-section. */
  const SIDES: number = 4;

  /**
   * Append a tube along a polyline.
   *
   * Each cross-section is a small polygon in the plane perpendicular to the
   * local tangent (central difference of the neighbours). The frame is
   * transported by projecting the previous normal onto the new plane, which
   * keeps adjacent cross-sections from twisting.
   *
   * @param context Mesh buffers to grow.
   * @param points Curve points `[x, y, z]` in mm, at least two.
   * @param closed Whether the last point connects back to the first.
   * @param radius Tube radius in mm.
   */
  export function sweep(
    context: AutoMovieHumanLoftMesh.IContext,
    points: readonly (readonly [number, number, number])[],
    closed: boolean,
    radius: number,
  ): void {
    const n: number = points.length;
    if (n < 2) return;

    // Unit tangent by central difference; open ends use one-sided differences.
    const tangent = (i: number): [number, number, number] => {
      const a: readonly [number, number, number] =
        points[closed ? (i - 1 + n) % n : Math.max(0, i - 1)]!;
      const b: readonly [number, number, number] =
        points[closed ? (i + 1) % n : Math.min(n - 1, i + 1)]!;
      return normalize([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
    };

    // Initial normal: any direction not parallel to the first tangent.
    const t0: [number, number, number] = tangent(0);
    let normal: [number, number, number] = normalize(
      cross(t0, Math.abs(t0[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]),
    );

    const rings: number[][] = [];
    for (let i: number = 0; i < n; i++) {
      const t: [number, number, number] = tangent(i);

      // Transport the normal: remove its tangential part and renormalize.
      const along: number = dot(normal, t);
      const projected: [number, number, number] = [
        normal[0] - along * t[0],
        normal[1] - along * t[1],
        normal[2] - along * t[2],
      ];
      if (Math.hypot(...projected) > 1e-9) normal = normalize(projected);
      const binormal: [number, number, number] = cross(t, normal);

      const p: readonly [number, number, number] = points[i]!;
      const ring: [number, number, number][] = [];
      for (let k: number = 0; k < SIDES; k++) {
        const angle: number = (2 * Math.PI * k) / SIDES;
        const c: number = radius * Math.cos(angle);
        const s: number = radius * Math.sin(angle);
        ring.push([
          p[0] + c * normal[0] + s * binormal[0],
          p[1] + c * normal[1] + s * binormal[1],
          p[2] + c * normal[2] + s * binormal[2],
        ]);
      }
      rings.push(AutoMovieHumanLoftMesh.vertices(context, ring));
    }

    // Connect consecutive cross-sections; a closed curve also joins last to first.
    const count: number = closed ? n : n - 1;
    for (let i: number = 0; i < count; i++)
      AutoMovieHumanLoftMesh.band(context, rings[i]!, rings[(i + 1) % n]!);
  }

  /** Cross product a x b. */
  function cross(
    a: readonly [number, number, number],
    b: readonly [number, number, number],
  ): [number, number, number] {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /** Dot product. */
  function dot(
    a: readonly [number, number, number],
    b: readonly [number, number, number],
  ): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Unit vector; a zero vector is returned unchanged. */
  function normalize(
    v: readonly [number, number, number],
  ): [number, number, number] {
    const length: number = Math.hypot(v[0], v[1], v[2]);
    return length > 0
      ? [v[0] / length, v[1] / length, v[2] / length]
      : [v[0], v[1], v[2]];
  }
}
