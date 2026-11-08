import type {
  AutoMovieSolidBlendChain,
  IAutoMovieSolidSurface,
} from "@automovie/engine";

/** World vector in the caller's declared length unit. */
type V3 = [number, number, number];

/** Actual source comparisons distinguish an unavailable chart from unequal geometry. */
export namespace ConstructionSurfaceComparison {
  /** Original normal/normal-curvature comparison at both rails, with no exterior source requests. */
  export function rails(
    blend: AutoMovieSolidBlendChain.IBlend,
    surface: IAutoMovieSolidSurface,
    host: IAutoMovieSolidSurface,
    part: IAutoMovieSolidSurface,
    angle: number,
    bend: number,
  ): string[] {
    const out: string[] = [];
    const count: number = blend.host.chart.length;
    for (let k: number = 0; k < count; k++) {
      const phase: number = (2 * Math.PI * k) / count;
      const across: [number, number] = blend.across[k]!;
      const partAcross: [number, number] = blend.partAcross[k]!;
      for (const [side, at, face, chart, d] of [
        ["host", 0, host, blend.host.chart[k]!, across],
        ["part", blend.length, part, blend.part.chart[k]!, partAcross],
      ] as [
        string,
        number,
        IAutoMovieSolidSurface,
        [number, number],
        [number, number],
      ][]) {
        if (
          face.domain !== undefined &&
          !(chart[0] >= face.domain[0] && chart[0] <= face.domain[1])
        ) {
          out.push(
            `${side} rail column ${k}: comparison chart ${chart[0]} is outside ${face.name}'s owned domain`,
          );
          continue;
        }
        const b: IAutoMovieSolidSurface.IJet = surface.jet(at, phase);
        const s: IAutoMovieSolidSurface.IJet = face.jet(chart[0], chart[1]);
        const nb: V3 = unit(cross(b.u, b.v));
        const ns: V3 = unit(cross(s.u, s.v));
        const cosine: number = Math.min(1, Math.abs(dot(nb, ns)));
        const turn: number = Math.acos(cosine);
        if (!(turn <= angle))
          out.push(`${side} rail column ${k}: normals ${turn} rad apart`);
        const first: V3 = add(scale(s.u, d[0]), scale(s.v, d[1]));
        const second: V3 = add(
          add(scale(s.uu, d[0] * d[0]), scale(s.uv, 2 * d[0] * d[1])),
          scale(s.vv, d[1] * d[1]),
        );
        const sign: number = dot(nb, ns) < 0 ? -1 : 1;
        const kb: number = (sign * dot(b.uu, nb)) / dot(b.u, b.u);
        const ks: number = dot(second, ns) / dot(first, first);
        if (!(Math.abs(kb - ks) <= bend))
          out.push(
            `${side} rail column ${k}: normal curvature ${kb} on the blend against ${ks} on the face`,
          );
      }
    }
    return out;
  }

  /** Evaluate every recorded owner chart on the other actual map; absent charts are comparison findings. */
  export function same(
    first: { positions: number[]; coordinates: number[]; owners: string[] },
    second: ReadonlyMap<string, IAutoMovieSolidSurface>,
    tol: number,
    unit: number,
  ): string[] {
    const out: string[] = [];
    for (let v: number = 0; v < first.positions.length / 3; v++) {
      const name: string = first.owners[first.coordinates[3 * v]!]!;
      const surface: IAutoMovieSolidSurface | undefined = second.get(name);
      if (surface === undefined) {
        out.push(
          `vertex ${v}: owner ${name} absent from the second realization`,
        );
        continue;
      }
      const u: number = first.coordinates[3 * v + 1]!;
      const t: number = first.coordinates[3 * v + 2]!;
      if (
        surface.domain !== undefined &&
        !(u >= surface.domain[0] && u <= surface.domain[1])
      ) {
        out.push(
          `vertex ${v} of ${name}: comparison chart ${u} is outside the second surface's owned domain`,
        );
        continue;
      }
      const read: IAutoMovieSolidSurface["point"] = surface.point;
      const p: V3 = scale(
        read === undefined ? surface.jet(u, t).p : read.call(surface, u, t),
        unit,
      );
      const miss: number = norm(
        sub(p, [
          first.positions[3 * v]!,
          first.positions[3 * v + 1]!,
          first.positions[3 * v + 2]!,
        ]),
      );
      if (!(miss <= tol))
        out.push(
          `vertex ${v} of ${name} is ${miss} m from the second realization's surface`,
        );
    }
    return out;
  }
}

/** Independent componentwise vector sum for the existing comparison formula. */
function add(a: V3, b: V3): V3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
/** Independent componentwise vector difference. */
function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
/** Scalar multiple, preserving the caller's length unit. */
function scale(a: V3, k: number): V3 {
  return [a[0] * k, a[1] * k, a[2] * k];
}
/** Euclidean inner product. */
function dot(a: V3, b: V3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
/** Oriented cross product. */
function cross(a: V3, b: V3): V3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
/** Euclidean norm. */
function norm(a: V3): number {
  return Math.hypot(a[0], a[1], a[2]);
}
/** The original normal comparison requires nondegenerate source derivatives. */
function unit(a: V3): V3 {
  return scale(a, 1 / norm(a));
}
