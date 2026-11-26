import type { AutoMovieVector2Tuple } from "@automovie/interface";

import { orientAutoMovieSolidChart as orient } from "./orientAutoMovieSolidChart";

interface IVertex {
  /** Authoritative vertex index in the skin. */
  id: number;

  /** Station followed by the across-section coordinate. */
  chart: Readonly<AutoMovieVector2Tuple>;
}

/**
 * Triangulate the two chains of a monotone chart in linear time. Each chain
 * increases strictly in station, they share exactly their first and last
 * vertices, and the lower chain is below the upper between those ends.
 * Triangles use the original indices in positive chart winding.
 *
 * @see https://doi.org/10.1016/0020-0190(78)90062-5 Garey et al., section 2.
 */
export function triangulateAutoMovieMonotoneChart(
  lower: readonly IVertex[],
  upper: readonly IVertex[],
): [number, number, number][] | string {
  const first = lower[0];
  const last = lower.at(-1);
  if (
    lower.length < 2 ||
    upper.length < 2 ||
    first?.id !== upper[0]?.id ||
    last?.id !== upper.at(-1)?.id ||
    lower.length + upper.length < 5
  )
    return "A monotone chart needs two ordered boundary chains with shared ends";

  type Site = { vertex: IVertex; lower: boolean };
  const order: Site[] = [{ vertex: first!, lower: true }];
  let l = 1;
  let u = 1;
  while (l < lower.length - 1 || u < upper.length - 1) {
    // A tied station follows increasing transverse coordinate. The two
    // chains already have strictly increasing stations individually.
    const takeLower =
      u === upper.length - 1 ||
      (l < lower.length - 1 && lower[l]!.chart[0] <= upper[u]!.chart[0]);
    order.push({
      vertex: takeLower ? lower[l++]! : upper[u++]!,
      lower: takeLower,
    });
  }

  const faces: [number, number, number][] = [];
  const append = (a: IVertex, b: IVertex, c: IVertex): void => {
    const sign = orient(a.chart, b.chart, c.chart);
    if (sign > 0) faces.push([a.id, b.id, c.id]);
    else if (sign < 0) faces.push([a.id, c.id, b.id]);
  };
  const closeStack = (at: IVertex, stack: readonly Site[]): void => {
    for (let i = 1; i < stack.length; ++i)
      append(at, stack[i - 1]!.vertex, stack[i]!.vertex);
  };

  let stack: Site[] = [order[0]!, order[1]!];
  for (let i = 2; i < order.length; ++i) {
    const current = order[i]!;
    const top = stack.at(-1)!;
    if (current.lower !== top.lower) {
      closeStack(current.vertex, stack);
      stack = [top, current];
      continue;
    }
    let middle = stack.pop()!;
    while (stack.length > 0) {
      const base = stack.at(-1)!;
      const turn = orient(base.vertex.chart, middle.vertex.chart, current.vertex.chart);
      // A collinear source point stays on the stack for the opposite chain.
      if (turn !== (current.lower ? 1 : -1)) break;
      append(base.vertex, middle.vertex, current.vertex);
      middle = stack.pop()!;
    }
    stack.push(middle, current);
  }
  closeStack(last!, stack);
  return faces.length === lower.length + upper.length - 4
    ? faces
    : "The monotone chart did not yield a nondegenerate face for each boundary index";
}
