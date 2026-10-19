/**
 * Partition one unit UV square into an affine boundary collar and local leaves.
 * Side knots are bottom, right, top and left, increasing in chart u or v.
 * Every outer leaf edge lies within one supplied side interval. The initial
 * partition has at most the four side span counts plus five leaves. This bound
 * does not cover later splits, fitted controls or generated vertices.
 *
 * Roots are center, corner.bottom-left, corner.bottom-right, corner.top-left,
 * corner.top-right, or bottom/right/top/left followed by their interval ordinal.
 * A split replaces its leaf by .0 and .1 children in increasing axis order;
 * parameter is a global UV coordinate, not a relative child parameter.
 * Bounds are [u0,u1,v0,v1]. Thin positive spans remain present; their physical
 * conditioning and quadrature representability belong to the consumer.
 * Invalid input or an unrepresentable or over-budget partition throws without
 * mutating input. No source, boundary authority or physical curve is inferred.
 *
 * @evidence contracts/common.md#principled-implementation Min/max cuts stay before each first and after each last side knot. Four corners, four independently partitioned bands and one center cover the square with disjoint interiors; each strict interior split preserves that partition inductively.
 * @evidence contracts/common.md#clear-and-simple-design This pure helper owns only normalized parameter rectangles and explicit caller-requested splits, leaving physical relations, fitting and retained-best fallback to consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source mesh, coordinate weld, epsilon deletion, knot relocation or anatomy-specific policy enters the construction; all supplied side intervals survive.
 * @evidence contracts/common.md#meaningful-documentation States side and bounds ordering, deterministic IDs, global split coordinates, initial count scope, thin-span limits, input ownership and failure effects.
 * @evidence contracts/performance.md#efficient-algorithms K side knots produce O(K) initial work and storage; S explicit splits use expected O(S) map work and O(K+S) returned leaves, bounded by maxLeaves. Coverage follows the construction and does not require a quadratic overlap scan.
 * @evidence contracts/performance.md#reuse-equivalent-work Side cuts are collected once, and the leaf map resolves each sequential split without searching or rebuilding unrelated roots. There is no cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One call owns knot-derived cut arrays and at most maxLeaves leaf records. Temporary maps expire on return or throw; returned bounds are newly owned arrays and inputs are never retained or mutated.
 */
export function RecoveryChartCollar(input: {
  /** Four strict increasing unit knot arrays, including both endpoints. */
  knots: readonly [
    readonly number[],
    readonly number[],
    readonly number[],
    readonly number[],
  ];
  /** Positive safe bound on both the initial and every resulting leaf count. */
  maxLeaves: number;
  /** Sequential split requests addressed to the currently retained leaf IDs. */
  splits?: readonly { leaf: string; axis: 0 | 1; parameter: number }[];
}): {
  /** Global UV coordinates separating corners, side bands and center. */
  frame: { uL: number; uR: number; vD: number; vU: number };
  /** Deterministic map order, with children appended when their parent is split. */
  leaves: {
    id: string;
    root: string;
    level: number;
    bounds: [number, number, number, number];
  }[];
  /** Count before applying any explicit split requests. */
  initialLeaves: number;
  /** Source-free construction qualifications; validity failures throw. */
  diagnostics: string[];
} {
  if (
    !input ||
    !Array.isArray(input.knots) ||
    input.knots.length !== 4 ||
    !Number.isSafeInteger(input.maxLeaves) ||
    input.maxLeaves < 1 ||
    (input.splits !== undefined && !Array.isArray(input.splits))
  )
    throw new Error(
      "Four side knot arrays and a positive safe leaf budget are required",
    );
  for (let side: number = 0; side < 4; side++) {
    const knots: readonly number[] = input.knots[side]!;
    if (
      !Array.isArray(knots) ||
      knots.length < 2 ||
      knots[0] !== 0 ||
      knots.at(-1) !== 1
    )
      throw new Error("Every collar side needs both unit-interval endpoints");
    for (let i: number = 0; i < knots.length; i++)
      if (!Number.isFinite(knots[i]) || (i > 0 && knots[i]! <= knots[i - 1]!))
        throw new Error(
          "Collar side knots must be finite and strictly increasing",
        );
  }
  // Selecting existing knots or exact quarter phases avoids half-gap rounding.
  const uL: number = Math.min(0.25, input.knots[0][1]!, input.knots[2][1]!);
  const uR: number = Math.max(
    0.75,
    input.knots[0].at(-2)!,
    input.knots[2].at(-2)!,
  );
  const vD: number = Math.min(0.25, input.knots[1][1]!, input.knots[3][1]!);
  const vU: number = Math.max(
    0.75,
    input.knots[1].at(-2)!,
    input.knots[3].at(-2)!,
  );
  if (!(uL > 0 && uL < uR && uR < 1 && vD > 0 && vD < vU && vU < 1))
    throw new Error("The boundary collar has no representable positive frame");
  const cuts: number[][] = [];
  let initialLeaves: number = 5;
  for (let side: number = 0; side < 4; side++) {
    const lower: number = side % 2 === 0 ? uL : vD,
      upper: number = side % 2 === 0 ? uR : vU;
    const values: number[] = [lower];
    for (const value of input.knots[side]!)
      if (value > lower && value < upper) values.push(value);
    values.push(upper);
    cuts.push(values);
    initialLeaves += values.length - 1;
    if (initialLeaves > input.maxLeaves)
      throw new Error(
        "Boundary collar exceeds maxLeaves before leaf allocation",
      );
  }
  const leaves: Map<
    string,
    ReturnType<typeof RecoveryChartCollar>["leaves"][number]
  > = new Map();
  const roots: { id: string; bounds: [number, number, number, number] }[] = [
    { id: "corner.bottom-left", bounds: [0, uL, 0, vD] },
    { id: "corner.bottom-right", bounds: [uR, 1, 0, vD] },
    { id: "corner.top-left", bounds: [0, uL, vU, 1] },
    { id: "corner.top-right", bounds: [uR, 1, vU, 1] },
    { id: "center", bounds: [uL, uR, vD, vU] },
  ];
  for (let side: number = 0; side < 4; side++)
    for (let i: number = 0; i + 1 < cuts[side]!.length; i++) {
      const a: number = cuts[side]![i]!,
        b: number = cuts[side]![i + 1]!;
      const bounds: [number, number, number, number] =
        side === 0
          ? [a, b, 0, vD]
          : side === 1
            ? [uR, 1, a, b]
            : side === 2
              ? [a, b, vU, 1]
              : [0, uL, a, b];
      roots.push({
        id: `${["bottom", "right", "top", "left"][side]}.${i}`,
        bounds,
      });
    }
  for (const root of roots) {
    if (
      !(root.bounds[0] < root.bounds[1] && root.bounds[2] < root.bounds[3]) ||
      leaves.has(root.id)
    )
      throw new Error(
        "The initial collar has overlapping identities or a nonpositive leaf",
      );
    leaves.set(root.id, {
      id: root.id,
      root: root.id,
      level: 0,
      bounds: root.bounds,
    });
  }
  if (leaves.size !== initialLeaves)
    throw new Error("The initial collar lost a required covering leaf");
  for (const split of input.splits ?? []) {
    if (
      !split ||
      typeof split.leaf !== "string" ||
      (split.axis !== 0 && split.axis !== 1) ||
      !Number.isFinite(split.parameter)
    )
      throw new Error(
        "A collar split needs a retained leaf, an axis and a finite global parameter",
      );
    const parent:
      | ReturnType<typeof RecoveryChartCollar>["leaves"][number]
      | undefined = leaves.get(split.leaf);
    if (!parent)
      throw new Error(
        "A collar split addresses a missing or already split leaf",
      );
    const lowerSlot: number = 2 * split.axis,
      upperSlot: number = lowerSlot + 1;
    if (
      !(
        split.parameter > parent.bounds[lowerSlot]! &&
        split.parameter < parent.bounds[upperSlot]!
      )
    )
      throw new Error(
        "A collar split must be representably inside its retained leaf",
      );
    if (leaves.size >= input.maxLeaves)
      throw new Error("A collar split exceeds maxLeaves");
    const lower: [number, number, number, number] = [...parent.bounds],
      upper: [number, number, number, number] = [...parent.bounds];
    lower[upperSlot] = split.parameter;
    upper[lowerSlot] = split.parameter;
    leaves.delete(parent.id);
    leaves.set(`${parent.id}.0`, {
      id: `${parent.id}.0`,
      root: parent.root,
      level: parent.level + 1,
      bounds: lower,
    });
    leaves.set(`${parent.id}.1`, {
      id: `${parent.id}.1`,
      root: parent.root,
      level: parent.level + 1,
      bounds: upper,
    });
  }
  return {
    frame: { uL, uR, vD, vU },
    leaves: [...leaves.values()],
    initialLeaves,
    diagnostics: [
      "Parameter rectangles preserve the unit domain; physical conditioning, boundary authorities and interface conformity are consumer responsibilities.",
    ],
  };
}
