import type { RecoveryEventRegion } from "./RecoveryEventRegion";

type Source = Parameters<typeof RecoveryEventRegion>[0];

type V = Source["verticesMm"][number];
type Triangle = Source["triangles"][number];

/**
 * Prepare immutable source rank and incidence once for all scalar queries.
 *
 * @evidence contracts/common.md#principled-implementation The original exact binary64 integer encoding, face duplicate detection and edge admission retain their iteration order.
 * @evidence contracts/common.md#clear-and-simple-design This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/performance.md#efficient-algorithms Source admission visits V vertices and T faces with fixed-width binary64 integer operands.
 * @evidence contracts/performance.md#reuse-equivalent-work All queries reuse these original source addresses and per-face metadata.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned closures borrow source and per-face state; temporary integer coordinates and first-face keys are cleared at their original release points.
 */
export function RecoveryEventRegionSource(source: Source): {
  size: number;
  ranks: Uint8Array;
  duplicate: Set<number>;
  collapsed: Set<number>;
  sourceEdges: Map<string, number>;
  address: (vertex: number) => number;
  pair: (a: number, b: number) => string;
} {
  const size: number = source.verticesMm.length;
  if (
    !size ||
    source.heights.length !== size ||
    source.canon.length !== size ||
    (source.incidence !== "raw" && source.incidence !== "canonical")
  )
    throw new Error(
      "An aligned private source and explicit incidence policy are required",
    );
  const bits: DataView = new DataView(new ArrayBuffer(8));
  const integer: (x: number) => bigint = (x: number): bigint => {
    bits.setFloat64(0, x);
    const b: bigint = bits.getBigUint64(0),
      exponent: number = Number((b >> 52n) & 2047n),
      fraction: bigint = b & ((1n << 52n) - 1n);
    const magnitude: bigint = exponent
      ? ((1n << 52n) | fraction) << BigInt(exponent - 1)
      : fraction;
    return b >> 63n ? -magnitude : magnitude;
  };
  const encoded: bigint[][] = [];
  for (let i: number = 0; i < size; i++) {
    const p: V = source.verticesMm[i],
      canonical: number = source.canon[i];
    if (
      p.length !== 3 ||
      !p.every(Number.isFinite) ||
      !Number.isFinite(source.heights[i]) ||
      canonical < 0 ||
      canonical >= size ||
      source.canon[canonical] !== canonical
    )
      throw new Error(
        "Private source positions, heights and canonical addresses must align",
      );
    if (
      source.incidence === "canonical" &&
      (source.heights[i] !== source.heights[canonical] ||
        p.some(
          (x: number, k: number): boolean =>
            x !== source.verticesMm[canonical][k],
        ))
    )
      throw new Error(
        "Canonical incidence must preserve exact positions and scalar heights",
      );
    encoded.push(p.map(integer));
  }
  const ranks: Uint8Array = new Uint8Array(source.triangles.length);
  const duplicate: Set<number> = new Set(),
    collapsed: Set<number> = new Set();
  const firstFaces: Map<string, number> = new Map(),
    sourceEdges: Map<string, number> = new Map();
  const address: (vertex: number) => number = (vertex: number): number =>
    source.incidence === "raw" ? vertex : source.canon[vertex];
  const pair: (a: number, b: number) => string = (
    a: number,
    b: number,
  ): string => (a < b ? `${a}:${b}` : `${b}:${a}`);
  for (let i: number = 0; i < source.triangles.length; i++) {
    const t: Triangle = source.triangles[i];
    if (
      t.length !== 3 ||
      t.some(
        (v: number): boolean => !Number.isSafeInteger(v) || v < 0 || v >= size,
      )
    )
      throw new Error(
        "Private source faces require valid original vertex addresses",
      );
    const ids: number[] = t.map(address),
      key: string = [...ids]
        .sort((a: number, b: number): number => a - b)
        .join(":");
    for (let k: number = 0; k < 3; k++) {
      const edge: string = `e:${pair(ids[k], ids[(k + 1) % 3])}`;
      sourceEdges.set(edge, (sourceEdges.get(edge) ?? 0) + 1);
    }
    if (new Set(ids).size !== 3) collapsed.add(i);
    if (firstFaces.has(key)) {
      duplicate.add(firstFaces.get(key)!);
      duplicate.add(i);
    } else firstFaces.set(key, i);
    const p: bigint[] = encoded[t[0]],
      u: bigint[] = encoded[t[1]].map(
        (x: bigint, k: number): bigint => x - p[k],
      ),
      v: bigint[] = encoded[t[2]].map(
        (x: bigint, k: number): bigint => x - p[k],
      );
    ranks[i] = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ].some((x: bigint): boolean => x !== 0n)
      ? 2
      : [...u, ...v].some((x: bigint): boolean => x !== 0n)
        ? 1
        : 0;
  }
  encoded.length = 0;
  firstFaces.clear();

  return { size, ranks, duplicate, collapsed, sourceEdges, address, pair };
}
