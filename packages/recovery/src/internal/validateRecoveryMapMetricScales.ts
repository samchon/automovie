/** Validate every original column scale, including sparse-array holes. */
export function validateRecoveryMapMetricScales(
  cameraScales: readonly number[],
  pointScales: readonly (readonly number[])[],
): void {
  if (cameraScales.length < 1)
    throw new Error(
      "camera-feasible: matching positive original scales required",
    );
  for (let axis: number = 0; axis < cameraScales.length; axis++)
    if (!(cameraScales[axis]! > 0))
      throw new Error(
        "camera-feasible: matching positive original scales required",
      );
  for (let point: number = 0; point < pointScales.length; point++) {
    const row: readonly number[] | undefined = pointScales[point];
    if (row?.length !== 3)
      throw new Error(
        "camera-feasible: matching positive original scales required",
      );
    for (let axis: number = 0; axis < 3; axis++)
      if (!(row[axis]! > 0))
        throw new Error(
          "camera-feasible: matching positive original scales required",
        );
  }
}
