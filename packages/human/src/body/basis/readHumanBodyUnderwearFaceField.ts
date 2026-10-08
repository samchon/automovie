import type { IHumanExactFraction } from "../../common/measure/IHumanExactFraction";
import { HumanExactFraction as Fraction } from "../../common/measure/HumanExactFraction";
import { HumanBinary64Arithmetic as Binary } from "../../common/measure/HumanBinary64Arithmetic";
import type { IHumanBodyUnderwearFaceFieldInput } from "./IHumanBodyUnderwearFaceFieldInput";
import type { IHumanBodyUnderwearEnvelopeFaceReading } from "./IHumanBodyUnderwearEnvelopeFaceReading";

/**
 * Read the qualified centre field over one complete planar material triangle.
 *
 * A known qualified centre bounds nearest distance everywhere by its maximum
 * corner distance. Outward-rounded upper bounds and downward-rounded box
 * distances retain every possible active centre in the existing hierarchy.
 * A centre's restricted Voronoi region is the original barycentric triangle
 * clipped by all retained squared-distance bisectors. Exact represented-input
 * fractions classify those linear cells without a coordinate tolerance.
 * During each opposing cell, exact bounds on its current polygon prune only
 * hierarchy nodes whose every centre is farther than that cell's centre at
 * every polygon point. The original coarse candidate IDs and leaf order stay
 * intact; no centre, tie, nonempty degenerate cell or refusal is removed.
 *
 * A fixed centre's signed face-plane direction is constant. Positive possible
 * centres are therefore a sufficient acceptance bound; opposing possible
 * centres are tested for an actual active cell before refusing. Cell clipping
 * changes no emitted geometry, source identity or ball population.
 *
 * @evidence contracts/common.md#principled-implementation A complete spatial candidate bound and exact restricted Voronoi cells establish the active branch condition over the whole face rather than samples.
 * @evidence contracts/common.md#clear-and-simple-design This numerical reader serves the one existing garment envelope and emits no alternate field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original centre ordinals and represented coordinates are retained without geometric margins or positional welding.
 * @evidence contracts/common.md#meaningful-documentation Defines candidate completeness, exact clipping and the conservative positive direction bound.
 */
export function readHumanBodyUnderwearFaceField(
  input: IHumanBodyUnderwearFaceFieldInput,
): IHumanBodyUnderwearEnvelopeFaceReading {
  const { face, root, seed } = input;
  if (face.length !== 9 || !face.every(Number.isFinite) || seed.length !== 3 || !seed.every(Number.isFinite))
    return { minimumOrientation: null, candidates: 0, activeInvalidBranches: 0, unavailable: "A complete finite material face and qualified centre are required." };
  const p = [face.slice(0, 3), face.slice(3, 6), face.slice(6, 9)];
  const low = [0, 1, 2].map((k) => Math.min(...p.map((value) => value[k])));
  const high = [0, 1, 2].map((k) => Math.max(...p.map((value) => value[k])));
  let upper = 0;
  for (const point of p) {
    let squared = 0;
    for (let k = 0; k < 3; k++) {
      const distance = Binary.nextUp(Math.abs(point[k] - seed[k]));
      squared = Binary.nextUp(squared + Binary.nextUp(distance * distance));
    }
    upper = Math.max(upper, squared);
  }
  if (!Number.isFinite(upper))
    return { minimumOrientation: null, candidates: 0, activeInvalidBranches: 0, unavailable: "The complete branch distance bound is not representable." };
  const candidates: IHumanBodyUnderwearFaceFieldInput["centres"][number][] = [];
  const admittedNodes = new Set<IHumanBodyUnderwearFaceFieldInput["root"]>();
  const visit = (node: IHumanBodyUnderwearFaceFieldInput["root"]): void => {
    let lower = 0;
    for (let k = 0; k < 3; k++) {
      const gap = Math.max(0, Binary.nextDown(Math.max(node.low[k] - high[k], low[k] - node.high[k])));
      lower = Math.max(0, Binary.nextDown(lower + Math.max(0, Binary.nextDown(gap * gap))));
    }
    if (lower > upper) return;
    admittedNodes.add(node);
    if ("triangles" in node) candidates.push(...node.triangles);
    else { visit(node.left); visit(node.right); }
  };
  visit(root);
  const origin = p[0].map(Fraction.from.bind(Fraction));
  const e1 = p[1].map((value, k) => Fraction.subtract(Fraction.from(value), origin[k]));
  const e2 = p[2].map((value, k) => Fraction.subtract(Fraction.from(value), origin[k]));
  const area = exactCross(e1, e2);
  const areaLength = Math.hypot(...area.map((value) => Fraction.number(value)));
  if (!(areaLength > 0) || !Number.isFinite(areaLength))
    return { minimumOrientation: null, candidates: candidates.length, activeInvalidBranches: 0, unavailable: "The actual face plane has no finite nonzero area." };
  const shifted = candidates.map((centre) => centre.centre.map((value, k) =>
    Fraction.subtract(Fraction.from(value), origin[k])));
  const direction = shifted.map((centre) => exactDot(area, centre));
  const ordinals = new Map(candidates.map((centre, at) => [centre.id, at]));
  let positive = Infinity, invalid = Infinity, activeInvalidBranches = 0;
  for (let i = 0; i < candidates.length; i++) {
    const value = Fraction.number(direction[i]) / areaLength;
    if (direction[i].numerator > 0n) { positive = Math.min(positive, value); continue; }
    let polygon = [[Fraction.create(0n), Fraction.create(0n)],
      [Fraction.create(1n), Fraction.create(0n)], [Fraction.create(0n), Fraction.create(1n)]];
    let boundedPolygon: IHumanExactFraction[][] | undefined;
    let cellLow: IHumanExactFraction[] = [], cellHigh: IHumanExactFraction[] = [];
    let cellUpper = Fraction.create(0n);
    const outsideCell = (node: IHumanBodyUnderwearFaceFieldInput["root"]): boolean => {
      // clip always returns a new polygon, so identity owns this exact cache.
      if (boundedPolygon !== polygon) {
        const vertices = polygon.map((point) => e1.map((coordinate, k) =>
          Fraction.add(Fraction.multiply(coordinate, point[0]),
            Fraction.multiply(e2[k], point[1]))));
        cellLow = [0, 1, 2].map((k) => vertices.reduce((minimum, point) =>
          Fraction.compare(point[k], minimum) < 0 ? point[k] : minimum, vertices[0][k]));
        cellHigh = [0, 1, 2].map((k) => vertices.reduce((maximum, point) =>
          Fraction.compare(point[k], maximum) > 0 ? point[k] : maximum, vertices[0][k]));
        cellUpper = Fraction.create(0n);
        for (const point of vertices) {
          const difference = point.map((coordinate, k) =>
            Fraction.subtract(coordinate, shifted[i][k]));
          const squared = exactDot(difference, difference);
          if (Fraction.compare(squared, cellUpper) > 0) cellUpper = squared;
        }
        boundedPolygon = polygon;
      }
      let lower = Fraction.create(0n);
      for (let k = 0; k < 3; k++) {
        const nodeLow = Fraction.subtract(Fraction.from(node.low[k]), origin[k]);
        const nodeHigh = Fraction.subtract(Fraction.from(node.high[k]), origin[k]);
        const first = Fraction.subtract(nodeLow, cellHigh[k]);
        const second = Fraction.subtract(cellLow[k], nodeHigh);
        let gap = Fraction.create(0n);
        if (Fraction.compare(first, gap) > 0) gap = first;
        if (Fraction.compare(second, gap) > 0) gap = second;
        lower = Fraction.add(lower, Fraction.multiply(gap, gap));
      }
      return Fraction.compare(lower, cellUpper) > 0;
    };
    const visitCell = (node: IHumanBodyUnderwearFaceFieldInput["root"]): void => {
      if (polygon.length === 0 || !admittedNodes.has(node) || outsideCell(node)) return;
      if ("triangles" in node) {
        for (const centre of node.triangles) {
          const j = ordinals.get(centre.id);
          if (j === undefined || i === j) continue;
          const difference = shifted[j].map((coordinate, k) =>
            Fraction.subtract(coordinate, shifted[i][k]));
          const u = Fraction.multiply(Fraction.from(2), exactDot(e1, difference));
          const v = Fraction.multiply(Fraction.from(2), exactDot(e2, difference));
          const bound = Fraction.subtract(exactDot(shifted[j], shifted[j]), exactDot(shifted[i], shifted[i]));
          polygon = clip(polygon, u, v, bound);
          if (polygon.length === 0) break;
        }
      } else { visitCell(node.left); visitCell(node.right); }
    };
    visitCell(root);
    if (polygon.length !== 0) { activeInvalidBranches++; invalid = Math.min(invalid, value); }
  }
  const minimum = activeInvalidBranches > 0 ? invalid : positive;
  return { minimumOrientation: Number.isFinite(minimum) ? minimum : null,
    candidates: candidates.length, activeInvalidBranches,
    unavailable: !Number.isFinite(minimum) || (activeInvalidBranches === 0 && !(minimum > 0))
      ? "A complete represented positive exterior direction was unavailable." : null };
}

/** Closed exact half-plane clipping retains all nearest-centre ties. */
function clip(
  polygon: IHumanExactFraction[][], u: IHumanExactFraction,
  v: IHumanExactFraction, bound: IHumanExactFraction,
): IHumanExactFraction[][] {
  const value = (point: readonly IHumanExactFraction[]): IHumanExactFraction =>
    Fraction.subtract(Fraction.add(Fraction.multiply(u, point[0]), Fraction.multiply(v, point[1])), bound);
  const result: IHumanExactFraction[][] = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length], first = value(a), second = value(b);
    const insideA = first.numerator <= 0n, insideB = second.numerator <= 0n;
    if (insideA) result.push(a);
    if (insideA !== insideB) {
      const weight = Fraction.divide(first, Fraction.subtract(first, second));
      result.push(a.map((coordinate, k) => Fraction.add(coordinate,
        Fraction.multiply(weight, Fraction.subtract(b[k], coordinate)))));
    }
  }
  return result;
}
function exactDot(a: readonly IHumanExactFraction[], b: readonly IHumanExactFraction[]): IHumanExactFraction {
  return a.reduce((sum, value, k) => Fraction.add(sum, Fraction.multiply(value, b[k])), Fraction.create(0n));
}
function exactCross(a: readonly IHumanExactFraction[], b: readonly IHumanExactFraction[]): IHumanExactFraction[] {
  return [[1, 2], [2, 0], [0, 1]].map(([j, k]) => Fraction.subtract(
    Fraction.multiply(a[j], b[k]), Fraction.multiply(a[k], b[j])));
}
