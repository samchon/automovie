import type {
  IAutoMovieWorldHeightfield,
  IAutoMovieWorldSurface,
} from "@automovie/interface";

/*
 * Bake a supplied height callback into a row-major terrain lattice.
 *
 * Each axis is prepared once at origin + index × spacing, with distinct
 * representable sample positions. The height reader uses those same knots. The
 * callback reads each Cartesian pair once, in increasing row and column order,
 * and every stored height supports interpolation.
 */
export function bakeHeightfield(
  input: IAutoMovieWorldHeightfield.IInput,
): IAutoMovieWorldSurface {
  const { columns, rows }: IAutoMovieWorldHeightfield.IInput = input;
  const {
    x: originX,
    z: originZ,
  }: IAutoMovieWorldHeightfield.IInput["origin"] = input.origin;
  const {
    x: spacingX,
    z: spacingZ,
  }: IAutoMovieWorldHeightfield.IInput["spacing"] = input.spacing;
  if (spacingX <= 0 || spacingZ <= 0)
    throw new Error(
      `World heightfield "${input.id}" requires a finite origin and positive spacing.`,
    );
  if (columns < 2 || rows < 2)
    throw new Error(
      `World heightfield "${input.id}" requires at least two sample columns and rows.`,
    );

  let x: number[];
  let z: number[];
  let samples: number[];
  try {
    x = new Array<number>(columns);
    z = new Array<number>(rows);
    samples = new Array<number>(columns * rows);
  } catch (cause: unknown) {
    throw new RangeError(
      `World heightfield "${input.id}" requires at least two sample columns and rows that fit its rectangular lattice.`,
      { cause },
    );
  }
  prepareAxis(x, originX, spacingX, input.id);
  prepareAxis(z, originZ, spacingZ, input.id);

  for (let row: number = 0; row < rows; ++row)
    for (let column: number = 0; column < columns; ++column) {
      const height: number = input.height({ x: x[column]!, z: z[row]! });
      if (!(Math.abs(height) < Infinity))
        throw new Error(
          `World heightfield "${input.id}" sampled a non-finite height at column ${column}, row ${row}.`,
        );
      samples[row * columns + column] = height;
    }
  return {
    id: input.id,
    polygon: structuredClone(input.polygon),
    height: {
      kind: "heightfield",
      originX,
      originZ,
      spacingX,
      spacingZ,
      columns,
      rows,
      samples,
    },
    walkable: input.walkable,
  };
}

/*
 * Write the world coordinates one axis can actually sample in order.
 */
function prepareAxis(
  coordinates: number[],
  origin: number,
  spacing: number,
  id: string,
): void {
  for (let index: number = 0; index < coordinates.length; ++index) {
    const point: number = origin + index * spacing;
    if (
      !(Math.abs(point) < Infinity) ||
      (index > 0 && point <= coordinates[index - 1]!)
    )
      throw new Error(
        `World heightfield "${id}" requires a finite origin and positive representable spacing.`,
      );
    coordinates[index] = point;
  }
}
