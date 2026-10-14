import { HumanBinary64Arithmetic as Binary } from "../../common/measure/HumanBinary64Arithmetic";
import { HumanExactFraction as Fraction } from "../../common/measure/HumanExactFraction";
import type { IHumanExactFraction } from "../../common/measure/IHumanExactFraction";
import type { IHumanBodyUnderwearEnvelopeFaceReading } from "./IHumanBodyUnderwearEnvelopeFaceReading";
import type { IHumanBodyUnderwearFaceFieldInput } from "./IHumanBodyUnderwearFaceFieldInput";

/**
 * Read the qualified centre field over one complete planar material triangle.
 *
 * A known qualified centre bounds nearest distance everywhere by its maximum corner distance. Outward-rounded upper bounds and downward-rounded box distances retain every possible active centre in the existing hierarchy. A centre's restricted Voronoi region is the original barycentric triangle clipped by all retained squared-distance bisectors. Exact represented-input fractions classify those linear cells without a coordinate tolerance. During each opposing cell, exact bounds on its current polygon prune only hierarchy nodes whose every centre is farther than that cell's centre at every polygon point. The original coarse candidate IDs and leaf order stay intact; no centre, tie, nonempty degenerate cell or refusal is removed.
 *
 * A fixed centre's signed face-plane direction is constant. Positive possible centres are therefore a sufficient acceptance bound; opposing possible centres are tested for an actual active cell before refusing. Cell clipping changes no emitted geometry, source identity or ball population.
 *
 * @evidence contracts/common.md#principled-implementation Outward/downward represented bounds retain possible nearest centres, then exact rational Voronoi half-planes determine whether an opposing face-direction branch actually owns any closed barycentric cell.
 * @evidence contracts/common.md#clear-and-simple-design Coarse hierarchy selection precedes per-opposing-centre cell clipping, with a polygon-identity cache sharing exact cell bounds during the current hierarchy walk.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite/unrepresentable face bounds report unavailability; ties and degenerate nonempty cells remain, and this local exterior-direction reading does not certify global garment embedding or rendered appearance.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes possible versus active centres, exact represented-input cells, conservative positive bounds, unchanged source geometry and the refusal meaning.
 * @evidence contracts/performance.md#efficient-algorithms Hierarchy pruning reduces typical candidates, but C opposing candidates can each clip O(C) bisectors against O(C)-vertex polygons, giving cubic worst-case geometric work with bit-width-dependent rational arithmetic rather than a constant-cost orientation certificate.
 * @evidence contracts/performance.md#reuse-equivalent-work One seed bounds the entire face, coarse admitted-node identity is shared among cells, and exact polygon bounds are recomputed only after clip returns a different polygon object.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Candidate, hierarchy-node and rational polygon state are call-local; only a scalar reading/count/refusal record escapes, without retaining the source hierarchy, geometry cache, handle or task.
 */
export function readHumanBodyUnderwearFaceField(
  input: IHumanBodyUnderwearFaceFieldInput,
): IHumanBodyUnderwearEnvelopeFaceReading {
  const { face, root, seed }: IHumanBodyUnderwearFaceFieldInput = input;
  if (
    face.length !== 9 ||
    !face.every(Number.isFinite) ||
    seed.length !== 3 ||
    !seed.every(Number.isFinite)
  )
    return {
      minimumOrientation: null,
      candidates: 0,
      activeInvalidBranches: 0,
      unavailable:
        "A complete finite material face and qualified centre are required.",
    };
  const p: number[][] = [face.slice(0, 3), face.slice(3, 6), face.slice(6, 9)];
  const low: number[] = [0, 1, 2].map((k: number): number =>
    Math.min(...p.map((value: number[]): number => value[k])),
  );
  const high: number[] = [0, 1, 2].map((k: number): number =>
    Math.max(...p.map((value: number[]): number => value[k])),
  );
  let upper: number = 0;
  for (const point of p) {
    let squared: number = 0;
    for (let k: number = 0; k < 3; k++) {
      const distance: number = Binary.nextUp(Math.abs(point[k] - seed[k]));
      squared = Binary.nextUp(squared + Binary.nextUp(distance * distance));
    }
    upper = Math.max(upper, squared);
  }
  if (!Number.isFinite(upper))
    return {
      minimumOrientation: null,
      candidates: 0,
      activeInvalidBranches: 0,
      unavailable: "The complete branch distance bound is not representable.",
    };
  const candidates: IHumanBodyUnderwearFaceFieldInput["centres"][number][] = [];
  const admittedNodes: Set<IHumanBodyUnderwearFaceFieldInput["root"]> = new Set<
    IHumanBodyUnderwearFaceFieldInput["root"]
  >();
  const visit: (node: IHumanBodyUnderwearFaceFieldInput["root"]) => void = (
    node: IHumanBodyUnderwearFaceFieldInput["root"],
  ): void => {
    let lower: number = 0;
    for (let k: number = 0; k < 3; k++) {
      const gap: number = Math.max(
        0,
        Binary.nextDown(Math.max(node.low[k] - high[k], low[k] - node.high[k])),
      );
      lower = Math.max(
        0,
        Binary.nextDown(lower + Math.max(0, Binary.nextDown(gap * gap))),
      );
    }
    if (lower > upper) return;
    admittedNodes.add(node);
    if ("triangles" in node) candidates.push(...node.triangles);
    else {
      visit(node.left);
      visit(node.right);
    }
  };
  visit(root);
  const origin: IHumanExactFraction[] = p[0].map(Fraction.from.bind(Fraction));
  const e1: IHumanExactFraction[] = p[1].map(
    (value: number, k: number): IHumanExactFraction =>
      Fraction.subtract(Fraction.from(value), origin[k]),
  );
  const e2: IHumanExactFraction[] = p[2].map(
    (value: number, k: number): IHumanExactFraction =>
      Fraction.subtract(Fraction.from(value), origin[k]),
  );
  const area: IHumanExactFraction[] = exactCross(e1, e2);
  const areaLength: number = Math.hypot(
    ...area.map((value: IHumanExactFraction): number => Fraction.number(value)),
  );
  if (!(areaLength > 0) || !Number.isFinite(areaLength))
    return {
      minimumOrientation: null,
      candidates: candidates.length,
      activeInvalidBranches: 0,
      unavailable: "The actual face plane has no finite nonzero area.",
    };
  const shifted: IHumanExactFraction[][] = candidates.map(
    (
      centre: IHumanBodyUnderwearFaceFieldInput["centres"][number],
    ): IHumanExactFraction[] =>
      centre.centre.map(
        (value: number, k: number): IHumanExactFraction =>
          Fraction.subtract(Fraction.from(value), origin[k]),
      ),
  );
  const direction: IHumanExactFraction[] = shifted.map(
    (centre: IHumanExactFraction[]): IHumanExactFraction =>
      exactDot(area, centre),
  );
  const ordinals: Map<number, number> = new Map(
    candidates.map(
      (
        centre: IHumanBodyUnderwearFaceFieldInput["centres"][number],
        at: number,
      ): [number, number] => [centre.id, at],
    ),
  );
  let positive: number = Infinity,
    invalid: number = Infinity,
    activeInvalidBranches: number = 0;
  for (let i: number = 0; i < candidates.length; i++) {
    const value: number = Fraction.number(direction[i]) / areaLength;
    if (direction[i].numerator > 0n) {
      positive = Math.min(positive, value);
      continue;
    }
    let polygon: IHumanExactFraction[][] = [
      [Fraction.create(0n), Fraction.create(0n)],
      [Fraction.create(1n), Fraction.create(0n)],
      [Fraction.create(0n), Fraction.create(1n)],
    ];
    let boundedPolygon: IHumanExactFraction[][] | undefined;
    let cellLow: IHumanExactFraction[] = [],
      cellHigh: IHumanExactFraction[] = [];
    let cellUpper: IHumanExactFraction = Fraction.create(0n);
    const outsideCell: (
      node: IHumanBodyUnderwearFaceFieldInput["root"],
    ) => boolean = (
      node: IHumanBodyUnderwearFaceFieldInput["root"],
    ): boolean => {
      // clip always returns a new polygon, so identity owns this exact cache.
      if (boundedPolygon !== polygon) {
        const vertices: IHumanExactFraction[][] = polygon.map(
          (point: IHumanExactFraction[]): IHumanExactFraction[] =>
            e1.map(
              (
                coordinate: IHumanExactFraction,
                k: number,
              ): IHumanExactFraction =>
                Fraction.add(
                  Fraction.multiply(coordinate, point[0]),
                  Fraction.multiply(e2[k], point[1]),
                ),
            ),
        );
        cellLow = [0, 1, 2].map(
          (k: number): IHumanExactFraction =>
            vertices.reduce(
              (
                minimum: IHumanExactFraction,
                point: IHumanExactFraction[],
              ): IHumanExactFraction =>
                Fraction.compare(point[k], minimum) < 0 ? point[k] : minimum,
              vertices[0][k],
            ),
        );
        cellHigh = [0, 1, 2].map(
          (k: number): IHumanExactFraction =>
            vertices.reduce(
              (
                maximum: IHumanExactFraction,
                point: IHumanExactFraction[],
              ): IHumanExactFraction =>
                Fraction.compare(point[k], maximum) > 0 ? point[k] : maximum,
              vertices[0][k],
            ),
        );
        cellUpper = Fraction.create(0n);
        for (const point of vertices) {
          const difference: IHumanExactFraction[] = point.map(
            (coordinate: IHumanExactFraction, k: number): IHumanExactFraction =>
              Fraction.subtract(coordinate, shifted[i][k]),
          );
          const squared: IHumanExactFraction = exactDot(difference, difference);
          if (Fraction.compare(squared, cellUpper) > 0) cellUpper = squared;
        }
        boundedPolygon = polygon;
      }
      let lower: IHumanExactFraction = Fraction.create(0n);
      for (let k: number = 0; k < 3; k++) {
        const nodeLow: IHumanExactFraction = Fraction.subtract(
          Fraction.from(node.low[k]),
          origin[k],
        );
        const nodeHigh: IHumanExactFraction = Fraction.subtract(
          Fraction.from(node.high[k]),
          origin[k],
        );
        const first: IHumanExactFraction = Fraction.subtract(
          nodeLow,
          cellHigh[k],
        );
        const second: IHumanExactFraction = Fraction.subtract(
          cellLow[k],
          nodeHigh,
        );
        let gap: IHumanExactFraction = Fraction.create(0n);
        if (Fraction.compare(first, gap) > 0) gap = first;
        if (Fraction.compare(second, gap) > 0) gap = second;
        lower = Fraction.add(lower, Fraction.multiply(gap, gap));
      }
      return Fraction.compare(lower, cellUpper) > 0;
    };
    const visitCell: (
      node: IHumanBodyUnderwearFaceFieldInput["root"],
    ) => void = (node: IHumanBodyUnderwearFaceFieldInput["root"]): void => {
      if (polygon.length === 0 || !admittedNodes.has(node) || outsideCell(node))
        return;
      if ("triangles" in node) {
        for (const centre of node.triangles) {
          const j: number | undefined = ordinals.get(centre.id);
          if (j === undefined || i === j) continue;
          const difference: IHumanExactFraction[] = shifted[j].map(
            (coordinate: IHumanExactFraction, k: number): IHumanExactFraction =>
              Fraction.subtract(coordinate, shifted[i][k]),
          );
          const u: IHumanExactFraction = Fraction.multiply(
            Fraction.from(2),
            exactDot(e1, difference),
          );
          const v: IHumanExactFraction = Fraction.multiply(
            Fraction.from(2),
            exactDot(e2, difference),
          );
          const bound: IHumanExactFraction = Fraction.subtract(
            exactDot(shifted[j], shifted[j]),
            exactDot(shifted[i], shifted[i]),
          );
          polygon = clip(polygon, u, v, bound);
          if (polygon.length === 0) break;
        }
      } else {
        visitCell(node.left);
        visitCell(node.right);
      }
    };
    visitCell(root);
    if (polygon.length !== 0) {
      activeInvalidBranches++;
      invalid = Math.min(invalid, value);
    }
  }
  const minimum: number = activeInvalidBranches > 0 ? invalid : positive;
  return {
    minimumOrientation: Number.isFinite(minimum) ? minimum : null,
    candidates: candidates.length,
    activeInvalidBranches,
    unavailable:
      !Number.isFinite(minimum) ||
      (activeInvalidBranches === 0 && !(minimum > 0))
        ? "A complete represented positive exterior direction was unavailable."
        : null,
  };
}

/** Closed exact half-plane clipping retains all nearest-centre ties. */
function clip(
  polygon: IHumanExactFraction[][],
  u: IHumanExactFraction,
  v: IHumanExactFraction,
  bound: IHumanExactFraction,
): IHumanExactFraction[][] {
  const value: (
    point: readonly IHumanExactFraction[],
  ) => IHumanExactFraction = (
    point: readonly IHumanExactFraction[],
  ): IHumanExactFraction =>
    Fraction.subtract(
      Fraction.add(
        Fraction.multiply(u, point[0]),
        Fraction.multiply(v, point[1]),
      ),
      bound,
    );
  const result: IHumanExactFraction[][] = [];
  for (let i: number = 0; i < polygon.length; i++) {
    const a: IHumanExactFraction[] = polygon[i],
      b: IHumanExactFraction[] = polygon[(i + 1) % polygon.length],
      first: IHumanExactFraction = value(a),
      second: IHumanExactFraction = value(b);
    const insideA: boolean = first.numerator <= 0n,
      insideB: boolean = second.numerator <= 0n;
    if (insideA) result.push(a);
    if (insideA !== insideB) {
      const weight: IHumanExactFraction = Fraction.divide(
        first,
        Fraction.subtract(first, second),
      );
      result.push(
        a.map(
          (coordinate: IHumanExactFraction, k: number): IHumanExactFraction =>
            Fraction.add(
              coordinate,
              Fraction.multiply(weight, Fraction.subtract(b[k], coordinate)),
            ),
        ),
      );
    }
  }
  return result;
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
