import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";
import type { IRecoveryDiskChart } from "./IRecoveryDiskChart";

/**
 * Choose a private disk boundary anchor and exact physical quarter measures.
 *
 * @evidence contracts/common.md#principled-implementation Original turn angles, cyclic key-word ranks and exact dyadic length accumulation establish the unchanged anchor and quarter authority in millimetres.
 * @evidence contracts/common.md#clear-and-simple-design This helper owns the extracted stage while the existing caller retains orchestration and its public contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original arithmetic, iteration order, identities and failure messages are retained without new fallback geometry or inferred correspondence.
 * @evidence contracts/common.md#meaningful-documentation States physical units, admitted authority and the stage's output responsibility.
 * @evidence contracts/performance.md#efficient-algorithms For B boundary observations, cyclic rank doubling and sorting retain their original work; dyadic accumulation visits each physical edge once.
 * @evidence contracts/performance.md#reuse-equivalent-work Returned scalar measures and the same scaled-integer closure serve every quarter insertion without recomputation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The DataView and rank arrays are call-local; returned arrays and closure transfer to one chart preparation.
 */
export function prepareRecoveryDiskBoundary(
  input: IRecoveryDiskChart.Input,
  fail: (reason: string) => never,
): {
  turns: number[];
  features: number[];
  anchor: number;
  cycle: number[];
  units: bigint[];
  total: bigint;
  scaled: (value: bigint) => { mantissa: number; shift: number };
  perimeterMm: number;
  quarterMm: number;
} {
  const turns: number[] = input.boundaryCycle.map(
    (id: number, i: number): number => {
      const previous: C.Vector =
          input.verticesMm[
            input.boundaryCycle[
              (i + input.boundaryCycle.length - 1) % input.boundaryCycle.length
            ]!
          ]!,
        p: C.Vector = input.verticesMm[id]!,
        next: C.Vector =
          input.verticesMm[
            input.boundaryCycle[(i + 1) % input.boundaryCycle.length]!
          ]!;
      const a: number[] = p.map(
          (x: number, k: number): number => x - previous[k]!,
        ),
        b: number[] = next.map((x: number, k: number): number => x - p[k]!);
      const la: number = Math.hypot(...a),
        lb: number = Math.hypot(...b);
      if (!(la > 0 && lb > 0 && Number.isFinite(la) && Number.isFinite(lb)))
        fail("a physical boundary edge is collapsed or unrepresentable");
      for (let k: number = 0; k < 3; k++) {
        a[k] = a[k]! / la;
        b[k] = b[k]! / lb;
      }
      const cross: number = Math.hypot(
        a[1]! * b[2]! - a[2]! * b[1]!,
        a[2]! * b[0]! - a[0]! * b[2]!,
        a[0]! * b[1]! - a[1]! * b[0]!,
      );
      return (
        (Math.atan2(
          cross,
          a.reduce(
            (sum: number, x: number, k: number): number => sum + x * b[k]!,
            0,
          ),
        ) *
          180) /
        Math.PI
      );
    },
  );
  const features: number[] = turns
    .map((turn: number, i: number): number =>
      turn >= input.cornerDegrees ? i : -1,
    )
    .filter((i: number): boolean => i >= 0);
  const candidates: number[] = features.length
    ? features
    : input.boundaryCycle.map((_: number, i: number): number => i);
  const words: string[] = input.boundaryCycle.map(
    (id: number): string => input.vertexKeys[id]!,
  );
  const alphabet: Map<string, number> = new Map(
    [...new Set(words)]
      .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
      .map((key: string, i: number): [string, number] => [key, i]),
  );
  let ranks: number[] = words.map((key: string): number => alphabet.get(key)!);
  // Doubling ranks compares whole cyclic key words without choosing an ordinal.
  // Coherent boundary direction is part of the input; reversing a cut boundary
  // can choose a different occurrence of a repeated physical anchor key.
  for (let span: number = 1; span < words.length; span *= 2) {
    const compare: (a: number, b: number) => number = (
      a: number,
      b: number,
    ): number =>
      ranks[a]! - ranks[b]! ||
      ranks[(a + span) % words.length]! - ranks[(b + span) % words.length]!;
    const order: number[] = words
        .map((_: string, i: number): number => i)
        .sort(compare),
      next: number[] = new Array(words.length);
    let rank: number = 0;
    next[order[0]!] = rank;
    for (let i: number = 1; i < order.length; i++) {
      if (compare(order[i - 1]!, order[i]!) !== 0) rank++;
      next[order[i]!] = rank;
    }
    ranks = next;
  }
  let anchor: number = candidates[0]!;
  for (const i of candidates) {
    const greaterTurn: boolean =
        features.length > 0 && turns[i]! > turns[anchor]!,
      tiedTurn: boolean = !features.length || turns[i] === turns[anchor];
    if (greaterTurn || (tiedTurn && ranks[i]! < ranks[anchor]!)) anchor = i;
  }
  if (
    candidates.some(
      (i: number): boolean =>
        i !== anchor &&
        (!features.length || turns[i] === turns[anchor]) &&
        ranks[i] === ranks[anchor],
    )
  )
    fail(
      "the physical boundary key-word cannot distinguish tied anchor occurrences",
    );
  const cycle: number[] = input.boundaryCycle.map(
    (_: number, i: number): number =>
      input.boundaryCycle[(anchor + i) % input.boundaryCycle.length]!,
  );
  const lengths: number[] = cycle.map((id: number, i: number): number =>
    Math.hypot(
      ...input.verticesMm[id]!.map(
        (x: number, k: number): number =>
          input.verticesMm[cycle[(i + 1) % cycle.length]!]![k]! - x,
      ),
    ),
  );
  // Exact dyadic addition keeps the quarter targets and canonical edge fractions
  // independent of floating-point summation order and source-array numbering.
  const view: DataView = new DataView(new ArrayBuffer(8));
  const dyadic: (value: number) => { mantissa: bigint; exponent: number } = (
    value: number,
  ): { mantissa: bigint; exponent: number } => {
    view.setFloat64(0, value, false);
    const bits: bigint = view.getBigUint64(0, false),
      exponent: number = Number((bits >> 52n) & 2047n),
      fraction: bigint = bits & ((1n << 52n) - 1n);
    return exponent === 0
      ? { mantissa: fraction, exponent: -1074 }
      : { mantissa: fraction + (1n << 52n), exponent: exponent - 1075 };
  };
  const parts: { mantissa: bigint; exponent: number }[] = lengths.map(dyadic),
    exponent: number = parts.reduce(
      (minimum: number, part: { exponent: number }): number =>
        Math.min(minimum, part.exponent),
      Infinity,
    );
  const units: bigint[] = parts.map(
      (part: { mantissa: bigint; exponent: number }): bigint =>
        part.mantissa << BigInt(part.exponent - exponent),
    ),
    total: bigint = units.reduce(
      (sum: bigint, value: bigint): bigint => sum + value,
      0n,
    );
  const scaled: (value: bigint) => { mantissa: number; shift: number } = (
    value: bigint,
  ): { mantissa: number; shift: number } => {
    const shift: number = Math.max(0, value.toString(2).length - 53);
    return { mantissa: Number(value >> BigInt(shift)), shift };
  };
  const perimeterParts: ReturnType<typeof scaled> = scaled(total),
    perimeterMm: number =
      perimeterParts.mantissa * 2 ** (exponent + perimeterParts.shift),
    quarterMm: number = perimeterMm / 4;
  if (!(perimeterMm > 0 && Number.isFinite(perimeterMm) && quarterMm > 0))
    fail("physical boundary perimeter is unrepresentable");
  return {
    turns,
    features,
    anchor,
    cycle,
    units,
    total,
    scaled,
    perimeterMm,
    quarterMm,
  };
}
