import type { IHumanFaceProjectedSkinCourseInput } from "./IHumanFaceProjectedSkinCourseInput";
import type { IHumanFaceSkinProjectionFeature } from "./IHumanFaceSkinProjectionFeature";
import type { IHumanFaceSkinProjectionFeatures } from "./IHumanFaceSkinProjectionFeatures";
import { HumanExactFraction as Fraction } from "../../../common/measure/HumanExactFraction";
import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";

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
 * @evidence contracts/common.md#principled-implementation Nearest point on a closed triangle lies on its plane interior, an edge or a vertex. Linear guide projection is affine on each feature, with linear domain inequalities.
 * @evidence contracts/common.md#clear-and-simple-design Owns native feature construction and conservative geometric pruning; envelope comparison stays with its separate owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Pruning follows an available native point and actual boxes, not region labels, width or a fixed reach.
 * @evidence contracts/common.md#meaningful-documentation States nearest-domain completeness, numerical normalization and geometry refusal.
 * @evidence contracts/modeling.md#spatial-conventions A named origin and scale transport the same head-frame metres without changing geometry.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Processes an existing skin course and creates no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes internal geometry without adding an anatomical authoring control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive or source vertex.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The final course owner checks native feature continuity; this helper does not certify a tissue join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The calling relief owners observe the resulting skin.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Performs geometry arithmetic and introduces no physiological quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input ranges remain with the relief callers.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No personal curve or vertex authoring is exposed.
 * @author Samchon
 */
export function createHumanFaceSkinProjectionFeatures(
  input: IHumanFaceProjectedSkinCourseInput,
  segment: number,
): IHumanFaceSkinProjectionFeatures {
  const origin = input.guide[segment],
    end = input.guide[segment + 1];
  let scale = Math.hypot(...end.map((value, axis) => value - origin[axis]));
  for (let vertex = 0; vertex < input.positions.length / 3; vertex++)
    for (let axis = 0; axis < 3; axis++)
      scale = Math.max(
        scale,
        Math.abs(input.positions[3 * vertex + axis] - origin[axis]),
      );
  if (!(scale > 0) || !Number.isFinite(scale))
    throw new Error(
      "Skin projection needs a finite representable coordinate scale.",
    );
  const exactOrigin = origin.map((value) => Fraction.from(value)),
    exactScale = Fraction.from(scale);
  const direction = end.map((value, axis) => Fraction.divide(
    Fraction.subtract(Fraction.from(value), exactOrigin[axis]), exactScale,
  ));
  const point = (id: number): IHumanExactFraction[] => [0, 1, 2].map(
    (axis) => Fraction.divide(Fraction.subtract(
      Fraction.from(input.positions[3 * id + axis]), exactOrigin[axis],
    ), exactScale),
  );
  // Broad-phase boxes use ordinary coordinates before any rational feature
  // construction. Retained features alone pay for exact projection; these
  // approximations never enter the lower-envelope distance comparison.
  const approximatePoint = (id: number): number[] => [0, 1, 2].map(
    (axis) => (input.positions[3 * id + axis] - origin[axis]) / scale,
  );
  const dot = (a: readonly IHumanExactFraction[], b: readonly IHumanExactFraction[]): IHumanExactFraction =>
    a.reduce((sum, value, axis) => Fraction.add(sum, Fraction.multiply(value, b[axis])), Fraction.create(0n));
  const zero = [0, 0, 0].map(() => Fraction.create(0n)),
    one = Fraction.create(1n);
  const roundedDirection = direction.map(Fraction.number);
  let bound = Infinity;
  for (const id of new Set(input.indices)) {
    const p = approximatePoint(id);
    bound = Math.min(
      bound,
      Math.max(
        Math.hypot(...p),
        Math.hypot(...p.map((value, axis) => value - roundedDirection[axis])),
      ),
    );
  }
  const features: IHumanFaceSkinProjectionFeature[] = [];
  const vertices = new Set<number>(),
    edges = new Set<string>();
  const emit = (
    native: readonly number[],
    start: IHumanExactFraction[],
    velocity: IHumanExactFraction[],
    inequalities: IHumanExactFraction[][],
  ): void => {
    let lower = Fraction.create(0n), upper = one;
    for (const [a, b] of inequalities) {
      if (b.numerator === 0n) {
        if (a.numerator < 0n) return;
      } else {
        const boundary = Fraction.divide(Fraction.negate(a), b);
        if (b.numerator > 0n && Fraction.compare(boundary, lower) > 0) lower = boundary;
        if (b.numerator < 0n && Fraction.compare(boundary, upper) < 0) upper = boundary;
      }
    }
    if (Fraction.compare(lower, upper) < 0 && Fraction.number(lower) < Fraction.number(upper))
      features.push({
        vertices: native,
        origin: start,
        velocity,
        lower: Fraction.number(lower),
        upper: Fraction.number(upper),
      });
  };
  for (let triangle = 0; triangle < input.indices.length / 3; triangle++) {
    const ids = input.indices.slice(3 * triangle, 3 * triangle + 3);
    const roundedPoints = ids.map(approximatePoint);
    const gap = [0, 1, 2].map((axis) => {
      const low = Math.min(...roundedPoints.map((p) => p[axis]));
      const high = Math.max(...roundedPoints.map((p) => p[axis]));
      return Math.max(
        0,
        low - Math.max(0, roundedDirection[axis]),
        Math.min(0, roundedDirection[axis]) - high,
      );
    });
    // Rounding can only retain a box near the bound, never enlarge the ROI
    // by an anatomical distance. All retained features still compete exactly.
    if (Math.hypot(...gap) > bound * (1 + 16 * Number.EPSILON)) continue;
    const points = ids.map(point);
    for (let at = 0; at < 3; at++) {
      if (!vertices.has(ids[at])) {
        vertices.add(ids[at]);
        emit([ids[at]], points[at], zero, []);
      }
      const next = (at + 1) % 3;
      const key =
        Math.min(ids[at], ids[next]) + ":" + Math.max(ids[at], ids[next]);
      if (edges.has(key)) continue;
      edges.add(key);
      const a = points[at],
        b = points[next];
      const vector = b.map((value, axis) => Fraction.subtract(value, a[axis]));
      const squaredLength = dot(vector, vector);
      if (!(squaredLength.numerator > 0n))
        throw new Error(
          "Skin projection native edge has no representable length.",
        );
      const s = Fraction.divide(Fraction.negate(dot(a, vector)), squaredLength),
        ds = Fraction.divide(dot(direction, vector), squaredLength);
      emit(
        [ids[at], ids[next]],
        a.map((value, axis) => Fraction.add(value, Fraction.multiply(vector[axis], s))),
        vector.map((value) => Fraction.multiply(value, ds)),
        [
          [s, ds],
          [Fraction.subtract(one, s), Fraction.negate(ds)],
        ],
      );
    }
    const [a, b, c] = points;
    const u = b.map((value, axis) => Fraction.subtract(value, a[axis])),
      v = c.map((value, axis) => Fraction.subtract(value, a[axis]));
    const uu = dot(u, u), uv = dot(u, v), vv = dot(v, v);
    const determinant = Fraction.subtract(Fraction.multiply(uu, vv), Fraction.multiply(uv, uv));
    if (!(determinant.numerator > 0n))
      throw new Error(
        "Skin projection native triangle has no representable plane.",
      );
    const w = a.map((value) => Fraction.negate(value)),
      wu = dot(w, u), wv = dot(w, v), du = dot(direction, u), dv = dot(direction, v);
    const solve = (first: IHumanExactFraction, second: IHumanExactFraction,
      diagonal: IHumanExactFraction): IHumanExactFraction => Fraction.divide(
      Fraction.subtract(Fraction.multiply(first, diagonal), Fraction.multiply(second, uv)), determinant,
    );
    const s = solve(wu, wv, vv), ds = solve(du, dv, vv),
      t = solve(wv, wu, uu), dt = solve(dv, du, uu);
    emit(
      ids,
      a.map((value, axis) => Fraction.add(value, Fraction.add(Fraction.multiply(u[axis], s), Fraction.multiply(v[axis], t)))),
      u.map((value, axis) => Fraction.add(Fraction.multiply(value, ds), Fraction.multiply(v[axis], dt))),
      [
        [s, ds],
        [t, dt],
        [Fraction.subtract(Fraction.subtract(one, s), t), Fraction.negate(Fraction.add(ds, dt))],
      ],
    );
  }
  if (features.length === 0)
    throw new Error("Skin projection has no native feature support.");
  return { origin, scale, direction, features };
}
