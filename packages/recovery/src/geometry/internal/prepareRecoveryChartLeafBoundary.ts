import { AutoMovieEngineBernstein64 as S } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryChartLeafBoundaryPreparationOperation,
} from "@automovie/interface";

/*
 * Prepare fixed outer collar coefficients from the original boundary cubics.
 */
export function prepareRecoveryChartLeafBoundary(
  input: Parameters<IAutoMovieRecoveryChartLeafBoundaryPreparationOperation.Operation>[0],
  registry: Parameters<IAutoMovieRecoveryChartLeafBoundaryPreparationOperation.Operation>[1],
): ReturnType<IAutoMovieRecoveryChartLeafBoundaryPreparationOperation.Operation> {
  const controls: (Readonly<AutoMovieVector3Tuple> | null)[] = new Array(
      registry.controls,
    ).fill(null),
    endpoints: Map<string, Readonly<AutoMovieVector3Tuple>> = new Map();
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
    ]!.curve.spans[span]!.map(
      (p: Readonly<AutoMovieVector3Tuple>): [number, number, number] => [
        p[0],
        p[1],
        p[2],
      ],
    );
    const net: [number, number, number][] = S.restrict(original, start, end);
    for (let k: number = 0; k < 4; k++) {
      let point: Readonly<AutoMovieVector3Tuple> = net[k]!;
      if (k === 0 || k === 3) {
        const phase: number = k === 0 ? edge.start : edge.end,
          local: number = k === 0 ? start : end;
        const uv: [number, number] =
            edge.axis === 0 ? [phase, edge.line] : [edge.line, phase],
          key: string = uv.join(":");
        const canonical: Readonly<AutoMovieVector3Tuple> =
          local === 0
            ? original[0]!
            : local === 1
              ? original[3]!
              : S.split(original, local)[0][3]!;
        const old: Readonly<AutoMovieVector3Tuple> | undefined =
          endpoints.get(key);
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
        old: Readonly<AutoMovieVector3Tuple> | null = controls[id]!;
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
