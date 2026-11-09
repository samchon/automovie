import type { RecoveryAtlasObservationTypes } from "./RecoveryAtlasObservationTypes";

type Input = RecoveryAtlasObservationTypes["Input"];

type Observed = RecoveryAtlasObservationTypes["Observed"];
type Component = RecoveryAtlasObservationTypes["Component"];
type Feature = RecoveryAtlasObservationTypes["Feature"];

/**
 * Observe original component crease edges with the existing oriented source normals.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The same occurrence pairs, orientation parity and cosine arithmetic produce unchanged feature witnesses and first failure.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/development/implementation.md#efficient-algorithms Visits the component occurrences with the original edge lookup map.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses source normals computed once by the observation orchestrator.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only crease witnesses escape; the edge pairing map is component-local.
 */
export function RecoveryAtlasObservationCreases(context: {
  input: Input;
  observed: Observed;
  component: Component;
  sourceNormals: number[][];
  byRaw: Map<string, string>;
  mark: (value: string) => void;
  reason: string | null;
}): { creaseFaces: number[]; featureEdges: Feature[] } {
  const {
    input,
    observed,
    component,
    sourceNormals,
    byRaw,
    mark,
    reason,
  }: {
    input: Input;
    observed: Observed;
    component: Component;
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
        if (
          !(denominator > 0 && Number.isFinite(denominator)) ||
          !Number.isFinite(cosine)
        ) {
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
