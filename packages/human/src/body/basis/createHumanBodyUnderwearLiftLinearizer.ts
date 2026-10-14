import { HumanExactFraction as Fraction } from "../../common/measure/HumanExactFraction";
import type { IHumanExactFraction } from "../../common/measure/IHumanExactFraction";
import type { IHumanBodyUnderwearLiftConstraint } from "./IHumanBodyUnderwearLiftConstraint";
import type { IHumanBodyUnderwearLiftLinearization } from "./IHumanBodyUnderwearLiftLinearization";
import type { IHumanBodyUnderwearLiftLinearizerInput } from "./IHumanBodyUnderwearLiftLinearizerInput";
import type { IHumanBodyUnderwearSurfaceEvaluation } from "./IHumanBodyUnderwearSurfaceEvaluation";
import { createHumanBodyUnderwearNormalLinearizer } from "./createHumanBodyUnderwearNormalLinearizer";
import { readHumanBodyUnderwearLiftPath } from "./readHumanBodyUnderwearLiftPath";

/**
 * Linearize local full-offset orientation using the actual transported normals.
 *
 * One fixed original positive face-area magnitude nondimensionalizes each row. Sparse Cartesian derivatives include each normal's entire indexed one-ring; candidate coordinates remain metres, so gradients have inverse-metre units. For a unique interior minimum, the offset derivative vanishes and the envelope derivative is the partial derivative at that stationary witness. Every exact finite tie is retained instead of choosing an arbitrary corner or endpoint.
 *
 * A constant quadratic may have a directional derivative with interior curvature. Endpoint derivatives suffice only when every represented directional quadratic coefficient is exactly zero. Otherwise the continuum model is explicitly unavailable; its existing strictly valid forward state is not rejected here. The fitting owner decides how to proceed with that modeling limitation.
 *
 * Rounded emitted faces are measured separately. These rows propose steps; only the original complete forward evaluator can accept them. Neither local strict orientation nor derivative existence proves global injectivity or convergence.
 *
 * @evidence contracts/common.md#principled-implementation Original face area nondimensionalizes analytic one-ring normal derivatives; exact represented lift minima retain all finite ties, and constant-polynomial curvature is checked with rational arithmetic before claiming an available local model.
 * @evidence contracts/common.md#clear-and-simple-design Fixed source admission and normal preparation precede a candidate reader that returns sparse orientation rows and located unavailability to the owning fitter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unrepresentable derivatives or a continuum not represented by finite rows remain explicit unavailability; local proposals do not certify emitted geometry, global injectivity or convergence.
 * @evidence contracts/common.md#meaningful-documentation The prose states metre coordinates, inverse-metre gradients, stationary witnesses, constant-case limits, rounded-face readings and the forward evaluator's authority.
 * @evidence contracts/performance.md#efficient-algorithms Each candidate traverses faces and their corner one-ring Cartesian dependencies; sparse derivative work scales with those actual dependencies, while exact constant-case fractions add input-bit-length-dependent arithmetic rather than a fixed-cost certificate.
 * @evidence contracts/performance.md#reuse-equivalent-work Original face scales and the compiled normal reader are shared across candidates; one candidate's normal derivatives are reused among incident face constraints.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains fixed input, area scales and normal preparation until unreachable; each returned sparse row/unavailability set belongs to its caller and temporary dependency/fraction arrays expire without handles or tasks.
 */
export function createHumanBodyUnderwearLiftLinearizer(
  input: IHumanBodyUnderwearLiftLinearizerInput,
): (
  evaluation: IHumanBodyUnderwearSurfaceEvaluation,
) => IHumanBodyUnderwearLiftLinearization {
  if (
    input.points.length === 0 ||
    input.points.length % 3 !== 0 ||
    input.normals.length !== input.points.length ||
    input.sourceVertices.length !== input.points.length / 3 ||
    !input.points.every(Number.isFinite) ||
    !input.normals.every(Number.isFinite) ||
    !Number.isFinite(input.offsetMetres) ||
    input.indices.length === 0 ||
    input.indices.length % 3 !== 0 ||
    input.indices.some(
      (vertex: number): boolean =>
        !Number.isSafeInteger(vertex) ||
        vertex < 0 ||
        vertex >= input.points.length / 3,
    ) ||
    Array.from(input.sourceVertices).some(
      (vertex: number): boolean => !Number.isSafeInteger(vertex) || vertex < 0,
    )
  )
    throw new Error(
      "Lift linearization needs complete original material and its actual source correspondence.",
    );
  const originalAreas: number[] = Array.from(
    { length: input.indices.length / 3 },
    (_: unknown, triangle: number): number => {
      const ids: number[] = input.indices.slice(triangle * 3, triangle * 3 + 3);
      const area: number[] = cross(
        subtract(at(input.points, ids[1]), at(input.points, ids[0])),
        subtract(at(input.points, ids[2]), at(input.points, ids[0])),
      );
      const size: number = Math.hypot(...area);
      if (!(size > 0) || !Number.isFinite(size))
        throw new Error(
          "Lift linearization needs each original material face to have finite positive area.",
        );
      return size;
    },
  );
  const normalLinearizer: ReturnType<
    typeof createHumanBodyUnderwearNormalLinearizer
  > = createHumanBodyUnderwearNormalLinearizer(input);
  return (
    evaluation: IHumanBodyUnderwearSurfaceEvaluation,
  ): IHumanBodyUnderwearLiftLinearization => {
    if (
      evaluation.base.length !== input.points.length ||
      evaluation.positions.length !== input.points.length ||
      evaluation.normals.length !== input.points.length ||
      !evaluation.base.every(Number.isFinite)
    )
      throw new Error(
        "Lift linearization needs one complete actual candidate evaluation.",
      );
    const result: IHumanBodyUnderwearLiftLinearization = {
      rows: [],
      unavailable: [],
    };
    if (input.offsetMetres === 0) return result;
    const normal: ReturnType<typeof normalLinearizer> =
      normalLinearizer(evaluation);
    result.unavailable.push(...normal.unavailable);
    const failedNormals: Set<number | null> = new Set(
      normal.unavailable.map(
        (
          failure: ReturnType<typeof normalLinearizer>["unavailable"][number],
        ): number | null => failure.vertex,
      ),
    );
    for (
      let triangle: number = 0;
      triangle < input.indices.length / 3;
      triangle++
    ) {
      const ids: number[] = input.indices.slice(triangle * 3, triangle * 3 + 3);
      if (ids.some((vertex: number): boolean => failedNormals.has(vertex)))
        continue;
      const points: number[][] = ids.map((vertex: number): number[] =>
        at(evaluation.base, vertex),
      );
      const normals: number[][] = ids.map((vertex: number): number[] =>
        at(evaluation.normals, vertex),
      );
      const final: number[][] = ids.map((vertex: number): number[] =>
        at(evaluation.positions, vertex),
      );
      const e1: number[] = subtract(points[1], points[0]),
        e2: number[] = subtract(points[2], points[0]);
      const d1: number[] = subtract(normals[1], normals[0]),
        d2: number[] = subtract(normals[2], normals[0]);
      const dependencies: number[] = [
        ...new Set(
          ids.flatMap((vertex: number): number[] => [
            vertex * 3,
            vertex * 3 + 1,
            vertex * 3 + 2,
            ...normal.derivatives[vertex].keys(),
          ]),
        ),
      ].sort((a: number, b: number): number => a - b);
      for (let corner: number = 0; corner < 3; corner++) {
        const path: ReturnType<typeof readHumanBodyUnderwearLiftPath> =
          readHumanBodyUnderwearLiftPath({
            points,
            normals,
            corner,
            offsetMetres: input.offsetMetres,
          });
        const build: (
          kind: IHumanBodyUnderwearLiftConstraint["kind"],
          offset: number,
          rawValue: number,
        ) => void = (
          kind: IHumanBodyUnderwearLiftConstraint["kind"],
          offset: number,
          rawValue: number,
        ): void => {
          const w1: number[] =
            kind === "base-outward"
              ? e1
              : kind === "rounded-final"
                ? subtract(final[1], final[0])
                : e1.map(
                    (value: number, axis: number): number =>
                      value + offset * d1[axis],
                  );
          const w2: number[] =
            kind === "base-outward"
              ? e2
              : kind === "rounded-final"
                ? subtract(final[2], final[0])
                : e2.map(
                    (value: number, axis: number): number =>
                      value + offset * d2[axis],
                  );
          const area: number[] = cross(w1, w2);
          const indices: number[] = [],
            gradient: number[] = [];
          for (const index of dependencies) {
            const dq: number[][] = ids.map((vertex: number): number[] =>
              [0, 1, 2].map((axis: number): number =>
                vertex * 3 + axis === index ? 1 : 0,
              ),
            );
            const dn: number[][] = ids.map(
              (vertex: number): number[] =>
                normal.derivatives[vertex].get(index) ?? [0, 0, 0],
            );
            const dw1: number[] = subtract(dq[1], dq[0]).map(
              (value: number, axis: number): number =>
                value + offset * (dn[1][axis] - dn[0][axis]),
            );
            const dw2: number[] = subtract(dq[2], dq[0]).map(
              (value: number, axis: number): number =>
                value + offset * (dn[2][axis] - dn[0][axis]),
            );
            const secondCross: number[] = cross(w1, dw2);
            const da: number[] = cross(dw1, w2).map(
              (value: number, axis: number): number =>
                value + secondCross[axis],
            );
            const change: number =
              (dot(da, normals[corner]) + dot(area, dn[corner])) /
              originalAreas[triangle];
            if (change !== 0) {
              indices.push(index);
              gradient.push(change);
            }
          }
          const value: number = rawValue / originalAreas[triangle];
          if (
            !Number.isFinite(rawValue) ||
            !Number.isFinite(value) ||
            !gradient.every(Number.isFinite)
          ) {
            result.unavailable.push({
              triangle,
              vertex: ids[corner],
              sourceVertex: input.sourceVertices[ids[corner]],
              reason:
                "Actual local orientation value or analytic Cartesian derivative is not representable.",
            });
            return;
          }
          result.rows.push({
            kind,
            value,
            rawValue,
            triangle,
            vertex: ids[corner],
            sourceVertex: input.sourceVertices[ids[corner]],
            corner,
            offsetMetres: offset,
            indices,
            gradient,
          });
        };
        build("base-outward", 0, dot(cross(e1, e2), normals[corner]));
        const finalArea: number[] = cross(
          subtract(final[1], final[0]),
          subtract(final[2], final[0]),
        );
        build(
          "rounded-final",
          input.offsetMetres,
          dot(finalArea, normals[corner]),
        );
        for (const location of path.locations)
          build("path-minimum", location, path.minimum);
        if (
          path.constant &&
          dependencies.some((index: number): boolean => {
            const dn: number[][] = ids.map(
              (vertex: number): number[] =>
                normal.derivatives[vertex].get(index) ?? [0, 0, 0],
            );
            return curvatureChanges(normals, dn, corner);
          })
        )
          result.unavailable.push({
            triangle,
            vertex: ids[corner],
            sourceVertex: input.sourceVertices[ids[corner]],
            reason:
              "The exact constant lift polynomial has a continuum of minimizers with unrepresentable or nonzero directional quadratic curvature; finite endpoint rows do not represent its full derivative.",
          });
      }
    }
    return result;
  };
}

/** Exact sign of the represented analytic derivative's quadratic coefficient. */
function curvatureChanges(
  normals: readonly (readonly number[])[],
  changes: readonly (readonly number[])[],
  corner: number,
): boolean {
  if (
    [...normals, ...changes].some(
      (vector: readonly number[]): boolean => !vector.every(Number.isFinite),
    )
  )
    return true;
  const n: IHumanExactFraction[][] = normals.map(
    (vector: readonly number[]): IHumanExactFraction[] =>
      vector.map((value: number): IHumanExactFraction => Fraction.from(value)),
  );
  const dn: IHumanExactFraction[][] = changes.map(
    (vector: readonly number[]): IHumanExactFraction[] =>
      vector.map((value: number): IHumanExactFraction => Fraction.from(value)),
  );
  const a: IHumanExactFraction[] = n[1].map(
    (value: IHumanExactFraction, axis: number): IHumanExactFraction =>
      Fraction.subtract(value, n[0][axis]),
  );
  const b: IHumanExactFraction[] = n[2].map(
    (value: IHumanExactFraction, axis: number): IHumanExactFraction =>
      Fraction.subtract(value, n[0][axis]),
  );
  const c: IHumanExactFraction[] = n[corner];
  const da: IHumanExactFraction[] = dn[1].map(
    (value: IHumanExactFraction, axis: number): IHumanExactFraction =>
      Fraction.subtract(value, dn[0][axis]),
  );
  const db: IHumanExactFraction[] = dn[2].map(
    (value: IHumanExactFraction, axis: number): IHumanExactFraction =>
      Fraction.subtract(value, dn[0][axis]),
  );
  const dc: IHumanExactFraction[] = dn[corner];
  const sum: IHumanExactFraction = Fraction.add(
    Fraction.add(
      exactDot(exactCross(da, b), c),
      exactDot(exactCross(a, db), c),
    ),
    exactDot(exactCross(a, b), dc),
  );
  return sum.numerator !== 0n;
}
function exactCross(
  a: readonly IHumanExactFraction[],
  b: readonly IHumanExactFraction[],
): IHumanExactFraction[] {
  return [
    [1, 2],
    [2, 0],
    [0, 1],
  ].map(
    ([j, k]: number[]): IHumanExactFraction =>
      Fraction.subtract(
        Fraction.multiply(a[j], b[k]),
        Fraction.multiply(a[k], b[j]),
      ),
  );
}
function exactDot(
  a: readonly IHumanExactFraction[],
  b: readonly IHumanExactFraction[],
): IHumanExactFraction {
  return a.reduce(
    (
      sum: IHumanExactFraction,
      value: IHumanExactFraction,
      k: number,
    ): IHumanExactFraction => Fraction.add(sum, Fraction.multiply(value, b[k])),
    Fraction.create(0n),
  );
}
function at(values: readonly number[], vertex: number): number[] {
  return values.slice(vertex * 3, vertex * 3 + 3);
}
function subtract(a: readonly number[], b: readonly number[]): number[] {
  return a.map((value: number, axis: number): number => value - b[axis]);
}
function cross(a: readonly number[], b: readonly number[]): number[] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
function dot(a: readonly number[], b: readonly number[]): number {
  return a.reduce(
    (sum: number, value: number, axis: number): number => sum + value * b[axis],
    0,
  );
}
