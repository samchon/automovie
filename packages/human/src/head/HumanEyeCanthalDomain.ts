import type { HumanCurve } from "../internal/HumanCurve";

/** Admission of the existing polynomial eye chart without changing its geometry. */
export namespace HumanEyeCanthalDomain {
  /** Outward-rounded bounds on one real polynomial coefficient. */
  type Range = [number, number];

  /** One exact parameter restriction, bounded by its complete Bernstein net. */
  interface Block {
    /** Complete outward coefficient hull for this parameter interval. */
    coefficients: Range[];

    /** Number of midpoint restrictions from the original interval. */
    depth: number;
  }

  const bits: DataView = new DataView(new ArrayBuffer(8));

  /**
   * Admit only a strictly increasing canthal station on the complete [0,1] eye
   * feature. The degree-six derivative is formed algebraically from the actual
   * degree-seven endpoint-constrained residual. Outward binary64 intervals cover
   * coefficient conversion and every De Casteljau restriction. A positive lower
   * coefficient hull proves positivity without point samples or a shape epsilon.
   * The projection chord is the same evaluated endpoint difference used by the
   * annulus; the feature chord is its actual polynomial's linear term.
   * Optional start/end residual offsets add their complete scaled linear term
   * under the same outward bounds, as required by the named upper-face profiles.
   * Nonpositive stations, nonfinite bounds and unresolved bounds after 4,096
   * subdivisions or 32 subdivision levels are refused. Budget exhaustion is absence of
   * qualification, not evidence of a fold. No curve or requested value is changed.
   */
  export function admit(
    profiles: readonly (readonly number[])[],
    chord: HumanCurve.Vector,
    scales: HumanCurve.Vector,
    projectionChord: HumanCurve.Vector,
    endpointOffsets?: readonly [HumanCurve.Vector, HumanCurve.Vector],
  ): void {
    if (profiles.length !== 3 || !chord.every(Number.isFinite) || !scales.every(Number.isFinite) || !projectionChord.every(Number.isFinite) ||
      profiles.some((profile: readonly number[]): boolean => profile.length !== profiles[0]!.length || !profile.every(Number.isFinite)) ||
      endpointOffsets?.some((value: HumanCurve.Vector): boolean => !value.every(Number.isFinite)))
      throw new Error("The canthal chart requires finite complete three-coordinate polynomial profiles");
    const derivatives: Range[][] = profiles.map((profile: readonly number[]): Range[] => derivativeNet(profile));
    let linearProjection: Range = [0, 0];
    for (let axis: number = 0; axis < 3; axis++) {
      let component: Range = [chord[axis]!, chord[axis]!];
      if (endpointOffsets !== undefined) {
        const first: number = endpointOffsets[0][axis]!, last: number = endpointOffsets[1][axis]!;
        component = add(component, scale(add([last, last], scale([first, first], -1)), scales[axis]!));
      }
      linearProjection = add(linearProjection, scale(component, projectionChord[axis]!));
    }
    const coefficients: Range[] = derivatives[0]!.map((_unused: Range, index: number): Range => {
      let value: Range = [...linearProjection];
      for (let axis: number = 0; axis < 3; axis++)
        value = add(value, scale(scale(derivatives[axis]![index]!, scales[axis]!), projectionChord[axis]!));
      return value;
    });
    const pending: Block[] = [{ coefficients, depth: 0 }];
    let visited: number = 0;
    while (pending.length > 0) {
      const block: Block = pending.pop()!;
      if (!block.coefficients.every((value: Range): boolean => value.every(Number.isFinite)))
        throw new Error("The canthal station has no finite outward coefficient bound");
      if (block.coefficients.every((value: Range): boolean => value[0] > 0)) continue;
      if (block.coefficients[0]![1] <= 0 || block.coefficients.at(-1)![1] <= 0)
        throw new Error("The supplied eye controls create a nonincreasing canthal station");
      if (++visited > 4096 || block.depth >= 32)
        throw new Error("Strict canthal monotonicity remains unqualified within the finite interval-subdivision budget");
      const children: [Range[], Range[]] = split(block.coefficients);
      pending.push({ coefficients: children[1], depth: block.depth + 1 }, { coefficients: children[0], depth: block.depth + 1 });
    }
  }

  /** Complete Bernstein derivative of u(1-u) sum(theta[k](2u-1)^k). */
  function derivativeNet(profile: readonly number[]): Range[] {
    if (profile.length === 0) throw new Error("An eye residual needs its complete polynomial coefficients");
    let polynomial: Range[] = [[profile.at(-1)!, profile.at(-1)!]];
    for (let k: number = profile.length - 2; k >= 0; k--) {
      const degree: number = polynomial.length;
      polynomial = Array.from({ length: degree + 1 }, (_unused: unknown, index: number): Range => {
        let value: Range = [0, 0];
        if (index < degree) value = add(value, scale(polynomial[index]!, -(degree - index)));
        if (index > 0) value = add(value, scale(polynomial[index - 1]!, index));
        return add(divide(value, degree), [profile[k]!, profile[k]!]);
      });
    }
    const degree: number = polynomial.length + 1;
    const residual: Range[] = Array.from({ length: degree + 1 }, (_unused: unknown, index: number): Range =>
      index === 0 || index === degree ? [0, 0] : divide(scale(polynomial[index - 1]!, index * (degree - index)), degree * (degree - 1)));
    return residual.slice(0, -1).map((value: Range, index: number): Range =>
      scale(add(residual[index + 1]!, scale(value, -1)), degree));
  }

  /** Both children preserve the same polynomial and share the bounded midpoint. */
  function split(coefficients: readonly Range[]): [Range[], Range[]] {
    let row: Range[] = coefficients.map((value: Range): Range => [...value]);
    const left: Range[] = [row[0]!], right: Range[] = [row.at(-1)!];
    while (row.length > 1) {
      row = row.slice(0, -1).map((value: Range, index: number): Range => scale(add(value, row[index + 1]!), 0.5));
      left.push(row[0]!); right.push(row.at(-1)!);
    }
    return [left, right.reverse()];
  }

  /** Interval addition rounds each endpoint to the adjacent outward binary64. */
  function add(a: Range, b: Range): Range {
    return [outward(a[0] + b[0], -1), outward(a[1] + b[1], 1)];
  }

  /** Multiplication by an exact supplied binary64 scalar retains endpoint order. */
  function scale(value: Range, factor: number): Range {
    const a: number = value[0] * factor, b: number = value[1] * factor;
    return [outward(Math.min(a, b), -1), outward(Math.max(a, b), 1)];
  }

  /** Positive integer division encloses the rational basis-conversion factor. */
  function divide(value: Range, denominator: number): Range {
    return [outward(value[0] / denominator, -1), outward(value[1] / denominator, 1)];
  }

  /** Adjacent representable values bound arithmetic rounding without a tolerance. */
  function outward(value: number, direction: 1 | -1): number {
    if (!Number.isFinite(value)) return value;
    if (value === 0) return direction * Number.MIN_VALUE;
    bits.setFloat64(0, value, false);
    const step: bigint = (value > 0) === (direction > 0) ? 1n : -1n;
    bits.setBigUint64(0, bits.getBigUint64(0, false) + step, false);
    return bits.getFloat64(0, false);
  }
}
