import { adjacentFloat64 } from "../../math/internal/adjacentFloat64";
import type { AirborneQuadratureAggregateTypes } from "./AirborneQuadratureAggregateTypes";

/*
 * Maintain adaptive quadrature sums and a changing nonnegative error measure.
 * Each panel has fixed error components e; its current priority is w(value).e.
 * Internal nodes keep component sums and maxima. The maxima bound every
 * descendant priority for the current weights, so branch-and-bound selects the
 * real maximum without keeping stale scores when the integral changes.
 * Parameter first: The first actual Simpson panel.
 * Parameter components: Fixed nonnegative error components, independent of the
 * whole integral.
 * Returns: A call-owned tree with fresh integral snapshots and borrowed
 * read-only roundoff totals.
 */
export function AirborneQuadratureAggregate<
  Panel extends AirborneQuadratureAggregateTypes.IPanel,
>(
  first: Panel,
  components: (error: readonly number[]) => readonly number[],
): AirborneQuadratureAggregateTypes.ITree<Panel> {
  /*
   * Numeric subtree totals, with an explicit parent for local refresh.
   */
  interface IBase {
    parent: IBranch | null;
    value: number[];
    roundoff: number[];
    sum: number[];
    maximum: number[];
    first: number;
  }
  /*
   * An actual live panel and its fixed derived error coordinates.
   */
  interface ILeaf extends IBase {
    kind: "leaf";
    panel: Panel;
  }
  /*
   * A binary partition whose aggregates enclose both current children.
   */
  interface IBranch extends IBase {
    kind: "branch";
    left: INode;
    right: INode;
  }
  /*
   * The discriminant makes a panel and child pair mutually exclusive.
   */
  type INode = ILeaf | IBranch;
  /*
   * The live leaves by panel; a replaced panel leaves it, and it dies with the tree.
   */
  const index: Map<Panel, ILeaf> = new Map<Panel, ILeaf>();
  let width: number | undefined;
  const leaf: (panel: Panel) => ILeaf = (panel: Panel): ILeaf => {
    const error: number[] = [...components(panel.error)];
    width ??= error.length;
    if (
      width === 0 ||
      error.length !== width ||
      !error.every((v: number): boolean => v >= 0)
    )
      throw new Error(
        "A quadrature aggregate needs fixed nonnegative error components",
      );
    const node: ILeaf = {
      kind: "leaf",
      panel,
      parent: null,
      value: [...panel.value],
      roundoff: panel.value.map((): number => 0),
      sum: error,
      maximum: [...error],
      first: panel.a,
    };
    index.set(panel, node);
    return node;
  };
  let root: INode = leaf(first);
  const refresh: (node: IBranch) => void = (node: IBranch): void => {
    const { left, right }: IBranch = node;
    for (let i: number = 0; i < node.value.length; i++) {
      const a: number = left.value[i]!;
      const b: number = right.value[i]!;
      const sum: number = a + b;
      const back: number = sum - a;
      const lost: number = a - (sum - back) + (b - back);
      node.value[i] = sum;
      node.roundoff[i] = upperSum(
        upperSum(left.roundoff[i]!, right.roundoff[i]!),
        Math.abs(lost),
      );
    }
    for (let i: number = 0; i < width!; i++) {
      node.sum[i] = upperSum(left.sum[i]!, right.sum[i]!);
      node.maximum[i] = Math.max(left.maximum[i]!, right.maximum[i]!);
    }
    node.first = Math.min(left.first, right.first);
  };
  const weightsValid: (weights: readonly number[]) => void = (
    weights: readonly number[],
  ): void => {
    if (
      weights.length !== width ||
      !weights.every((v: number): boolean => v >= 0)
    )
      throw new Error(
        "A quadrature aggregate needs matching nonnegative weights",
      );
  };
  return {
    read: (): AirborneQuadratureAggregateTypes.IRead => ({
      value: [...root.value],
      roundoff: root.roundoff,
    }),
    estimate: (weights: readonly number[], roundoff: number): number => {
      weightsValid(weights);
      if (!(roundoff >= 0))
        throw new Error("A quadrature roundoff measure must be nonnegative");
      let total: number = roundoff;
      for (let i: number = 0; i < width!; i++) {
        const component: number = root.sum[i]!;
        const weight: number = weights[i]!;
        if (component === 0 || weight === 0) continue;
        const product: number = component * weight;
        const bound: number =
          product === Number.MAX_VALUE
            ? Infinity
            : adjacentFloat64(product, true);
        total = upperSum(total, bound);
      }
      return total;
    },
    worst: (weights: readonly number[]): Panel => {
      weightsValid(weights);
      let best: ILeaf | undefined;
      let largest: number = -1;
      const visit: (node: INode, bound: number) => void = (
        node: INode,
        bound: number,
      ): void => {
        if (
          bound < largest ||
          (bound === largest && best !== undefined && node.first >= best.first)
        )
          return;
        if (node.kind === "leaf") {
          const score: number = weighted(node.sum, weights);
          if (
            score > largest ||
            (score === largest &&
              (best === undefined || node.first < best.first))
          ) {
            largest = score;
            best = node;
          }
          return;
        }
        const left: number = weighted(node.left.maximum, weights);
        const right: number = weighted(node.right.maximum, weights);
        if (
          left > right ||
          (left === right && node.left.first <= node.right.first)
        ) {
          visit(node.left, left);
          visit(node.right, right);
        } else {
          visit(node.right, right);
          visit(node.left, left);
        }
      };
      visit(root, weighted(root.maximum, weights));
      return best!.panel;
    },
    replace: (previous: Panel, leftPanel: Panel, rightPanel: Panel): void => {
      const old: ILeaf | undefined = index.get(previous);
      if (old === undefined)
        throw new Error("Only a live quadrature panel can be replaced");
      const left: ILeaf = leaf(leftPanel);
      const right: ILeaf = leaf(rightPanel);
      const parent: IBranch = {
        kind: "branch",
        parent: old.parent,
        left,
        right,
        value: Array.from({ length: old.value.length }, (): number => 0),
        roundoff: Array.from({ length: old.value.length }, (): number => 0),
        sum: Array.from({ length: width! }, (): number => 0),
        maximum: Array.from({ length: width! }, (): number => 0),
        first: old.first,
      };
      left.parent = parent;
      right.parent = parent;
      if (old.parent === null) root = parent;
      else if (old.parent.left === old) old.parent.left = parent;
      else old.parent.right = parent;
      index.delete(previous);
      for (let node: IBranch | null = parent; node !== null; node = node.parent)
        refresh(node);
    },
  };
}

/*
 * Nonnegative weighted priority, retaining the seed's zero-times-infinity
 * convention.
 */
function weighted(
  values: readonly number[],
  weights: readonly number[],
): number {
  let result: number = 0;
  for (let i: number = 0; i < values.length; i++)
    if (values[i] !== 0 && weights[i] !== 0) result += values[i]! * weights[i]!;
  return result;
}

/*
 * Enclose an exact sum of two nonnegative bounds, widening only a
 * downward-rounded result.
 */
function upperSum(a: number, b: number): number {
  if (a === 0) return b;
  if (b === 0) return a;
  const sum: number = a + b;
  const back: number = sum - a;
  const lost: number = a - (sum - back) + (b - back);
  return lost > 0
    ? sum === Number.MAX_VALUE
      ? Infinity
      : adjacentFloat64(sum, true)
    : sum;
}
