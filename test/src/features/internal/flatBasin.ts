import type { IAutoMovieFluidDomain } from "@automovie/interface";

import { fluidDomain } from "./fluidDomain";

/** Build the original flat-bed uniform-depth basin with half-metre cells and a 1/64-second clock. Cell-sized buffers are fresh and final shallow overrides can replace any field by reference; dimensions are not admitted here and invalid populations may throw during allocation. */
export const flatBasin: (props: {
  columns: number;
  rows: number;
  depth: number;
  overrides?: Partial<IAutoMovieFluidDomain>;
}) => IAutoMovieFluidDomain = (props: {
  columns: number;
  rows: number;
  depth: number;
  overrides?: Partial<IAutoMovieFluidDomain>;
}): IAutoMovieFluidDomain => {
  const cells: number = props.columns * props.rows;
  return fluidDomain({
    id: "basin",
    grid: {
      columns: props.columns,
      rows: props.rows,
      cellX: 0.5,
      cellZ: 0.5,
      origin: { x: 0, y: 0, z: 0 },
    },
    solver: {
      fixedStepSeconds: 0.015625,
      gravity: 8,
      drag: 0,
      dryDepth: 0,
      referenceDepth: 2,
      maxSteps: 5_000,
    },
    bed: new Array(cells).fill(0),
    depth: new Array(cells).fill(props.depth),
    solid: new Array(cells).fill(false),
    ...props.overrides,
  });
};
