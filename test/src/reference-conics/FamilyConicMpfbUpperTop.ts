import {
  AutoMovieNaturalSpline as Spline,
  AutoMovieSolidVector as V,
} from "@automovie/engine";
import type {
  IAutoMovieNaturalCubicSpline,
  IAutoMovieSolidSurface,
  AutoMovieVector3Tuple as Point,
} from "@automovie/interface";

type Jet = IAutoMovieSolidSurface.IJet;

/** A horizontal chart on a top sheet that folds in a torso radial chart. */
export namespace FamilyConicMpfbUpperTop {
  /**
   * Interpolate the independent measured heights on a rectangular C2 tensor
   * grid. The supplied rail fixes the domain and supplies validation heights.
   * It contributes no training heights.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A vertical height map uses supplied world directions and two cardinal cubic axes. Held-out points retain physically observed references.
   * @evidence contracts/development/implementation.md#efficient-algorithms Prepare the X splines once. An X query prepares the Z value and derivative splines for that section.
   * @see https://occt3d.com/dev/doc/refman/html/class_geom_a_p_i___points_to_b_spline_surface.html
   */
  export function fit(
    rail: readonly { point: Point; normal?: Point }[],
    height: (x: number) => (z: number) => number | null,
    pitch: number,
  ) {
    if (rail.length < 4 || !(Number.isFinite(pitch) && pitch > 0))
      throw new Error(
        "The upper chart needs measured support and a finite pitch",
      );
    const axes = ([0, 2] as const).map((k): number[] => {
      const values: number[] = rail.map(({ point }): number => point[k]);
      const from: number = Math.min(...values) - pitch;
      const to: number = Math.max(...values) + pitch;
      const steps: number = Math.max(3, Math.ceil((to - from) / pitch));
      return Array.from(
        { length: steps + 1 },
        (_, i): number => from + ((to - from) * i) / steps,
      );
    });
    const [xs, zs] = axes as [number[], number[]];
    const samples: number[][] = xs.map((x): number[] => {
      const read = height(x);
      return zs.map((z): number => {
        const value: number | null = read(z);
        if (value === null || !Number.isFinite(value))
          throw new Error(
            `The upper chart has no observed vertical height at ${x},${z} mm`,
          );
        return value;
      });
    });
    const slice = grid(xs, zs, samples);
    const validation = rail.map(({ point, normal }) => {
      const jet: Jet = slice(point[0])(point[2]);
      const up: Point | null = V.unit(V.cross(jet.v, jet.u));
      if (up === null)
        throw new Error("The measured upper chart has a singular held-out jet");
      return {
        point,
        millimetres: Math.abs(jet.p[1] - point[1]),
        radians:
          normal === undefined
            ? undefined
            : Math.atan2(V.norm(V.cross(up, normal)), V.dot(up, normal)),
        normalUp: up[1],
      };
    });
    const [x0, x1, z0, z1] = [
      Math.min(...rail.map(({ point }): number => point[0])),
      Math.max(...rail.map(({ point }): number => point[0])),
      Math.min(...rail.map(({ point }): number => point[2])),
      Math.max(...rail.map(({ point }): number => point[2])),
    ];
    const interior = (x: number, z: number): boolean =>
      x >= xs[0]! && x <= xs.at(-1)! && z >= zs[0]! && z <= zs.at(-1)!;
    const lift = (base: Jet): Jet => {
      const [x, , z] = base.p;
      if (!interior(x, z)) return base;
      return pullback(
        base,
        slice(x)(z),
        support(x, x0, x1, pitch),
        support(z, z0, z1, pitch),
      );
    };
    return { xs, zs, slice, validation, interior, lift };
  }

  /**
   * Prepare a scalar tensor chart on an explicit complete observation tile.
   * Each query owns a fixed first-coordinate slice of the second spline axis.
   */
  export function grid(
    xs: readonly number[],
    zs: readonly number[],
    samples: readonly (readonly number[])[],
  ): (x: number) => (z: number) => Jet {
    if (
      xs.length < 2 ||
      zs.length < 2 ||
      samples.length !== xs.length ||
      samples.some(
        (row): boolean =>
          row.length !== zs.length || !row.every(Number.isFinite),
      )
    )
      throw new Error(
        "A measured scalar chart needs a complete finite observation grid",
      );
    const rows: IAutoMovieNaturalCubicSpline[] = zs.map(
      (_, j): IAutoMovieNaturalCubicSpline =>
        Spline.create(
          xs,
          samples.map((row): number => row[j]!),
        ),
    );
    return (x: number) => {
      if (!(x >= xs[0]! && x <= xs.at(-1)!))
        throw new Error(
          "The measured chart does not extrapolate past its first coordinate",
        );
      const along = rows.map((row): [number, number, number] =>
        Spline.read(row, x),
      );
      const [value, first, second] = ([0, 1, 2] as const).map(
        (k): IAutoMovieNaturalCubicSpline =>
          Spline.create(
            zs,
            along.map((jet): number => jet[k]),
          ),
      );
      return (z: number): Jet => {
        if (!(z >= zs[0]! && z <= zs.at(-1)!))
          throw new Error(
            "The measured chart does not extrapolate past its second coordinate",
          );
        const [y, dz, dzz] = Spline.read(value!, z);
        const [dx, dxz] = Spline.read(first!, z);
        return {
          p: [x, y, z],
          u: [1, dx, 0],
          v: [0, dz, 1],
          uu: [0, Spline.read(second!, z)[0], 0],
          uv: [0, dxz, 0],
          vv: [0, dzz, 0],
        };
      };
    };
  }
}

/** Compact quintic window in one anatomical chart direction. */
function support(
  x: number,
  low: number,
  high: number,
  width: number,
): [number, number, number] {
  if (x >= low && x <= high) return [1, 0, 0];
  const side: number = x < low ? 1 : -1;
  const from: number = side === 1 ? low - width : high + width;
  const t: number = (side * (x - from)) / width;
  if (t <= 0) return [0, 0, 0];
  const w: number = 1 - t;
  return [
    t ** 3 * (10 - 15 * t + 6 * t * t),
    (side * 30 * t * t * w * w) / width,
    (60 * t * w * (1 - 2 * t)) / (width * width),
  ];
}

/** Lift only the chart's height while preserving the base parameter map. */
function pullback(
  base: Jet,
  height: Jet,
  [x0, x1, x2]: [number, number, number],
  [z0, z1, z2]: [number, number, number],
): Jet {
  const delta: number = height.p[1] - base.p[1];
  const weight: number = x0 * z0;
  const gradient: Point = [x1 * z0, 0, x0 * z1];
  const change = (a: Point): number =>
    height.u[1] * a[0] + height.v[1] * a[2] - a[1];
  const hessian = (a: Point, b: Point): number =>
    height.uu[1] * a[0] * b[0] +
    height.uv[1] * (a[0] * b[2] + a[2] * b[0]) +
    height.vv[1] * a[2] * b[2];
  const windowHessian = (a: Point, b: Point): number =>
    x2 * z0 * a[0] * b[0] +
    x1 * z1 * (a[0] * b[2] + a[2] * b[0]) +
    x0 * z2 * a[2] * b[2];
  const add = (a: Point, height: number): Point => [a[0], a[1] + height, a[2]];
  const first = (a: Point): Point =>
    add(a, weight * change(a) + V.dot(gradient, a) * delta);
  const second = (a: Point, b: Point, ab: Point): Point =>
    add(
      ab,
      weight * (change(ab) + hessian(a, b)) +
        V.dot(gradient, a) * change(b) +
        V.dot(gradient, b) * change(a) +
        (V.dot(gradient, ab) + windowHessian(a, b)) * delta,
    );
  return {
    p: add(base.p, weight * delta),
    u: first(base.u),
    v: first(base.v),
    uu: second(base.u, base.u, base.uu),
    uv: second(base.u, base.v, base.uv),
    vv: second(base.v, base.v, base.vv),
  };
}
