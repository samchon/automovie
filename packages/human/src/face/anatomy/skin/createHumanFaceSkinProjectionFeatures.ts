import { HumanExactFraction as Fraction } from "../../../common/measure/HumanExactFraction";
import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";
import type { IHumanFaceProjectedSkinCourseInput } from "./IHumanFaceProjectedSkinCourseInput";
import type { IHumanFaceSkinProjectionFeature } from "./IHumanFaceSkinProjectionFeature";
import type { IHumanFaceSkinProjectionFeatures } from "./IHumanFaceSkinProjectionFeatures";

/**
 * Enumerate affine projections onto the actual vertices, finite edges and
 * triangle planes intersecting one guide's possible nearest-feature region.
 * The face projection is valid only where its three barycentrics are
 * nonnegative; edge projection only where its edge parameter lies in [0,1].
 * Their union with vertices is exactly the triangle's nearest-point domain.
 * A nearest-vertex upper bound prunes only triangle boxes farther than an
 * available point for the entire guide. It is not an anatomical ROI.
 *
 * Native coordinates, guide displacements, projection coefficients and
 * membership inequalities remain exact rational values. Edge dot products
 * and face Gram equations therefore describe one geometry, preserving the
 * fact that a valid face projection cannot be farther than its own edge.
 * Independently rounded affine projections do not preserve that inclusion
 * when their squared distances nearly coincide. Only parameter-domain
 * endpoints and final displayed points round to binary64. Degenerate native
 * geometry refuses; no tolerance weld or substitute triangle enters.
 *
 * @evidence contracts/common.md#principled-implementation Exact rational edge dot products and face Gram solves derive affine projections whose nonnegative barycentric or closed-segment inequalities bound validity; approximate boxes only prune against a nearest-vertex upper bound before exact competition.
 * @evidence contracts/common.md#clear-and-simple-design One normalized guide context and emit helper serve native vertices, unique edges and faces; the lower-envelope owner separately selects among those candidates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual native coordinate/edge identities are retained without tolerance welding or anatomical ROI; the broad phase uses a 16-epsilon relative roundoff margin, and degenerate edges/faces or empty support refuse.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies exact arithmetic, represented domain endpoints, positive normalization, broad-phase role and geometry-versus-anatomical precision.
 * @evidence contracts/performance.md#efficient-algorithms Per chord, scale and nearest-vertex bound scan V/indices, then T triangle boxes avoid exact construction for distant facets; vertex/edge sets emit each retained identity once. Retained feature rational arithmetic dominates with coordinate bit size and O(V+E+T) candidate/storage count.
 * @evidence contracts/performance.md#reuse-equivalent-work One exact origin/scale/direction serves every retained feature, and emitted vertex/edge sets prevent duplicate feature work; changed guide chords legitimately rebuild their different normalization and validity equations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local candidate/set arrays scale with native features and bigint precision and are discarded on refusal; the returned guide context/candidates live with its envelope caller, without a global cache or external resource.
 *
 * @author Samchon
 */
export function createHumanFaceSkinProjectionFeatures(
  input: IHumanFaceProjectedSkinCourseInput,
  segment: number,
): IHumanFaceSkinProjectionFeatures {
  const origin: readonly number[] = input.guide[segment],
    end: readonly number[] = input.guide[segment + 1];
  let scale: number = Math.hypot(...end.map((value: number, axis: number): number  => value - origin[axis]));
  for (let vertex: number = 0; vertex < input.positions.length / 3; vertex++)
    for (let axis: number = 0; axis < 3; axis++)
      scale = Math.max(
        scale,
        Math.abs(input.positions[3 * vertex + axis] - origin[axis]),
      );
  if (!(scale > 0) || !Number.isFinite(scale))
    throw new Error(
      "Skin projection needs a finite representable coordinate scale.",
    );
  const exactOrigin: IHumanExactFraction[] = origin.map((value: number): IHumanExactFraction  => Fraction.from(value)),
    exactScale: IHumanExactFraction = Fraction.from(scale);
  const direction: IHumanExactFraction[] = end.map((value: number, axis: number): IHumanExactFraction  =>
    Fraction.divide(
      Fraction.subtract(Fraction.from(value), exactOrigin[axis]),
      exactScale,
    ),
  );
  const point: (id: number) => IHumanExactFraction[] = (id: number): IHumanExactFraction[] =>
    [0, 1, 2].map((axis: number): IHumanExactFraction  =>
      Fraction.divide(
        Fraction.subtract(
          Fraction.from(input.positions[3 * id + axis]),
          exactOrigin[axis],
        ),
        exactScale,
      ),
    );
  // Broad-phase boxes use ordinary coordinates before any rational feature
  // construction. Retained features alone pay for exact projection; these
  // approximations never enter the lower-envelope distance comparison.
  const approximatePoint: (id: number) => number[] = (id: number): number[] =>
    [0, 1, 2].map(
      (axis: number): number  => (input.positions[3 * id + axis] - origin[axis]) / scale,
    );
  const dot: (a: readonly IHumanExactFraction[], b: readonly IHumanExactFraction[]) => IHumanExactFraction = (
    a: readonly IHumanExactFraction[],
    b: readonly IHumanExactFraction[],
  ): IHumanExactFraction =>
    a.reduce(
      (sum: IHumanExactFraction, value: IHumanExactFraction, axis: number): IHumanExactFraction  =>
        Fraction.add(sum, Fraction.multiply(value, b[axis])),
      Fraction.create(0n),
    );
  const zero: IHumanExactFraction[] = [0, 0, 0].map((): IHumanExactFraction  => Fraction.create(0n)),
    one: IHumanExactFraction = Fraction.create(1n);
  const roundedDirection: number[] = direction.map(Fraction.number);
  let bound: number = Infinity;
  for (const id of new Set(input.indices)) {
    const p: number[] = approximatePoint(id);
    bound = Math.min(
      bound,
      Math.max(
        Math.hypot(...p),
        Math.hypot(...p.map((value: number, axis: number): number  => value - roundedDirection[axis])),
      ),
    );
  }
  const features: IHumanFaceSkinProjectionFeature[] = [];
  const vertices: Set<number> = new Set<number>(),
    edges: Set<string> = new Set<string>();
  const emit: (native: readonly number[], start: IHumanExactFraction[], velocity: IHumanExactFraction[], inequalities: IHumanExactFraction[][]) => void = (
    native: readonly number[],
    start: IHumanExactFraction[],
    velocity: IHumanExactFraction[],
    inequalities: IHumanExactFraction[][],
  ): void => {
    let lower: IHumanExactFraction = Fraction.create(0n),
      upper: IHumanExactFraction = one;
    for (const [a, b] of inequalities) {
      if (b.numerator === 0n) {
        if (a.numerator < 0n) return;
      } else {
        const boundary: IHumanExactFraction = Fraction.divide(Fraction.negate(a), b);
        if (b.numerator > 0n && Fraction.compare(boundary, lower) > 0)
          lower = boundary;
        if (b.numerator < 0n && Fraction.compare(boundary, upper) < 0)
          upper = boundary;
      }
    }
    if (
      Fraction.compare(lower, upper) < 0 &&
      Fraction.number(lower) < Fraction.number(upper)
    )
      features.push({
        vertices: native,
        origin: start,
        velocity,
        lower: Fraction.number(lower),
        upper: Fraction.number(upper),
      });
  };
  for (let triangle: number = 0; triangle < input.indices.length / 3; triangle++) {
    const ids: number[] = input.indices.slice(3 * triangle, 3 * triangle + 3);
    const roundedPoints: number[][] = ids.map(approximatePoint);
    const gap: number[] = [0, 1, 2].map((axis: number): number  => {
      const low: number = Math.min(...roundedPoints.map((p: number[]): number  => p[axis]));
      const high: number = Math.max(...roundedPoints.map((p: number[]): number  => p[axis]));
      return Math.max(
        0,
        low - Math.max(0, roundedDirection[axis]),
        Math.min(0, roundedDirection[axis]) - high,
      );
    });
    // Rounding can only retain a box near the bound, never enlarge the ROI
    // by an anatomical distance. All retained features still compete exactly.
    if (Math.hypot(...gap) > bound * (1 + 16 * Number.EPSILON)) continue;
    const points: IHumanExactFraction[][] = ids.map(point);
    for (let at: number = 0; at < 3; at++) {
      if (!vertices.has(ids[at])) {
        vertices.add(ids[at]);
        emit([ids[at]], points[at], zero, []);
      }
      const next: number = (at + 1) % 3;
      const key: string =
        Math.min(ids[at], ids[next]) + ":" + Math.max(ids[at], ids[next]);
      if (edges.has(key)) continue;
      edges.add(key);
      const a: IHumanExactFraction[] = points[at],
        b: IHumanExactFraction[] = points[next];
      const vector: IHumanExactFraction[] = b.map((value: IHumanExactFraction, axis: number): IHumanExactFraction  => Fraction.subtract(value, a[axis]));
      const squaredLength: IHumanExactFraction = dot(vector, vector);
      if (!(squaredLength.numerator > 0n))
        throw new Error(
          "Skin projection native edge has no representable length.",
        );
      const s: IHumanExactFraction = Fraction.divide(Fraction.negate(dot(a, vector)), squaredLength),
        ds: IHumanExactFraction = Fraction.divide(dot(direction, vector), squaredLength);
      emit(
        [ids[at], ids[next]],
        a.map((value: IHumanExactFraction, axis: number): IHumanExactFraction  =>
          Fraction.add(value, Fraction.multiply(vector[axis], s)),
        ),
        vector.map((value: IHumanExactFraction): IHumanExactFraction  => Fraction.multiply(value, ds)),
        [
          [s, ds],
          [Fraction.subtract(one, s), Fraction.negate(ds)],
        ],
      );
    }
    const [a, b, c]: IHumanExactFraction[][] = points;
    const u: IHumanExactFraction[] = b.map((value: IHumanExactFraction, axis: number): IHumanExactFraction  => Fraction.subtract(value, a[axis])),
      v: IHumanExactFraction[] = c.map((value: IHumanExactFraction, axis: number): IHumanExactFraction  => Fraction.subtract(value, a[axis]));
    const uu: IHumanExactFraction = dot(u, u),
      uv: IHumanExactFraction = dot(u, v),
      vv: IHumanExactFraction = dot(v, v);
    const determinant: IHumanExactFraction = Fraction.subtract(
      Fraction.multiply(uu, vv),
      Fraction.multiply(uv, uv),
    );
    if (!(determinant.numerator > 0n))
      throw new Error(
        "Skin projection native triangle has no representable plane.",
      );
    const w: IHumanExactFraction[] = a.map((value: IHumanExactFraction): IHumanExactFraction  => Fraction.negate(value)),
      wu: IHumanExactFraction = dot(w, u),
      wv: IHumanExactFraction = dot(w, v),
      du: IHumanExactFraction = dot(direction, u),
      dv: IHumanExactFraction = dot(direction, v);
    const solve: (first: IHumanExactFraction, second: IHumanExactFraction, diagonal: IHumanExactFraction) => IHumanExactFraction = (
      first: IHumanExactFraction,
      second: IHumanExactFraction,
      diagonal: IHumanExactFraction,
    ): IHumanExactFraction =>
      Fraction.divide(
        Fraction.subtract(
          Fraction.multiply(first, diagonal),
          Fraction.multiply(second, uv),
        ),
        determinant,
      );
    const s: IHumanExactFraction = solve(wu, wv, vv),
      ds: IHumanExactFraction = solve(du, dv, vv),
      t: IHumanExactFraction = solve(wv, wu, uu),
      dt: IHumanExactFraction = solve(dv, du, uu);
    emit(
      ids,
      a.map((value: IHumanExactFraction, axis: number): IHumanExactFraction  =>
        Fraction.add(
          value,
          Fraction.add(
            Fraction.multiply(u[axis], s),
            Fraction.multiply(v[axis], t),
          ),
        ),
      ),
      u.map((value: IHumanExactFraction, axis: number): IHumanExactFraction  =>
        Fraction.add(
          Fraction.multiply(value, ds),
          Fraction.multiply(v[axis], dt),
        ),
      ),
      [
        [s, ds],
        [t, dt],
        [
          Fraction.subtract(Fraction.subtract(one, s), t),
          Fraction.negate(Fraction.add(ds, dt)),
        ],
      ],
    );
  }
  if (features.length === 0)
    throw new Error("Skin projection has no native feature support.");
  return { origin, scale, direction, features };
}
