import type { IAutoMovieSimplexAtom } from "@automovie/interface";

/** Validate owned sparse physical-row metadata before optional arithmetic. */
export function validateRecoveryMapMetricRow(
  row: IAutoMovieSimplexAtom,
  width: number,
): void {
  if (width < 1 || row.indices.length !== row.values.length)
    throw new Error(
      "camera-feasible: matching finite metric row ownership required",
    );
  for (let at: number = 0; at < row.indices.length; at++) {
    const axis: number = row.indices[at]!;
    if (axis < 0 || axis >= width || (at > 0 && axis <= row.indices[at - 1]!))
      throw new Error(
        "camera-feasible: ordered finite physical metric row required",
      );
  }
}
