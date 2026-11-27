import { AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryMapElimination,
  IAutoMovieRecoveryMapJointBlock,
  IAutoMovieRecoveryMapJointPreparation,
} from "@automovie/interface";

/*
 * Prepare original point qualification and one current scaled block design.
 */
export function prepareRecoveryMapJointBlocks(
  blocks: readonly IAutoMovieRecoveryMapJointBlock[],
  minimumRatio: number,
  budget: IAutoMovieRecoveryCameraMapBudget,
  measureGradient: boolean,
): IAutoMovieRecoveryMapJointPreparation {
  const totalRows: number = blocks.reduce(
    (sum: number, block: (typeof blocks)[number]): number =>
      sum + block.right.length,
    0,
  );
  const cameraWidth: number = blocks[0]?.cameraRows[0]?.length ?? 0;
  const localWidth: number = cameraWidth + 4;
  const maximumLocalEntries: number =
    blocks.reduce(
      (maximum: number, block: (typeof blocks)[number]): number =>
        Math.max(maximum, block.right.length + 3),
      totalRows,
    ) * localWidth;
  const maximumReducedEntries: number =
    (totalRows + 2 * cameraWidth) * cameraWidth;
  if (
    blocks.length < 1 ||
    cameraWidth < 1 ||
    maximumLocalEntries > budget.maxLinearEntries ||
    maximumReducedEntries > budget.maxLinearEntries
  )
    throw new Error("camera-map: bounded joint blocks required");
  const cameraScales: number[] = new Array<number>(cameraWidth).fill(0);
  const pointScales: number[][] = [];
  let minimumPointDesignRatio: number = Infinity,
    gradient: number = 0;
  for (const block of blocks) {
    if (
      block.right.length < 4 ||
      block.right.length % 2 !== 0 ||
      block.pointRows.length !== block.right.length ||
      block.cameraRows.length !== block.right.length
    )
      throw new Error(
        "camera-map: at least two complete observations per landmark required",
      );
    const scales: number[] = [0, 0, 0];
    for (let row: number = 0; row < block.right.length; row++) {
      if (
        block.pointRows[row]!.length !== 3 ||
        block.cameraRows[row]!.length !== cameraWidth
      )
        throw new Error(
          "camera-map: finite point/camera Jacobian blocks required",
        );
      for (let column: number = 0; column < 3; column++)
        scales[column] = Math.hypot(
          scales[column]!,
          block.pointRows[row]![column]!,
        );
      for (let column: number = 0; column < cameraWidth; column++)
        cameraScales[column] = Math.hypot(
          cameraScales[column]!,
          block.cameraRows[row]![column]!,
        );
    }
    if (scales.some((value: number): boolean => !(value > 0)))
      throw new Error("camera-map: unresolved landmark direction");
    const pointRows: number[][] = block.pointRows.map(
      (row: number[]): number[] =>
        row.map((value: number, at: number): number => value / scales[at]!),
    );
    const factors: ReturnType<typeof AutoMovieEngineMath.decomposeSingularMatrix> =
      AutoMovieEngineMath.decomposeSingularMatrix(pointRows, {
        maxEntries: budget.maxLinearEntries,
        maxSweeps: budget.maxSingularSweeps,
        orthogonalityTolerance: 1e-12,
      });
    const ratio: number =
      factors.singularValues[2]! / factors.singularValues[0]!;
    if (!(ratio >= minimumRatio))
      throw new Error("camera-map: rank-degenerate landmark block");
    minimumPointDesignRatio = Math.min(minimumPointDesignRatio, ratio);
    if (measureGradient) {
      for (let column: number = 0; column < 3; column++)
        gradient = Math.max(
          gradient,
          Math.abs(
            pointRows.reduce(
              (sum: number, row: number[], at: number): number =>
                sum + row[column]! * block.right[at]!,
              0,
            ),
          ),
        );
    }
    pointScales.push(scales);
  }
  if (cameraScales.some((value: number): boolean => !(value > 0)))
    throw new Error("camera-map: unresolved joint camera direction");
  if (measureGradient) {
    for (let column: number = 0; column < cameraWidth; column++) {
      let component: number = 0;
      for (const block of blocks)
        for (let row: number = 0; row < block.right.length; row++)
          component +=
            (block.cameraRows[row]![column]! / cameraScales[column]!) *
            block.right[row]!;
      gradient = Math.max(gradient, Math.abs(component));
    }
  }
  const eliminate: (amount: number) => IAutoMovieRecoveryMapElimination = (
    amount: number,
  ): IAutoMovieRecoveryMapElimination => {
    if (!(amount >= 0))
      throw new Error(
        "camera-map: admitted finite elimination damping required",
      );
    const reduced: number[][] = [],
      right: number[] = [],
      triangular: number[][][] = [];
    for (let at: number = 0; at < blocks.length; at++) {
      const block: (typeof blocks)[number] = blocks[at]!;
      const rows: number[][] = block.right.map(
        (value: number, row: number): number[] => [
          ...block.pointRows[row]!.map(
            (entry: number, column: number): number =>
              entry / pointScales[at]![column]!,
          ),
          ...block.cameraRows[row]!.map(
            (entry: number, column: number): number =>
              entry / cameraScales[column]!,
          ),
          value,
        ],
      );
      if (amount > 0)
        for (let column: number = 0; column < 3; column++)
          rows.push(
            Array.from(
              { length: localWidth },
              (_: unknown, index: number): number =>
                index === column ? Math.sqrt(amount) : 0,
            ),
          );
      for (let column: number = 0; column < 3; column++)
        for (let row: number = rows.length - 1; row > column; row--) {
          const a: number = rows[column]![column]!,
            b: number = rows[row]![column]!;
          if (b === 0) continue;
          const norm: number = Math.hypot(a, b),
            cosine: number = a / norm,
            sine: number = b / norm;
          for (let index: number = column; index < localWidth; index++) {
            const first: number = rows[column]![index]!,
              second: number = rows[row]![index]!;
            rows[column]![index] = cosine * first + sine * second;
            rows[row]![index] = -sine * first + cosine * second;
          }
        }
      triangular.push(rows.slice(0, 3));
      for (const row of rows.slice(3)) {
        reduced.push(row.slice(3, 3 + cameraWidth));
        right.push(row[3 + cameraWidth]!);
      }
    }
    if (amount > 0)
      for (let row: number = 0; row < cameraWidth; row++) {
        reduced.push(
          Array.from(
            { length: cameraWidth },
            (_: unknown, column: number): number =>
              column === row ? Math.sqrt(amount) : 0,
          ),
        );
        right.push(0);
      }
    return { rows: reduced, right, triangular };
  };
  return {
    cameraWidth,
    cameraScales,
    pointScales,
    minimumPointDesignRatio,
    gradient: measureGradient ? gradient : null,
    eliminate,
  };
}
