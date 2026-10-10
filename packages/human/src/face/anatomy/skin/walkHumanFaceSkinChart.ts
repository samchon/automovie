import { HumanExactFraction as F } from "../../../common/measure/HumanExactFraction";
import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";
import type { IHumanFaceSkinChartWalkInput } from "./IHumanFaceSkinChartWalkInput";
import { readHumanFaceSkinChartWeights } from "./readHumanFaceSkinChartWeights";

/**
 * Lift one chart chord through its actual native triangle adjacency.
 * Exact affine barycentrics determine outgoing edges and vertex fans. Each
 * selected cell contributes its complete positive parameter interval; a
 * straight chord's intersection with a chart triangle is convex, so no cell
 * can be visited again after a positive advance. This finite-cell property,
 * rather than an iteration cap, terminates the walk.
 *
 * An edge-aligned chord may use either adjacent face because both lift to
 * the identical native edge. The current face retains that support when
 * possible; otherwise native ordinal order settles this geometric tie.
 * Distinct outgoing supports, nonmanifold edges, a fold, a boundary and
 * zero advance refuse. No distance comparison chooses a preferred sheet.
 * The retained frame reader is captured with an owned input receiver;
 * changing the caller's record later cannot change already lifted spans.
 * Native cell and frame callbacks must read their immutable chart host;
 * callback closure state is not cloned by this geometric walker.
 *
 * @author Samchon
 */
export function walkHumanFaceSkinChart(
  input: IHumanFaceSkinChartWalkInput,
): number {
  const receiver: IHumanFaceSkinChartWalkInput = {
    startTriangle: input.startTriangle,
    from: structuredClone(input.from),
    to: structuredClone(input.to),
    cell: input.cell,
    frame: input.frame,
    spans: input.spans.map((span) => ({
      triangle: span.triangle,
      start: [...span.start],
      end: [...span.end],
      frameAt: span.frameAt,
    })),
  };
  const frame = receiver.frame.bind(receiver);
  const zero = F.create(0n),
    one = F.create(1n);
  const equations = new Map<
    number,
    readonly [readonly IHumanExactFraction[], readonly IHumanExactFraction[]]
  >();
  const equation = (ordinal: number) => {
    let result = equations.get(ordinal);
    if (result === undefined) {
      const cell = input.cell(ordinal);
      const start = readHumanFaceSkinChartWeights(cell, input.from),
        end = readHumanFaceSkinChartWeights(cell, input.to);
      result = [
        start,
        end.map((value, axis) => F.subtract(value, start[axis])),
      ];
      equations.set(ordinal, result);
    }
    return result;
  };
  const weights = (
    ordinal: number,
    parameter: IHumanExactFraction,
  ): [IHumanExactFraction, IHumanExactFraction, IHumanExactFraction] => {
    const [start, rate] = equation(ordinal);
    const at = (axis: number) =>
      F.add(start[axis], F.multiply(parameter, rate[axis]));
    return [at(0), at(1), at(2)];
  };
  let current = input.startTriangle,
    position = zero;
  const consumed = new Set<number>();
  while (F.compare(position, one) < 0) {
    const pending = [current],
      visited = new Set<number>(),
      candidates: number[] = [];
    let support: string | undefined;
    while (pending.length !== 0) {
      const ordinal = pending.pop()!;
      if (visited.has(ordinal)) continue;
      visited.add(ordinal);
      const cell = input.cell(ordinal),
        at = weights(ordinal, position),
        [, rate] = equation(ordinal);
      if (at.some((value) => value.numerator < 0n)) continue;
      const advances = at.every(
        (value, axis) => value.numerator > 0n || rate[axis].numerator >= 0n,
      );
      if (advances) {
        const active = cell.vertices
          .filter(
            (_, axis) => at[axis].numerator > 0n || rate[axis].numerator > 0n,
          )
          .sort((a, b) => a - b)
          .join(",");
        if (support !== undefined && active !== support)
          throw new Error(
            "Skin source chart has ambiguous native continuation at a vertex or overlapping facet.",
          );
        support = active;
        candidates.push(ordinal);
      }
      for (let axis = 0; axis < 3; axis++)
        if (at[axis].numerator === 0n) {
          const neighbors = cell.neighbors[axis];
          if (neighbors.length > 1)
            throw new Error(
              "Skin source chart reaches a nonmanifold native edge.",
            );
          pending.push(...neighbors);
        }
    }
    if (candidates.length === 0)
      throw new Error(
        "Skin source chart leaves its connected native support or reaches an open boundary.",
      );
    const chosen = candidates.includes(current)
      ? current
      : Math.min(...candidates);
    if (consumed.has(chosen))
      throw new Error(
        "Skin source chart revisits one convex native interval without valid ordering.",
      );
    const [origin, rate] = equation(chosen);
    let upper = one;
    for (let axis = 0; axis < 3; axis++)
      if (rate[axis].numerator < 0n) {
        const boundary = F.divide(F.negate(origin[axis]), rate[axis]);
        if (F.compare(boundary, upper) < 0) upper = boundary;
      }
    if (F.compare(upper, position) <= 0)
      throw new Error(
        "Skin source chart has no strict native parameter advance.",
      );
    const startWeights = weights(chosen, position),
      endWeights = weights(chosen, upper);
    const frameAt = (fraction: number) => {
      if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1)
        throw new Error("A native skin interval fraction must lie in [0,1].");
      const t = F.from(fraction);
      const weightAt = (axis: number) =>
        F.add(
          startWeights[axis],
          F.multiply(t, F.subtract(endWeights[axis], startWeights[axis])),
        );
      return frame({
        triangle: chosen,
        weights: [weightAt(0), weightAt(1), weightAt(2)],
      });
    };
    input.spans.push({
      triangle: chosen,
      start: frameAt(0).point,
      end: frameAt(1).point,
      frameAt,
    });
    consumed.add(chosen);
    current = chosen;
    position = upper;
  }
  return current;
}
