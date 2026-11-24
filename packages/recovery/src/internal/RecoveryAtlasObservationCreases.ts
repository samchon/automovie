import type {
  IAutoMovieRecoveryAtlasObservationCreases,
  IAutoMovieRecoveryAtlasObservationInput,
  IAutoMovieRecoveryEventRegion,
  IAutoMovieRecoverySourceComponent,
} from "@automovie/interface";

/**
 * Observe original component crease edges with the existing oriented source
 * normals.
 */
export function RecoveryAtlasObservationCreases(
  context: Parameters<IAutoMovieRecoveryAtlasObservationCreases.Operation>[0],
): ReturnType<IAutoMovieRecoveryAtlasObservationCreases.Operation> {
  const {
    input,
    observed,
    component,
    sourceNormals,
    byRaw,
    mark,
    reason,
  }: {
    input: IAutoMovieRecoveryAtlasObservationInput;
    observed: IAutoMovieRecoveryEventRegion.Result;
    component: IAutoMovieRecoverySourceComponent;
    sourceNormals: number[][];
    byRaw: Map<string, string>;
    mark: (value: string) => void;
    reason: string | null;
  } = context;
  const creaseFaces: number[] = [];
  const featureEdges: {
    from: string;
    to: string;
    sourceEdge: string;
    sourceFaces: [number, number];
    angleDegrees: number;
  }[] = [];
  if (!reason) {
    const byEdge: Map<string, (typeof observed.occurrences)[number]> =
      new Map();
    for (const occurrence of observed.occurrences)
      if (occurrence.component === component.id) {
        const previous: typeof occurrence | undefined = byEdge.get(
          occurrence.edge,
        );
        if (!previous) {
          byEdge.set(occurrence.edge, occurrence);
          continue;
        }
        const a: number[] = sourceNormals[previous.face]!,
          b: number[] = sourceNormals[occurrence.face]!,
          sign: number =
            observed.cells[previous.cell]!.orientationFlip ===
            observed.cells[occurrence.cell]!.orientationFlip
              ? 1
              : -1;
        const denominator: number = Math.hypot(...a) * Math.hypot(...b),
          cosine: number =
            (sign *
              a.reduce(
                (sum: number, x: number, k: number): number => sum + x * b[k]!,
                0,
              )) /
            denominator;
        // An overflowing length product leaves the cosine unresolved.
        if (!(denominator > 0) || denominator === Infinity) {
          mark("source-crease-test-arithmetic-is-unresolved");
          continue;
        }
        const angleDegrees: number =
          (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI;
        if (angleDegrees >= input.cornerDegrees) {
          creaseFaces.push(previous.face, occurrence.face);
          featureEdges.push({
            from: byRaw.get(occurrence.from)!,
            to: byRaw.get(occurrence.to)!,
            sourceEdge: occurrence.edge,
            sourceFaces: [previous.face, occurrence.face],
            angleDegrees,
          });
        }
      }
  }

  return { creaseFaces, featureEdges };
}
