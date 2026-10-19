import type { IAutoMovieContourLoft64 as L } from "../../../../packages/engine/src/geometry/curve/IAutoMovieContourLoft64.ts";
import type { IAutoMovieCurve64 as C } from "../../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";
import { contourStripOracle as O } from "../internal/contourStripOracle.ts";
import { nclose } from "../internal/nclose.ts";

/** Independent dimensioned rectangles, signed identity-edge incidence and original-source phase measurements. */
export namespace contourLoftBoundaryOracle {
  /** Rectangle generated from independent center, half-width and half-depth dimensions. */
  export const rectangle: (
    y: number,
    centerX: number,
    halfWidth: number,
    halfDepth: number,
  ) => O.V[] = (
    y: number,
    centerX: number,
    halfWidth: number,
    halfDepth: number,
  ): O.V[] =>
    [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(
      ([x, z]: number[]): O.V => [centerX + x * halfWidth, y, z * halfDepth],
    );

  /** Read the mesh's actual identity edges and their signed triangle traversal. */
  export const edges: (
    result: L.IResult,
  ) => Map<string, { uses: number; orientation: number }> = (
    result: L.IResult,
  ): Map<string, { uses: number; orientation: number }> => {
    const output: Map<string, { uses: number; orientation: number }> =
      new Map();
    const ids: number[] = result.mesh.indices!;
    for (let i: number = 0; i < ids.length; i += 3)
      for (let k: number = 0; k < 3; k++) {
        const a: number = ids[i + k],
          b: number = ids[i + ((k + 1) % 3)],
          key: string = O.edge(a, b);
        const record: { uses: number; orientation: number } = output.get(
          key,
        ) ?? {
          uses: 0,
          orientation: 0,
        };
        record.uses++;
        record.orientation += a < b ? 1 : -1;
        output.set(key, record);
      }
    return output;
  };

  /** Count actual triangle ownership in the two dimensioned adjacent test intervals. */
  export const intervalTriangles: (result: L.IResult) => [number, number] = (
    result: L.IResult,
  ): [number, number] => {
    const counts: [number, number] = [0, 0];
    for (let side: number = 0; side < 2; side++)
      counts[side] = (result.primitiveRanges ?? [])
        .filter(
          (range: NonNullable<L.IResult["primitiveRanges"]>[number]): boolean =>
            nclose(range.beforeMm, side * 2, 0) &&
            nclose(range.afterMm, side * 2 + 2, 0),
        )
        .reduce(
          (
            sum: number,
            range: NonNullable<L.IResult["primitiveRanges"]>[number],
          ): number => sum + range.triangleCount,
          0,
        );
    return counts;
  };

  /** Test every published source phase with the explicit Bernstein formula in the original chart. */
  export const aligned: (
    result: L.IResult,
    sections: readonly L.ISection[],
  ) => boolean = (
    result: L.IResult,
    sections: readonly L.ISection[],
  ): boolean =>
    result.construction.every(
      (construction: L.IResult["construction"][number]): boolean => {
        const section: L.ISection | undefined = sections.find(
          (candidate: L.ISection, i: number): boolean =>
            candidate.loops.some(
              (loop: L.ISection["loops"][number], j: number): boolean =>
                `${loop.curve.name}.section.${i}.loop.${j}` === construction.id,
            ),
        );
        const curve: C.Cubic | undefined = section?.loops.find(
          (loop: L.ISection["loops"][number]): boolean =>
            construction.id.startsWith(`${loop.curve.name}.section.`),
        )?.curve;
        return (
          curve !== undefined &&
          construction.phases?.length === construction.points.length &&
          construction.points.every((point: O.V, i: number): boolean => {
            const expected: O.V = O.evaluate(curve, construction.phases![i]);
            return point.every((value: number, k: number): boolean =>
              nclose(
                value,
                expected[k] * 0.001,
                Number.EPSILON *
                  512 *
                  Math.max(
                    Math.abs(value),
                    Math.abs(expected[k] * 0.001),
                    0.001,
                  ),
              ),
            );
          })
        );
      },
    );
}
