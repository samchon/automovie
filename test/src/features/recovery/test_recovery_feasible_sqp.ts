import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieSimplexAtom } from "../../../../packages/engine/src/math/IAutoMovieSimplexAtom";
import { createRecoveryFeasibleSqpArc } from "../../../../packages/recovery/src/internal/createRecoveryFeasibleSqpArc";
import { chooseRecoverySqpTightening } from "../../../../packages/recovery/src/internal/chooseRecoverySqpTightening";
import { mixRecoveryFeasibleSqpStep } from "../../../../packages/recovery/src/internal/mixRecoveryFeasibleSqpStep";
import { solveRecoveryFeasibleDirection } from "../../../../packages/recovery/src/internal/solveRecoveryFeasibleDirection";
import type { IAutoMovieRecoveryFeasibleModel } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleModel";
import type { IAutoMovieRecoverySqpArc } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoverySqpArc";
import type { IAutoMovieRecoverySqpOptions } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoverySqpOptions";
import type { IAutoMovieRecoverySqpTightening } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoverySqpTightening";
import { nclose } from "../internal/nclose";

/**
 * Original-design SQP support and same-base curvature have independent checks.
 *
 * Scenarios:
 * 1. An off-axis two-row system has z=[1,0,1], dual=[1,2], unchanged by row/coordinate permutations or exact zero-coordinate embedding.
 * 2. A negative equality dual and an omitted tighter inactive row cannot qualify the complete untilted QP.
 * 3. Empty, dependent and capacity/work-limited working spaces take their declared supported/refused branches without a normal success.
 * 4. A disk tangent trial fails before a negative-target correction, including a nondiagonal physical metric and an oversized correction refusal.
 * 5. Finite inputs whose physical dot overflows to NaN cannot receive a full affine certificate; bounded numerical mixing constructs a new strict vector instead of accepting a positive row error.
 * 6. Known diagonal-QP duals distinguish objective cap, original ceiling, structural zero and conditional row scaling; positive-price underflow and unresolved division supply no target.
 * 7. A known-curvature reference has a feasible cost-increasing mixed full; the capped same-factor correction has an independently derived target and actual feasible decrease. An RHS that absorbs its strict margin retains the valid mixed step but refuses correction.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual sparse direction primitive, thin working-space adapter and retained correction. Input ownership, preallocation and one-use correction are checked at their numerical boundary.
 * @evidence contracts/testing.md#independent-expectations Authored W*z=b and z+c+W^T*lambda=0 give the off-axis solution and rejection examples. Diagonal H with p=[0,.1], normal[1,0] and original dual1 gives closed scalar cap/ceiling values. Disk and curved-reference corrections use the authored inverse-H normal direction and independent physical f dot actual p, without using the target helper's output as an oracle. A single corrected descent is not a full-support or finite100 theorem.
 * @evidence contracts/testing.md#distinguishing-cases Separates equality estimates from complete affine-QP and nonlinear certificates, catches transpose/sign/permutation/scaling errors, and keeps every inactive row and hard disk. This is not photograph registration evidence.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_feasible_sqp entry uses maintained numerical functions and authored arrays, without filesystem, process, compiler, browser, installation or GPU.
 */
export function test_recovery_feasible_sqp(): void {
  const options: IAutoMovieRecoverySqpOptions = {
    maxSweeps: 64, minimumSingularRatio: 1e-8, maxEntries: 100000,
    maxResidentEntries: 100000, retainedEntries: 0, maxWork: 100000000,
  };
  const identity: (rows: IAutoMovieSimplexAtom[], width: number) => IAutoMovieRecoveryFeasibleModel = (
    rows: IAutoMovieSimplexAtom[], width: number,
  ): IAutoMovieRecoveryFeasibleModel => ({
    rows, physicalRows: rows, width,
    fromMetric: (value: readonly number[]): number[] => value.slice(),
    toPhysicalCovector: (value: readonly number[]): number[] => value.slice(),
  });
  const attempt: (model: IAutoMovieRecoveryFeasibleModel, change?: Partial<IAutoMovieRecoverySqpOptions>) => IAutoMovieRecoverySqpArc = (
    model: IAutoMovieRecoveryFeasibleModel, change?: Partial<IAutoMovieRecoverySqpOptions>,
  ): IAutoMovieRecoverySqpArc => {
    const direction: ReturnType<typeof solveRecoveryFeasibleDirection> = solveRecoveryFeasibleDirection(
      model.width, model.rows, 1e-8 * 1e-8,
      { maxIterations: 10000, maxEntries: 100000, maxWork: 100000000 }, (): void => {},
    );
    return createRecoveryFeasibleSqpArc(model, direction.multipliers, model.fromMetric(direction.step), 1e-8, { ...options, ...change }, (): void => {});
  };
  const rows: IAutoMovieSimplexAtom[] = [
    { indices: [0, 1, 2], values: [-2, -3, -3], offset: 0 },
    { indices: [0, 1], values: [1, 1], offset: 1 },
    { indices: [1, 2], values: [1, 1], offset: 1 },
  ];
  const base: IAutoMovieRecoveryFeasibleModel = identity(rows, 3);
  const before: string = JSON.stringify(base);
  const offAxis: IAutoMovieRecoverySqpArc = attempt(base);
  const rowPermutation: IAutoMovieRecoverySqpArc = attempt(identity([rows[0]!, rows[2]!, rows[1]!], 3));
  const permuted: IAutoMovieSimplexAtom[] = [
    { indices: [0, 1, 2], values: [-3, -2, -3], offset: 0 },
    { indices: [0, 1], values: [1, 1], offset: 1 },
    { indices: [0, 2], values: [1, 1], offset: 1 },
  ];
  const coordinatePermutation: IAutoMovieRecoverySqpArc = attempt(identity(permuted, 3));
  const embedded: IAutoMovieSimplexAtom[] = rows.map((row: IAutoMovieSimplexAtom): IAutoMovieSimplexAtom => ({
    indices: row.indices.map((at: number): number => at * 3 + 1), values: row.values.slice(), offset: row.offset,
  }));
  const embedding: IAutoMovieRecoverySqpArc = attempt(identity(embedded, 12));
  const negativeDual: IAutoMovieRecoverySqpArc = attempt(identity([
    { indices: [0], values: [-1], offset: 0 }, { indices: [0], values: [1], offset: 1.5 },
  ], 1));
  const omitted: IAutoMovieRecoverySqpArc = attempt(identity([
    { indices: [0], values: [-3], offset: 0 },
    { indices: [0], values: [1], offset: 2 }, { indices: [0], values: [100], offset: 100 },
  ], 1));
  const empty: IAutoMovieRecoverySqpArc = attempt(identity([{ indices: [0], values: [-0.1], offset: 0 }], 1));
  const dependent: IAutoMovieRecoverySqpArc = createRecoveryFeasibleSqpArc(identity([
    { indices: [0], values: [-1], offset: 0 },
    { indices: [0], values: [1], offset: 0 }, { indices: [0], values: [2], offset: 0 },
  ], 1), [0.5, 0.25, 0.25], [-0.1], 1e-8, options, (): void => {});
  let calls: number = 0, charged: number = 0;
  const limitedModel: IAutoMovieRecoveryFeasibleModel = {
    ...base, fromMetric: (value: readonly number[]): number[] => { calls++; return value.slice(); },
  };
  const capacity: IAutoMovieRecoverySqpArc = createRecoveryFeasibleSqpArc(limitedModel, [0.5, 0.25, 0.25], [0.1, 0.1, 0.1], 1e-8,
    { ...options, maxEntries: 1 }, (work: number): void => { charged += work; });
  const workLimited: IAutoMovieRecoverySqpArc = createRecoveryFeasibleSqpArc(base, [0.5, 0.25, 0.25], [0.1, 0.1, 0.1], 1e-8,
    { ...options, maxWork: 0 }, (): void => { throw new Error("unadmitted work"); });
  const M: number = 1e155, tiny: number = 1 / (2 * M);
  const overflow: IAutoMovieRecoverySqpArc = attempt({
    width: 2,
    rows: [{ indices: [0, 1], values: [0, -1], offset: 0 }, { indices: [0], values: [1], offset: 0 }],
    physicalRows: [{ indices: [0, 1], values: [-tiny, tiny], offset: 0 }, { indices: [0, 1], values: [M, M], offset: 0 }],
    fromMetric: (value: readonly number[]): number[] => [tiny * value[0]! + M * value[1]!, tiny * value[0]! - M * value[1]!],
    toPhysicalCovector: (value: readonly number[]): number[] => [M * value[0]! + tiny * value[1]!, M * value[0]! - tiny * value[1]!],
  });
  const mixtureRows: IAutoMovieSimplexAtom[] = [
    { indices: [1], values: [-1], offset: 0 }, { indices: [0], values: [1], offset: 0 },
  ];
  const supported: ReturnType<typeof mixRecoveryFeasibleSqpStep> = mixRecoveryFeasibleSqpStep(mixtureRows, [2e-16, 1e-4], [-1e-8, 5e-5], 1e-8);
  const scaledSupport: ReturnType<typeof mixRecoveryFeasibleSqpStep> = mixRecoveryFeasibleSqpStep([
    mixtureRows[0]!, { indices: [0], values: [2], offset: 0 },
  ], [2e-16, 1e-4], [-1e-8, 5e-5], 1e-8);
  const curvature: boolean[] = [0, 10, 1000].map((M: number): boolean => {
    const t: number = 0.01;
    const model: IAutoMovieRecoveryFeasibleModel = {
      width: 2,
      rows: [{ indices: [0, 1], values: [-1, -t], offset: 0 }, { indices: [0], values: [1], offset: 0 }],
      physicalRows: [{ indices: [0, 1], values: [-1 - M * t, -t], offset: 0 }, { indices: [0], values: [1], offset: 0 }],
      fromMetric: (value: readonly number[]): number[] => [value[0]!, value[1]! - M * value[0]!],
      toPhysicalCovector: (value: readonly number[]): number[] => [value[0]! + M * value[1]!, value[1]!],
    };
    const arc: IAutoMovieRecoverySqpArc = attempt(model);
    if (!arc.report.qualified || arc.step === null || arc.correct === null || arc.sqpStep === null) return false;
    const p: number[] = arc.step;
    const g: number = ((2 + p[0]!) ** 2 + p[1]! ** 2) / 4 - 1;
    const descent: number = -((-1 - M * t) * p[0]! - t * p[1]!);
    const expected: number = -g - Math.min(Math.hypot(...p) ** 2.5, Math.sqrt(t) * descent);
    const correction: number[] | null = arc.correct([g]);
    if (M === 1000) return correction === null && !arc.report.correctionSupported;
    if (correction === null) return false;
    const actual: number = ((2 + p[0]! + correction[0]!) ** 2 + (p[1]! + correction[1]!) ** 2) / 4 - 1;
    let repeated: boolean = false;
    try { arc.correct([g]); } catch (error: unknown) {
      repeated = error instanceof Error && error.message === "camera-sqp: one correction per base model required";
    }
    return g > 0 && actual < 0 && repeated && nclose(arc.sqpStep[0]!, 0, 1e-12) && nclose(arc.sqpStep[1]!, t, 1e-12) &&
      nclose(correction[0]!, expected, 1e-12) && nclose(correction[1]!, -M * expected, 1e-12);
  });
  const scalarRows: (gradient: number[], normal: number[]) => IAutoMovieSimplexAtom[] = (
    gradient: number[], normal: number[],
  ): IAutoMovieSimplexAtom[] => [
    { indices: gradient.map((_value: number, at: number): number => at), values: gradient, offset: 0 },
    { indices: normal.map((_value: number, at: number): number => at), values: normal, offset: 0 },
  ];
  const capRows: IAutoMovieSimplexAtom[] = scalarRows([-1, -0.01], [1, 0]);
  const capBefore: string = JSON.stringify(capRows);
  const capped: IAutoMovieRecoverySqpTightening = chooseRecoverySqpTightening(capRows, [1], [1], [0, 0.1], 0.1, 0.1);
  const ceiling: IAutoMovieRecoverySqpTightening = chooseRecoverySqpTightening(scalarRows([-1, -0.2], [1, 0]), [1], [1], [0, 0.1], 0.1, 0.1);
  const zeroPrice: IAutoMovieRecoverySqpTightening = chooseRecoverySqpTightening(scalarRows([0, -0.1], [1, 0]), [1], [0], [0, 0.1], 0.1, 0.1);
  const scaledPrice: IAutoMovieRecoverySqpTightening = chooseRecoverySqpTightening(scalarRows([-1, -0.01], [8, 0]), [1], [1 / 8], [0, 0.1], 0.1, 0.1);
  const underflowPrice: IAutoMovieRecoverySqpTightening = chooseRecoverySqpTightening(scalarRows([0, -0.01], [0.5, 0]), [1], [Number.MIN_VALUE], [0, 0.1], 0.1, 0.1);
  const underflowCap: IAutoMovieRecoverySqpTightening = chooseRecoverySqpTightening(scalarRows([-1e308, -1e-99], [1, 0]), [1], [1e308], [0, 0.1], 0.1, 0.1);
  const underflowCeiling: IAutoMovieRecoverySqpTightening = chooseRecoverySqpTightening(scalarRows([0, -1], [1, 0]), [1], [1], [0, 1e-200], 0.1, 1e-200);
  const overflowingNorm: IAutoMovieRecoverySqpTightening = chooseRecoverySqpTightening(scalarRows([-1, -1, -1, -1], [1e308, 1e308, 1e308, 1e308]), [1], [1], [0, 0, 0, 0.1], 0.1, 0.1);
  let invalidDual: boolean = false;
  try { chooseRecoverySqpTightening(capRows, [1], [-1], [0, 0.1], 0.1, 0.1); } catch (error: unknown) {
    invalidDual = error instanceof Error && error.message === "camera-sqp: ordered original correction dual required";
  }
  TestValidator.predicate("current dual prices the target without underflow becoming zero price",
    capped.reason === "objective-cap" && capped.value !== null && nclose(capped.value, 0.001 * Math.sqrt(0.1), 1e-14) &&
    nclose(capped.multiplierPrice!, 1, 1e-14) && nclose(capped.descent!, 0.001, 1e-14) &&
    ceiling.reason === "original-ceiling" && nclose(ceiling.value!, 0.1 ** 2.5, 1e-14) &&
    zeroPrice.reason === "zero-multiplier-price" && zeroPrice.multiplierPrice === 0 && nclose(zeroPrice.value!, 0.1 ** 2.5, 1e-14) &&
    scaledPrice.reason === "objective-cap" && nclose(scaledPrice.value!, capped.value!, 1e-14) &&
    underflowPrice.value === null && underflowPrice.multiplierPrice === null && underflowPrice.reason === "multiplier-price-unresolved" &&
    underflowCap.value === null && underflowCap.reason === "cap-unresolved" &&
    underflowCeiling.value === null && underflowCeiling.reason === "tightening-unresolved" &&
    overflowingNorm.value === null && overflowingNorm.reason === "multiplier-price-unresolved" && invalidDual && JSON.stringify(capRows) === capBefore,
  );

  const a: number = 0.5, beta: number = 1.998, t: number = 0.001, n: number = beta * t * t / 2;
  const hn: number = 1.001, ht: number = 1 - a * beta + 0.001;
  const scales: number[] = [Math.sqrt(hn), Math.sqrt(ht)];
  const referenceRows: IAutoMovieSimplexAtom[] = [
    { indices: [0, 1], values: [n - a, t], offset: 0 },
    { indices: [0, 1], values: [1, -beta * t], offset: 0 },
  ];
  const referenceBefore: string = JSON.stringify(referenceRows);
  const reference: IAutoMovieRecoveryFeasibleModel = {
    width: 2, physicalRows: referenceRows,
    rows: referenceRows.map((row: IAutoMovieSimplexAtom): IAutoMovieSimplexAtom => ({
      ...row, values: row.values.map((value: number, axis: number): number => value / scales[axis]!),
    })),
    fromMetric: (value: readonly number[]): number[] => value.map((entry: number, axis: number): number => entry / scales[axis]!),
    toPhysicalCovector: (value: readonly number[]): number[] => value.map((entry: number, axis: number): number => entry * scales[axis]!),
  };
  const referenceArc: IAutoMovieRecoverySqpArc = attempt(reference);
  let referenceCorrection: boolean = false;
  if (referenceArc.step !== null && referenceArc.correct !== null && referenceArc.sqpStep !== null) {
    const p: number[] = referenceArc.step;
    const pt: number = -(t + beta * t * (n - a)) / (ht + hn * beta * beta * t * t), pn: number = beta * t * pt;
    const multiplier: number = -(n - a) - hn * pn, rowNorm: number = Math.hypot(1, beta * t);
    const descent: number = -((n - a) * p[0]! + t * p[1]!);
    const expectedTarget: number = Math.min(Math.hypot(...p) ** 2.5, Math.sqrt(Math.hypot(pn, pt)) * descent / (multiplier * rowNorm));
    const trialG: number = n + p[0]! - beta * (t + p[1]!) * (t + p[1]!) / 2;
    const rhs: number = -trialG - rowNorm * expectedTarget, denominator: number = 1 / hn + (beta * t) ** 2 / ht;
    const expectedNormal: number = rhs / hn / denominator, expectedTangent: number = -beta * t * rhs / ht / denominator;
    const correction: number[] | null = referenceArc.correct([trialG]);
    if (correction !== null) {
      const nextN: number = n + p[0]! + correction[0]!, nextT: number = t + p[1]! + correction[1]!;
      const baseCost: number = ((n - a) ** 2 + t * t) / 2;
      referenceCorrection = trialG < 0 && ((n + p[0]! - a) ** 2 + (t + p[1]!) ** 2) / 2 > baseCost &&
        referenceArc.report.correctionTightening?.reason === "objective-cap" &&
        nclose(referenceArc.report.correctionTightening.value!, expectedTarget, 1e-14) &&
        nclose(correction[0]!, expectedNormal, 1e-12) && nclose(correction[1]!, expectedTangent, 1e-12) &&
        nextN - beta * nextT * nextT / 2 <= 0 && ((nextN - a) ** 2 + nextT * nextT) / 2 < baseCost;
    }
  }
  const absorbed: IAutoMovieRecoverySqpArc = attempt(reference), preservedStep: number[] | null = absorbed.step;
  const absentCorrection: number[] | null = absorbed.correct?.([-1e300]) ?? null;
  TestValidator.predicate("a priced same-factor correction retains actual gates and representable strict targets",
    referenceCorrection && JSON.stringify(referenceRows) === referenceBefore && absentCorrection === null &&
    absorbed.step === preservedStep && preservedStep !== null && absorbed.report.qualified &&
    absorbed.report.correctionAttempted && !absorbed.report.correctionSupported && absorbed.report.correctionFailure === "trial-target-unresolved",
  );
  TestValidator.predicate("original design, full affine certificate, resources and curvature are distinct",
    offAxis.report.qualified && offAxis.sqpStep !== null && offAxis.sqpStep.every((x: number, at: number): boolean => nclose(x, [1, 0, 1][at]!, 1e-10)) &&
    offAxis.multipliers.every((x: number, at: number): boolean => nclose(x, [1, 2][at]!, 1e-10)) &&
    rowPermutation.report.qualified && rowPermutation.sqpStep!.every((x: number, at: number): boolean => nclose(x, offAxis.sqpStep![at]!, 1e-10)) &&
    coordinatePermutation.report.qualified && coordinatePermutation.sqpStep!.every((x: number, at: number): boolean => nclose(x, offAxis.sqpStep![[1, 0, 2][at]!]!, 1e-10)) &&
    embedding.report.qualified && embedding.report.coordinates === 3 && embedding.sqpStep!.every((x: number, at: number): boolean => nclose(x, at === 1 || at === 7 ? 1 : 0, 1e-10)) &&
    !negativeDual.report.qualified && negativeDual.report.reason === "working-dual-or-step-unresolved" &&
    !omitted.report.qualified && omitted.report.reason === "full-affine-qp-unqualified" &&
    empty.report.qualified && empty.report.selectedRows === 0 && nclose(empty.sqpStep![0]!, 0.1, 1e-12) &&
    dependent.report.reason === "working-rows-dependent-or-wide" && !capacity.report.qualified && calls === 0 && charged === 24 &&
    workLimited.report.reason === "auxiliary-work-unavailable" && !overflow.report.qualified && overflow.report.reason === "full-affine-qp-unqualified" &&
    supported.numericalAttempted && supported.numericalSupported && supported.step !== null && supported.step[0]! < 0 && supported.step[1]! > 0 &&
    supported.weight > 2e-16 / (2e-16 + 1e-8) && supported.weight < 1 && scaledSupport.numericalSupported && nclose(scaledSupport.weight, supported.weight, 1e-14) &&
    [offAxis, rowPermutation, coordinatePermutation, embedding].every((arc: IAutoMovieRecoverySqpArc): boolean =>
      arc.report.equalityBeforeRefinement !== null && arc.report.equalityResidual! <= arc.report.equalityBeforeRefinement,
    ) && curvature.every((value: boolean): boolean => value) && JSON.stringify(base) === before,
  );
}
