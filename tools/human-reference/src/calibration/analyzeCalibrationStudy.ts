import type { CalibrationCoverage } from "./CalibrationCoverage.ts";
import type { CalibrationStudy } from "./CalibrationStudy.ts";
import { calibrationRank } from "./calibrationRank.ts";

/**
 * Measures dimension coverage and training-design rank without fitting skin.
 * Each model uses only complete training identities, standardizes its dimensions
 * on those rows and then forms the declared products. Reserved values contribute
 * only to range summaries. Rank constrains between-identity dimension effects;
 * many within-identity sections can constrain a curve basis but cannot supply
 * missing between-identity directions or independent validation identities.
 *
 * @evidence contracts/common.md#principled-implementation Rejects duplicate identity or source rows, preserves missing observations, reserves identities before forming centred training columns and reports residual degrees of freedom without claiming statistical independence.
 * @evidence contracts/common.md#clear-and-simple-design Produces descriptive ranges and explicit model ranks from scalar observations only; it neither fits coefficients nor generates or judges Human geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No private paths, identities, population bounds, inferred measurements or regularized full-rank substitutes are supplied.
 * @evidence contracts/common.md#meaningful-documentation States training-only normalization, complete-row policy, reserved-value use and the distinction between curve evidence and identity variation.
 * @evidence contracts/performance.md#efficient-algorithms For N identities and D dimensions, range preparation costs O(ND); each model with P features of at most K factors costs O(NPK) plus the documented rank operation, retaining scalar summaries and model-local matrices.
 * @evidence contracts/performance.md#reuse-equivalent-work Each model normalizes its referenced dimensions once on its own complete-row subset and reuses those columns for product features; no cross-run cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All arrays are bounded by supplied identities, dimensions and models, with result ownership transferred to the caller; no file, process or network handles are acquired.
 */
export function analyzeCalibrationStudy(
  study: CalibrationStudy,
): CalibrationCoverage {
  if (study.schema !== "human-calibration-study-v1")
    throw new Error("Unsupported calibration study");
  const ids: Set<string> = new Set<string>();
  const hashes: Set<string> = new Set<string>();
  const dimensions: Set<string> = new Set<string>();
  for (const dimension of study.dimensions) {
    if (
      !dimension.id ||
      !dimension.unit ||
      !dimension.protocol ||
      dimensions.has(dimension.id)
    )
      throw new Error(
        "Dimensions require unique identifiers, units and protocols",
      );
    dimensions.add(dimension.id);
  }
  for (const identity of study.identities) {
    if (
      !identity.id ||
      ids.has(identity.id) ||
      hashes.has(identity.sourceSha256.toLowerCase()) ||
      !/^[a-f0-9]{64}$/i.test(identity.sourceSha256)
    )
      throw new Error("Identities and canonical source hashes must be unique");
    if (identity.role !== "training" && identity.role !== "reserved")
      throw new Error("Identity role must be explicit");
    ids.add(identity.id);
    hashes.add(identity.sourceSha256.toLowerCase());
    for (const [id, value] of Object.entries(identity.values))
      if (!dimensions.has(id) || !Number.isFinite(value))
        throw new Error("Unknown or non-finite measurement");
  }
  const training: CalibrationStudy["identities"] = study.identities.filter(
    (identity: CalibrationStudy["identities"][number]): boolean =>
      identity.role === "training",
  );
  const cutoff: number = 1e-10;
  const modelIds: Set<string> = new Set<string>();
  return {
    distinctIdentities: ids.size,
    trainingIdentities: training.length,
    reservedIdentities: study.identities.length - training.length,
    dimensions: study.dimensions.map(
      (
        dimension: CalibrationStudy["dimensions"][number],
      ): CalibrationCoverage["dimensions"][number] => {
        const values: number[] = study.identities.flatMap(
          (identity: CalibrationStudy["identities"][number]): number[] =>
            identity.values[dimension.id] === undefined
              ? []
              : [identity.values[dimension.id]!],
        );
        const trainingValues: number[] = training.flatMap(
          (identity: CalibrationStudy["identities"][number]): number[] =>
            identity.values[dimension.id] === undefined
              ? []
              : [identity.values[dimension.id]!],
        );
        return {
          id: dimension.id,
          unit: dimension.unit,
          observed: values.length,
          missing: study.identities
            .filter(
              (identity: CalibrationStudy["identities"][number]): boolean =>
                identity.values[dimension.id] === undefined,
            )
            .map(
              (identity: CalibrationStudy["identities"][number]): string =>
                identity.id,
            ),
          minimum: values.length ? Math.min(...values) : null,
          maximum: values.length ? Math.max(...values) : null,
          trainingMinimum: trainingValues.length
            ? Math.min(...trainingValues)
            : null,
          trainingMaximum: trainingValues.length
            ? Math.max(...trainingValues)
            : null,
        };
      },
    ),
    models: study.models.map(
      (
        model: CalibrationStudy["models"][number],
      ): CalibrationCoverage["models"][number] => {
        if (!model.id || modelIds.has(model.id) || !model.features.length)
          throw new Error(
            "Models need unique identifiers and explicit features",
          );
        modelIds.add(model.id);
        const needed: string[] = [...new Set<string>(model.features.flat())];
        if (needed.some((id: string): boolean => !dimensions.has(id)))
          throw new Error("Model refers to an undeclared dimension");
        const rows: CalibrationStudy["identities"] = training.filter(
          (identity: CalibrationStudy["identities"][number]): boolean =>
            needed.every(
              (id: string): boolean => identity.values[id] !== undefined,
            ),
        );
        const rowIds: Set<string> = new Set<string>(
          rows.map(
            (identity: CalibrationStudy["identities"][number]): string =>
              identity.id,
          ),
        );
        const standardized: Map<string, number[]> = new Map<string, number[]>();
        const zeroVariationDimensions: string[] = [];
        for (const id of needed) {
          const mean: number = rows.length
            ? rows.reduce(
                (
                  sum: number,
                  identity: CalibrationStudy["identities"][number],
                ): number => sum + identity.values[id]!,
                0,
              ) / rows.length
            : 0;
          const centred: number[] = rows.map(
            (identity: CalibrationStudy["identities"][number]): number =>
              identity.values[id]! - mean,
          );
          const norm: number = Math.hypot(...centred);
          if (norm === 0) zeroVariationDimensions.push(id);
          standardized.set(
            id,
            centred.map((value: number): number => (norm ? value / norm : 0)),
          );
        }
        const columns: number[][] = model.features.map(
          (feature: string[]): number[] => {
            const values: number[] = rows.map(
              (
                _identity: CalibrationStudy["identities"][number],
                index: number,
              ): number =>
                feature.reduce(
                  (product: number, id: string): number =>
                    product * standardized.get(id)![index]!,
                  1,
                ),
            );
            const norm: number = Math.hypot(...values);
            return values.map((value: number): number =>
              norm ? value / norm : 0,
            );
          },
        );
        const rank: number = calibrationRank(columns, cutoff);
        return {
          id: model.id,
          trainingRows: rows.map(
            (identity: CalibrationStudy["identities"][number]): string =>
              identity.id,
          ),
          omittedTrainingRows: training
            .filter(
              (identity: CalibrationStudy["identities"][number]): boolean =>
                !rowIds.has(identity.id),
            )
            .map(
              (identity: CalibrationStudy["identities"][number]): string =>
                identity.id,
            ),
          featureCount: columns.length,
          rank,
          nullity: columns.length - rank,
          residualDegreesOfFreedom: rows.length - rank,
          numericalCutoff: cutoff,
          zeroVariationDimensions,
        };
      },
    ),
  };
}
