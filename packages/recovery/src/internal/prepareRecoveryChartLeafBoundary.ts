import {
  type IAutoMovieCurve64 as C,
  AutoMovieBernstein64 as S,
} from "@automovie/engine/geometry/curve";

import type { IRecoveryChartLeafFit } from "./IRecoveryChartLeafFit";
import type { RecoveryChartLeafControls as K } from "./RecoveryChartLeafControls";

/**
 * Prepare fixed outer collar coefficients from the original boundary cubics.
 *
 * @evidence contracts/common.md#principled-implementation Exact de Casteljau restrictions retain the original edge order, canonical corner endpoint authority and conflict checks in physical millimetres.
 * @evidence contracts/common.md#clear-and-simple-design This helper owns the extracted stage while the existing caller retains orchestration and its public contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original arithmetic, iteration order, identities and failure messages are retained without new fallback geometry or inferred correspondence.
 * @evidence contracts/common.md#meaningful-documentation States physical units, admitted authority and the stage's output responsibility.
 * @evidence contracts/performance.md#efficient-algorithms Each registry edge uses fixed-degree restriction and four coefficient visits, with one control-sized output allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work One endpoint map serves all exterior edges of this attempt and reuses each accepted canonical corner object.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Private endpoint scratch expires on return; the returned fixed coefficient array belongs to the current fit attempt.
 */
export function prepareRecoveryChartLeafBoundary(
  input: IRecoveryChartLeafFit.Input,
  registry: ReturnType<typeof K>,
): (C.Vector | null)[] {
  const controls: (C.Vector | null)[] = new Array(registry.controls).fill(null),
    endpoints: Map<string, C.Vector> = new Map();
  for (const edge of registry.edges) {
    if (edge.line !== 0 && edge.line !== 1) continue;
    const side: number =
      edge.axis === 0 ? (edge.line === 0 ? 0 : 2) : edge.line === 0 ? 3 : 1;
    const knots: readonly number[] = input.knots[side]!;
    const span: number =
      knots.findIndex(
        (end: number, i: number): boolean => i > 0 && edge.start < end,
      ) - 1;
    if (span < 0 || edge.end > knots[span + 1]!)
      throw new Error(
        "An outer collar edge crosses its canonical boundary cubic",
      );
    const start: number =
      (edge.start - knots[span]!) / (knots[span + 1]! - knots[span]!);
    const end: number =
      (edge.end - knots[span]!) / (knots[span + 1]! - knots[span]!);
    const original: [number, number, number][] = input.curves[
      side
    ]!.curve.spans[span]!.map((p: C.Vector): [number, number, number] => [
      p[0],
      p[1],
      p[2],
    ]);
    const net: [number, number, number][] = S.restrict(original, start, end);
    for (let k: number = 0; k < 4; k++) {
      let point: C.Vector = net[k]!;
      if (k === 0 || k === 3) {
        const phase: number = k === 0 ? edge.start : edge.end,
          local: number = k === 0 ? start : end;
        const uv: [number, number] =
            edge.axis === 0 ? [phase, edge.line] : [edge.line, phase],
          key: string = uv.join(":");
        const canonical: C.Vector =
          local === 0
            ? original[0]!
            : local === 1
              ? original[3]!
              : S.split(original, local)[0][3]!;
        const old: C.Vector | undefined = endpoints.get(key);
        if (
          old &&
          (uv[0] === 0 || uv[0] === 1) &&
          (uv[1] === 0 || uv[1] === 1) &&
          old.some((x: number, axis: number): boolean => x !== canonical[axis])
        )
          throw new Error(
            "Authoritative chart curves disagree at a shared corner",
          );
        point = old ?? canonical;
        endpoints.set(key, point);
      }
      const id: number = edge.controlIds[k]!,
        old: C.Vector | null = controls[id]!;
      if (
        old &&
        old.some((x: number, axis: number): boolean => x !== point[axis])
      )
        throw new Error("A fixed collar coefficient has conflicting owners");
      controls[id] = point;
    }
  }
  return controls;
}
