import { IAutoMovieMesh } from "@automovie/interface";

/**
 * Read authored/emitted XYZ components into [min,max] ranges for the geometry fixtures without using the production bounds owner. The caller supplies a finite nonempty mesh; no shape, missing component or finiteness admission runs here, and empty axes retain inverted infinity extrema.
 *
 * Three filter/min/max passes take O(position count) work and temporary scalar lists. Argument spreading can exceed host limits on large buffers, so this observer serves the small fixture meshes rather than arbitrary imported assets; only three range pairs escape and nothing is cached.
 */
export const bounds: (mesh: IAutoMovieMesh) => Array<[number, number]> = (
  mesh: IAutoMovieMesh,
): Array<[number, number]> =>
  [0, 1, 2].map((axis: number): [number, number] => {
    const values: number[] = mesh.positions.filter(
      (_: number, index: number): boolean => index % 3 === axis,
    );
    return [Math.min(...values), Math.max(...values)] as [number, number];
  });
