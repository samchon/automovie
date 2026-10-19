import {
  type IAutoMovieCurve64 as C,
  AutoMovieBernstein64 as S,
} from "@automovie/engine/geometry/curve";

import type { IRecoveryChartLeafFit } from "./IRecoveryChartLeafFit";
import type { RecoveryBezierFit as F } from "./RecoveryBezierFit";
import { RecoveryChartAreaObservations as A } from "./RecoveryChartAreaObservations";
import { RecoveryChartCollar as L } from "./RecoveryChartCollar";
import { RecoveryChartFit as J } from "./RecoveryChartFit";
import { RecoveryChartLeafControls as K } from "./RecoveryChartLeafControls";
import { RecoveryChartRefinementClosure as E } from "./RecoveryChartRefinementClosure";
import { prepareRecoveryChartLeafBoundary } from "./prepareRecoveryChartLeafBoundary";

/**
 * Fit a boundary collar with affine hanging-control constraints against private PL observations.
 * Each leaf is an axis-aligned UV rectangle, so clipping and local coordinates preserve
 * the physical-area polynomial objective. Adaptive attempts split residual-marked leaves at their observed UV locations and close
 * opposed interface intervals. Exhausted or incompatible attempts retain the previous field.
 * Returned edge identities are coefficient relations, not source topology or G1 claims.
 * Optional physical-gradient observations change the declared fitting objective.
 * Their millimetre exchange length scales with physical units. Refinement retains
 * the preceding candidate unless the combined objective improves without worsening
 * its original physical-area position RMS. Every attempt reuses the initial coefficient
 * enclosure; restricting a boundary cubic cannot silently shrink the feasible box.
 * Point fallback supplies no gradient fit.
 *
 * @evidence contracts/common.md#principled-implementation A covering collar replaces the opposite-side tensor product. Acyclic de Casteljau relations eliminate hanging coefficients before solving the unchanged physical-area least-squares objective.
 * @evidence contracts/common.md#clear-and-simple-design Partition, control relations, private quadrature and constrained fitting have separate owners; this operation composes them and retains the best complete area candidate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source triangles are observations only. No sampled surface supplies target points, no enclosure clamp repairs dependent coefficients, and point fallback cannot replace an earlier area fit.
 * @evidence contracts/common.md#meaningful-documentation States affine charts, local refinement, failure retention, boundary authority, physical units and independent numerical and surface qualifications.
 * @evidence contracts/performance.md#efficient-algorithms P leaves allocate at most 16P coefficient addresses. Each attempt clips T source triangles against P rectangles and admits at most maxObservationRows rows; reduced sparse least squares has the fitter's explicit term and iteration budgets.
 * @evidence contracts/performance.md#reuse-equivalent-work Immutable boundary curves and harmonic correspondences serve all attempts. An unsuccessful refinement retains prior coefficients instead of recomputing or substituting source geometry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most two bounded coefficient candidates and one attempt's private rows coexist. All source references and work maps expire on return; only coefficients, analytic edge relations and scalar diagnostics escape.
 */
export function RecoveryChartLeafFit(
  input: IRecoveryChartLeafFit.Input,
): IRecoveryChartLeafFit.Result {
  const splits: NonNullable<Parameters<typeof L>[0]["splits"]>[number][] = [],
    residualsMm: number[] = [],
    areaRmsMm: (number | null)[] = [],
    attemptedPatches: number[] = [];
  let previous: ReturnType<typeof RecoveryChartLeafFit> | undefined,
    retainedEnclosureMm: J.Input["enclosureMm"] | undefined;
  for (let round: number = 0; ; round++)
    try {
      const layout: ReturnType<typeof L> = L({
        knots: input.knots,
        maxLeaves: input.maxPatches,
        splits,
      });
      const registry: ReturnType<typeof K> = K({
        leaves: layout.leaves,
        maxControls: 16 * input.maxPatches,
      });
      const patches: { id: string; controlIds: number[] }[] =
        registry.patches.map(
          (
            patch: ReturnType<typeof K>["patches"][number],
          ): { id: string; controlIds: number[] } => ({
            id: `${input.name}.${patch.id}`,
            controlIds: patch.controlIds,
          }),
        );
      const controls: (C.Vector | null)[] = prepareRecoveryChartLeafBoundary(
        input,
        registry,
      );
      let initialControlsMm: C.Vector[] | undefined,
        prolongationDifferenceMm: number = 0;
      if (previous) {
        const values: (C.Vector | null)[] = new Array(registry.controls).fill(
          null,
        );
        for (let index: number = 0; index < layout.leaves.length; index++) {
          const bounds: readonly number[] = layout.leaves[index]!.bounds;
          const old: number = previous.leafLayout.leaves.findIndex(
            (leaf: (typeof layout.leaves)[number]): boolean =>
              bounds[0]! >= leaf.bounds[0] &&
              bounds[1]! <= leaf.bounds[1] &&
              bounds[2]! >= leaf.bounds[2] &&
              bounds[3]! <= leaf.bounds[3],
          );
          if (old < 0)
            throw new Error(
              "A refinement leaf is not contained in its retained predecessor",
            );
          const source: (typeof layout.leaves)[number] =
            previous.leafLayout.leaves[old]!;
          const u: number[] = [bounds[0]!, bounds[1]!].map(
            (q: number): number =>
              (q - source.bounds[0]) / (source.bounds[1] - source.bounds[0]),
          );
          const v: number[] = [bounds[2]!, bounds[3]!].map(
            (q: number): number =>
              (q - source.bounds[2]) / (source.bounds[3] - source.bounds[2]),
          );
          const rows: [number, number, number][][] = Array.from(
            { length: 4 },
            (_: unknown, j: number): [number, number, number][] =>
              S.restrict(
                Array.from(
                  { length: 4 },
                  (_: unknown, i: number): [number, number, number] =>
                    [
                      ...previous!.controlsMm[
                        previous!.patches[old]!.controlIds[4 * j + i]!
                      ]!,
                    ] as [number, number, number],
                ),
                u[0]!,
                u[1]!,
              ),
          );
          for (let i: number = 0; i < 4; i++) {
            const column: [number, number, number][] = S.restrict(
              rows.map(
                (row: [number, number, number][]): [number, number, number] =>
                  row[i]!,
              ),
              v[0]!,
              v[1]!,
            );
            for (let j: number = 0; j < 4; j++) {
              const id: number = patches[index]!.controlIds[4 * j + i]!,
                point: C.Vector = column[j]!,
                prior: C.Vector | null = values[id]!;
              if (prior)
                prolongationDifferenceMm = Math.max(
                  prolongationDifferenceMm,
                  Math.hypot(
                    ...point.map(
                      (x: number, k: number): number => x - prior[k]!,
                    ),
                  ),
                );
              else values[id] = point;
            }
          }
        }
        initialControlsMm = values.map(
          (point: C.Vector | null, id: number): C.Vector => {
            const value: C.Vector | null = controls[id] ?? point;
            if (!value)
              throw new Error("A prolonged coefficient has no predecessor");
            return value;
          },
        );
      }
      const locate: (uv: readonly number[]) => number = (
        uv: readonly number[],
      ): number => {
        const found: number = layout.leaves.findIndex(
          (leaf: ReturnType<typeof L>["leaves"][number]): boolean =>
            uv[0]! >= leaf.bounds[0] &&
            uv[0]! <= leaf.bounds[1] &&
            uv[1]! >= leaf.bounds[2] &&
            uv[1]! <= leaf.bounds[3],
        );
        if (found < 0)
          throw new Error(
            "A private correspondence lies outside the covering collar",
          );
        return found;
      };
      const observations: J.Input["observations"][number][] = [];
      const add: (
        uv: readonly number[],
        pointMm: C.Vector,
        weight: number,
      ) => void = (
        uv: readonly number[],
        pointMm: C.Vector,
        weight: number,
      ): void => {
        const patch: number = locate(uv),
          r: readonly number[] = layout.leaves[patch]!.bounds;
        observations.push({
          patch,
          u: (uv[0]! - r[0]!) / (r[1]! - r[0]!),
          v: (uv[1]! - r[2]!) / (r[3]! - r[2]!),
          pointMm,
          weight,
        });
      };
      const weights: Float64Array = new Float64Array(input.verticesMm.length);
      let sourceAreaMm2: number = 0;
      for (const t of input.triangles) {
        const a: C.Vector = input.verticesMm[t[0]]!,
          b: C.Vector = input.verticesMm[t[1]]!,
          c: C.Vector = input.verticesMm[t[2]]!;
        const x: number[] = b.map(
            (value: number, k: number): number => value - a[k]!,
          ),
          y: number[] = c.map(
            (value: number, k: number): number => value - a[k]!,
          );
        const area: number =
          Math.hypot(
            x[1]! * y[2]! - x[2]! * y[1]!,
            x[2]! * y[0]! - x[0]! * y[2]!,
            x[0]! * y[1]! - x[1]! * y[0]!,
          ) / 2;
        if (!(area > 0 && Number.isFinite(area)))
          throw new Error("Positive private source triangles are required");
        sourceAreaMm2 += area;
        for (const id of t) weights[id] += area / 3;
        add(
          [0, 1].map(
            (k: number): number =>
              t.reduce(
                (sum: number, id: number): number =>
                  sum + input.parameters[id]![k]!,
                0,
              ) / 3,
          ),
          [0, 1, 2].map((k: number): number => (a[k]! + b[k]! + c[k]!) / 3) as [
            number,
            number,
            number,
          ],
          area,
        );
      }
      input.verticesMm.forEach((point: C.Vector, id: number): void => {
        if (weights[id]! > 0) add(input.parameters[id]!, point, weights[id]!);
      });
      const all: C.Vector[] = [
        ...input.verticesMm,
        ...controls.filter((p: C.Vector | null): p is C.Vector => p !== null),
      ];
      const lower: C.Vector = [0, 1, 2].map((k: number): number =>
        all.reduce(
          (x: number, p: C.Vector): number => Math.min(x, p[k]!),
          Infinity,
        ),
      ) as [number, number, number];
      const upper: C.Vector = [0, 1, 2].map((k: number): number =>
        all.reduce(
          (x: number, p: C.Vector): number => Math.max(x, p[k]!),
          -Infinity,
        ),
      ) as [number, number, number];
      // The initial problem owns the box; restricted boundary hulls cannot shrink it.
      retainedEnclosureMm ??= { lower, upper };
      let area: ReturnType<typeof A> | undefined,
        reason: string | null = null;
      try {
        area = A({
          verticesMm: input.verticesMm,
          triangles: input.triangles,
          parameters: input.parameters,
          u: [0, 1],
          v: [0, 1],
          rectangles: layout.leaves.map(
            (
              leaf: ReturnType<typeof L>["leaves"][number],
            ): [number, number, number, number] => leaf.bounds,
          ),
          maxObservations: input.maxObservationRows,
          physicalGradientLengthMm: input.physicalGradientLengthMm,
        });
      } catch (failure: unknown) {
        reason = failure instanceof Error ? failure.message : String(failure);
      }
      const joint: J.Result = J.fit({
        controls,
        patches: patches.map(
          (
            patch: (typeof patches)[number],
            index: number,
          ): J.Input["patches"][number] => ({
            ...patch,
            parameterBounds: layout.leaves[index]!.bounds,
          }),
        ),
        relations: registry.relations,
        relationBudget: { maxTerms: 256, maxDepth: 64 },
        observations: area?.observations ?? observations,
        validation: observations,
        initialControlsMm,
        enclosureMm: retainedEnclosureMm,
        toleranceMm: input.toleranceMm,
        gradientTolerance: 1e-10,
        maxIterations: input.maxIterations,
      });
      if (previous)
        joint.diagnostics.push(
          `Previous field initialized by tensor de Casteljau restriction; maximum duplicate-owner binary64 differenceMm=${prolongationDifferenceMm}; initialization is not an exact-arithmetic certificate`,
        );
      if (reason) {
        joint.qualified = false;
        joint.diagnostics.push(
          `Area rows unavailable; retained point-fit candidate: ${reason}`,
        );
      }
      residualsMm.push(joint.maximumMm);
      areaRmsMm.push(area ? joint.rmsMm : null);
      attemptedPatches.push(patches.length);
      const { controls: controlsMm, ...report }: J.Result = joint;
      const candidate: ReturnType<typeof RecoveryChartLeafFit> = {
        controlsMm,
        patches,
        qualified:
          input.curves.every(
            (curve: F.Result): boolean => curve.toleranceMet,
          ) && joint.qualified,
        joint: report,
        leafLayout: {
          leaves: layout.leaves,
          edges: registry.edges,
          bindings: registry.bindings.map(
            (
              binding: ReturnType<typeof K>["bindings"][number],
            ): ReturnType<typeof K>["bindings"][number] => ({
              ...binding,
              patch: `${input.name}.${binding.patch}`,
            }),
          ),
        },
        areaObservation: {
          qualified: area !== undefined,
          rows: area?.observations.length ?? observations.length,
          sourceAreaMm2,
          quadratureMinimumRows: 49 * input.triangles.length,
          integratedAreaMm2: area?.integratedAreaMm2 ?? null,
          maximumRelativeAreaDiscrepancy:
            area?.maximumRelativeAreaDiscrepancy ?? null,
          reason,
        },
        refinement: {
          rounds: round,
          reason: joint.qualified
            ? "requested-observation-residual-met"
            : "collar-fit-unqualified",
          residualsMm: [...residualsMm],
          areaRmsMm: [...areaRmsMm],
          attemptedPatches: [...attemptedPatches],
        },
      };
      if (
        previous &&
        (!area ||
          joint.rmsMm > previous.joint.rmsMm ||
          joint.objectiveRmsMm >= previous.joint.objectiveRmsMm)
      ) {
        previous.refinement = {
          ...candidate.refinement,
          reason:
            "local-refinement-did-not-improve-declared-objective-without-area-regression",
        };
        return previous;
      }
      const deficient: boolean =
        (joint.observationRank !== null &&
          joint.observationRank < joint.unknownControls) ||
        (joint.dataRowRank !== null &&
          joint.dataRowRank < joint.unknownControls);
      if (
        !area ||
        joint.freeSupportMaximumMm <= input.toleranceMm ||
        deficient ||
        joint.unsupportedControls > 0 ||
        joint.optimality.physicalObjectiveGapUpperMm2 >
          input.toleranceMm ** 2 ||
        round >= input.maxRefinements
      )
        return candidate;
      let planned: typeof layout.leaves = layout.leaves;
      const wave: typeof splits = [];
      const marked: number[] = patches
        .map((_: (typeof patches)[number], i: number): number => i)
        .filter(
          (i: number): boolean =>
            joint.patchFreeSupportMaximumMm[i]! > input.toleranceMm,
        )
        .sort(
          (a: number, b: number): number =>
            joint.patchFreeSupportMaximumMm[b]! -
              joint.patchFreeSupportMaximumMm[a]! || a - b,
        );
      for (const index of marked) {
        const original: (typeof layout.leaves)[number] = layout.leaves[index]!,
          location: [number, number] | null =
            joint.patchMaximumLocations[index]!;
        if (!location) continue;
        let trial: typeof planned = planned;
        const additions: typeof splits = [];
        try {
          for (const axis of [0, 1] as const) {
            const phase: number =
              original.bounds[2 * axis]! +
              location[axis] *
                (original.bounds[2 * axis + 1]! - original.bounds[2 * axis]!);
            const affected: typeof planned = trial.filter(
              (leaf: (typeof planned)[number]): boolean =>
                leaf.bounds[0] >= original.bounds[0] &&
                leaf.bounds[1] <= original.bounds[1] &&
                leaf.bounds[2] >= original.bounds[2] &&
                leaf.bounds[3] <= original.bounds[3] &&
                phase > leaf.bounds[2 * axis]! &&
                phase < leaf.bounds[2 * axis + 1]!,
            );
            for (const leaf of affected) {
              if (
                !trial.some(
                  (current: (typeof trial)[number]): boolean =>
                    current.id === leaf.id,
                )
              )
                continue;
              const closed: ReturnType<typeof E> = E({
                leaves: trial,
                request: { leaf: leaf.id, axis, parameter: phase },
                maxLeaves: input.maxPatches,
              });
              trial = closed.leaves;
              additions.push(
                ...closed.splits.map(
                  (
                    split: (typeof closed.splits)[number],
                  ): (typeof splits)[number] => ({
                    leaf: split.leaf,
                    axis: split.axis,
                    parameter: split.parameter,
                  }),
                ),
              );
            }
          }
          planned = trial;
          wave.push(...additions);
        } catch (error: unknown) {
          joint.diagnostics.push(
            `Residual split and interface closure rejected atomically: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      if (!wave.length) {
        candidate.refinement.reason = "no-residual-split-closure-within-budget";
        return candidate;
      }
      previous = candidate;
      splits.push(...wave);
    } catch (failure: unknown) {
      if (!previous) throw failure;
      previous.refinement = {
        rounds: round,
        reason:
          "local-refinement-closure-or-budget-failed-prior-area-best-retained",
        residualsMm: [...residualsMm],
        areaRmsMm: [...areaRmsMm],
        attemptedPatches: [...attemptedPatches],
      };
      previous.joint.diagnostics.push(
        `Local refinement failed atomically: ${failure instanceof Error ? failure.message : String(failure)}`,
      );
      return previous;
    }
}
