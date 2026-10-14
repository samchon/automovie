import { HumanExactFraction as F } from "../../../common/measure/HumanExactFraction";
import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";
import type { IHumanFaceSkinChartWalkInput } from "./IHumanFaceSkinChartWalkInput";
import { readHumanFaceSkinChartWeights } from "./readHumanFaceSkinChartWeights";
import type { IHumanFaceSkinChartSpan as IHumanFaceSkinChartSpanImported } from "./IHumanFaceSkinChartSpan";
import type { IHumanFaceSkinFrame as IHumanFaceSkinFrameImported } from "./IHumanFaceSkinFrame";
import type { IHumanFaceExactSkinSeat as IHumanFaceExactSkinSeatImported } from "./IHumanFaceExactSkinSeat";
import type { IHumanFaceSkinChartTriangle as IHumanFaceSkinChartTriangleImported } from "./IHumanFaceSkinChartTriangle";


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
 * @evidence contracts/common.md#principled-implementation Exact affine barycentric signs trace a chord through native adjacency and edge/vertex fans; positive interval advance plus each convex cell's single consumption terminates supported walks, while ambiguous supports, folds, boundaries and nonmanifold edges refuse.
 * @evidence contracts/common.md#clear-and-simple-design One chord walker owns equations, continuation and span emission; chart cells supply fixed inverse/adjacency and the host supplies exact physical frames.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal edge support retains the current facet or minimum native ordinal; distance, relief width, sampling quotas and a guessed iteration limit do not choose a sheet or conceal failed advance.
 * @evidence contracts/common.md#meaningful-documentation The prose states native convexity, exact tie/advance rules, refusal causes and callback/receiver ownership; the function appends completed spans incrementally, so refusal can leave earlier pieces in the caller's span array.
 * @evidence contracts/performance.md#efficient-algorithms Per-chord equations are cached by reached cell; each advance scans its incident zero-edge fan and emits one native interval with rational bit cost. Receiver construction also copies P prior accumulated spans, so repeated chord calls can add quadratic copying/retention; no linear-total-cost claim is made.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated endpoint/parameter reads reuse the chord's cell equations; retained frame closures reuse exact interval endpoints and their immutable chart host, while different chords require distinct affine rates.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Visited/equation/consumed sets are bounded by native cells; returned span callbacks retain the owned receiver snapshot and host frame until courses are released, including copied prior spans. No external task or global cache is acquired, and partial append failure is not transactional.
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
    spans: input.spans.map((span: IHumanFaceSkinChartSpanImported): { triangle: number; start: number[]; end: number[]; frameAt: (fraction: number) => IHumanFaceSkinFrameImported; }  => ({
      triangle: span.triangle,
      start: [...span.start],
      end: [...span.end],
      frameAt: span.frameAt,
    })),
  };
  const frame: (seat: IHumanFaceExactSkinSeatImported) => IHumanFaceSkinFrameImported = receiver.frame.bind(receiver);
  const zero: IHumanExactFraction = F.create(0n),
    one: IHumanExactFraction = F.create(1n);
  const equations: Map<number, readonly [readonly IHumanExactFraction[], readonly IHumanExactFraction[]]> = new Map<
    number,
    readonly [readonly IHumanExactFraction[], readonly IHumanExactFraction[]]
  >();
  const equation: (ordinal: number) => readonly [readonly IHumanExactFraction[], readonly IHumanExactFraction[]] = (ordinal: number): readonly [readonly IHumanExactFraction[], readonly IHumanExactFraction[]]  => {
    let result: readonly [readonly IHumanExactFraction[], readonly IHumanExactFraction[]] | undefined = equations.get(ordinal);
    if (result === undefined) {
      const cell: IHumanFaceSkinChartTriangleImported = input.cell(ordinal);
      const start: [IHumanExactFraction, IHumanExactFraction, IHumanExactFraction] = readHumanFaceSkinChartWeights(cell, input.from),
        end: [IHumanExactFraction, IHumanExactFraction, IHumanExactFraction] = readHumanFaceSkinChartWeights(cell, input.to);
      result = [
        start,
        end.map((value: IHumanExactFraction, axis: number): IHumanExactFraction  => F.subtract(value, start[axis])),
      ];
      equations.set(ordinal, result);
    }
    return result;
  };
  const weights: (ordinal: number, parameter: IHumanExactFraction) => [IHumanExactFraction, IHumanExactFraction, IHumanExactFraction] = (
    ordinal: number,
    parameter: IHumanExactFraction,
  ): [IHumanExactFraction, IHumanExactFraction, IHumanExactFraction] => {
    const [start, rate]: readonly [readonly IHumanExactFraction[], readonly IHumanExactFraction[]] = equation(ordinal);
    const at: (axis: number) => IHumanExactFraction = (axis: number): IHumanExactFraction  =>
      F.add(start[axis], F.multiply(parameter, rate[axis]));
    return [at(0), at(1), at(2)];
  };
  let current: number = input.startTriangle,
    position: IHumanExactFraction = zero;
  const consumed: Set<number> = new Set<number>();
  while (F.compare(position, one) < 0) {
    const pending: number[] = [current],
      visited: Set<number> = new Set<number>(),
      candidates: number[] = [];
    let support: string | undefined;
    while (pending.length !== 0) {
      const ordinal: number = pending.pop()!;
      if (visited.has(ordinal)) continue;
      visited.add(ordinal);
      const cell: IHumanFaceSkinChartTriangleImported = input.cell(ordinal),
        at: [IHumanExactFraction, IHumanExactFraction, IHumanExactFraction] = weights(ordinal, position),
        [, rate]: readonly [readonly IHumanExactFraction[], readonly IHumanExactFraction[]] = equation(ordinal);
      if (at.some((value: IHumanExactFraction): boolean  => value.numerator < 0n)) continue;
      const advances: boolean = at.every(
        (value: IHumanExactFraction, axis: number): boolean  => value.numerator > 0n || rate[axis].numerator >= 0n,
      );
      if (advances) {
        const active: string = cell.vertices
          .filter(
            (_: number, axis: number): boolean  => at[axis].numerator > 0n || rate[axis].numerator > 0n,
          )
          .sort((a: number, b: number): number  => a - b)
          .join(",");
        if (support !== undefined && active !== support)
          throw new Error(
            "Skin source chart has ambiguous native continuation at a vertex or overlapping facet.",
          );
        support = active;
        candidates.push(ordinal);
      }
      for (let axis: number = 0; axis < 3; axis++)
        if (at[axis].numerator === 0n) {
          const neighbors: readonly number[] = cell.neighbors[axis];
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
    const chosen: number = candidates.includes(current)
      ? current
      : Math.min(...candidates);
    if (consumed.has(chosen))
      throw new Error(
        "Skin source chart revisits one convex native interval without valid ordering.",
      );
    const [origin, rate]: readonly [readonly IHumanExactFraction[], readonly IHumanExactFraction[]] = equation(chosen);
    let upper: IHumanExactFraction = one;
    for (let axis: number = 0; axis < 3; axis++)
      if (rate[axis].numerator < 0n) {
        const boundary: IHumanExactFraction = F.divide(F.negate(origin[axis]), rate[axis]);
        if (F.compare(boundary, upper) < 0) upper = boundary;
      }
    if (F.compare(upper, position) <= 0)
      throw new Error(
        "Skin source chart has no strict native parameter advance.",
      );
    const startWeights: [IHumanExactFraction, IHumanExactFraction, IHumanExactFraction] = weights(chosen, position),
      endWeights: [IHumanExactFraction, IHumanExactFraction, IHumanExactFraction] = weights(chosen, upper);
    const frameAt: (fraction: number) => IHumanFaceSkinFrameImported = (fraction: number): IHumanFaceSkinFrameImported  => {
      if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1)
        throw new Error("A native skin interval fraction must lie in [0,1].");
      const t: IHumanExactFraction = F.from(fraction);
      const weightAt: (axis: number) => IHumanExactFraction = (axis: number): IHumanExactFraction  =>
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
