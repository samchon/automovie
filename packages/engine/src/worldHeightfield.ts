import {
  type IAutoMovieWorldHeightfield,
  IAutoMovieWorldSurface,
} from "@automovie/interface";

/** Bake a supplied height callback into a row-major terrain lattice. */
export const worldHeightfield: (
  input: IAutoMovieWorldHeightfield.IInput,
) => IAutoMovieWorldSurface = (
  input: IAutoMovieWorldHeightfield.IInput,
): IAutoMovieWorldSurface => {
  if (input.spacing.x <= 0 || input.spacing.z <= 0)
    throw new Error(
      `World heightfield "${input.id}" requires a finite origin and positive spacing.`,
    );
  if (input.columns < 2 || input.rows < 2)
    throw new Error(
      `World heightfield "${input.id}" requires at least two sample columns and rows.`,
    );
  const samples: number[] = [];
  for (let row: number = 0; row < input.rows; ++row)
    for (let column: number = 0; column < input.columns; ++column) {
      const height: number = input.height({
        x: input.origin.x + column * input.spacing.x,
        z: input.origin.z + row * input.spacing.z,
      });
      samples.push(height);
    }
  return {
    id: input.id,
    polygon: structuredClone(input.polygon),
    height: {
      kind: "heightfield",
      originX: input.origin.x,
      originZ: input.origin.z,
      spacingX: input.spacing.x,
      spacingZ: input.spacing.z,
      columns: input.columns,
      rows: input.rows,
      samples,
    },
    walkable: input.walkable,
  };
};
