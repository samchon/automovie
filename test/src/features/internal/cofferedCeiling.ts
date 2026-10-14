import {
  IAutoMovieMeshAssembly,
  IAutoMovieMeshPart,
  mergeAutoMovieMeshParts,
} from "@automovie/engine";

import { slab } from "./slab";

/**
 * Compose a panel above Y=0 and a regular metre-based beam lattice below it for the architecture test. Positive integral rows/columns and dimensions are caller premises; 1+(columns+1)+(rows+1) declared members come from the loop boundaries rather than an authored vertex snapshot.
 *
 * Crossings remain separate overlapping members, so this fixture does not compute a boolean union or its material take-off. Work/output grow with rows+columns through slab generation and merge; the caller owns the new assembly and no input or generated cache is retained.
 */
export const cofferedCeiling: (props: {
  width: number;
  depth: number;
  rows: number;
  columns: number;
  beam: number;
  drop: number;
  panel: number;
}) => IAutoMovieMeshAssembly = (props: {
  width: number;
  depth: number;
  rows: number;
  columns: number;
  beam: number;
  drop: number;
  panel: number;
}): IAutoMovieMeshAssembly => {
  const across: (index: number, count: number, span: number) => number = (
    index: number,
    count: number,
    span: number,
  ): number => (index / count) * (span - props.beam) - (span - props.beam) / 2;
  const parts: IAutoMovieMeshPart[] = [
    {
      id: "panel",
      mesh: slab(props.width, props.panel, props.depth),
      transform: { translation: { x: 0, y: props.panel / 2, z: 0 } },
    },
  ];
  for (let column: number = 0; column <= props.columns; ++column)
    parts.push({
      id: `beam-x-${column + 1}`,
      mesh: slab(props.beam, props.drop, props.depth),
      transform: {
        translation: {
          x: across(column, props.columns, props.width),
          y: -props.drop / 2,
          z: 0,
        },
      },
    });
  for (let row: number = 0; row <= props.rows; ++row)
    parts.push({
      id: `beam-z-${row + 1}`,
      mesh: slab(props.width, props.drop, props.beam),
      transform: {
        translation: {
          x: 0,
          y: -props.drop / 2,
          z: across(row, props.rows, props.depth),
        },
      },
    });
  return mergeAutoMovieMeshParts(parts);
};
