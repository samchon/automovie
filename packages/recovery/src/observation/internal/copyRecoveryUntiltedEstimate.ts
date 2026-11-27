import type { IAutoMovieRecoveryUntiltedEstimate } from "@automovie/interface";

/*
 * Copy one selected model's borrowed original dual into fit-owned seed storage.
 */
export function copyRecoveryUntiltedEstimate(
  estimate: IAutoMovieRecoveryUntiltedEstimate | null,
  width: number,
  rowCount: number,
  charge: (work: number) => void,
): IAutoMovieRecoveryUntiltedEstimate | null {
  const count: number = estimate?.selected.length ?? 0;
  const work: number = 64 * (count + 1);
  if (width < 1 || rowCount < 1 || count < 0 || count >= rowCount)
    throw new Error(
      "camera-curvature: bounded borrowed selected count required",
    );
  charge(work);
  if (estimate === null) return null;
  if (
    estimate.width !== width ||
    estimate.rowCount !== rowCount ||
    estimate.multipliers.length !== count
  )
    throw new Error(
      "camera-curvature: unchanged original dual identity required",
    );
  const selected: number[] = [],
    multipliers: number[] = [];
  for (let at: number = 0; at < count; at++) {
    const id: number = estimate.selected[at]!,
      multiplier: number = estimate.multipliers[at]!;
    if (
      id < 1 ||
      id >= rowCount ||
      (at > 0 && id <= estimate.selected[at - 1]!) ||
      !(multiplier >= 0)
    )
      throw new Error(
        "camera-curvature: qualified ordered original dual required",
      );
    selected.push(id);
    multipliers.push(multiplier);
  }
  return { width, rowCount, selected, multipliers };
}
