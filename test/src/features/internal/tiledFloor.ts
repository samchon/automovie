import {
  IAutoMovieMeshAssembly,
  IAutoMovieMeshPart,
  mergeAutoMovieMeshParts,
} from "@automovie/engine";
import { type IAutoMovieMesh } from "@automovie/interface";

import { slab } from "./slab";

/**
 * Place one centred slab per authored row/column at pitch tile+joint, with one merge group per tile and outer extents count*pitch-joint. Distances are metres; the parent supplies positive integral counts, positive tile/thickness and nonnegative joint width.
 *
 * The slab input is shared across placements, while merge emits caller-owned geometry. O(rows*columns) member work/output preserves gaps rather than filling them or estimating installation waste; there is no cross-call mesh cache or real renderer.
 */
export const tiledFloor: (props: {
  rows: number;
  columns: number;
  tile: number;
  joint: number;
  thickness: number;
}) => IAutoMovieMeshAssembly = (props: {
  rows: number;
  columns: number;
  tile: number;
  joint: number;
  thickness: number;
}): IAutoMovieMeshAssembly => {
  const pitch: number = props.tile + props.joint;
  const width: number = props.columns * pitch - props.joint;
  const depth: number = props.rows * pitch - props.joint;
  const unit: IAutoMovieMesh = slab(props.tile, props.thickness, props.tile);
  const parts: IAutoMovieMeshPart[] = [];
  for (let row: number = 0; row < props.rows; ++row)
    for (let column: number = 0; column < props.columns; ++column)
      parts.push({
        id: `tile-${row + 1}-${column + 1}`,
        mesh: unit,
        transform: {
          translation: {
            x: column * pitch + props.tile / 2 - width / 2,
            y: 0,
            z: row * pitch + props.tile / 2 - depth / 2,
          },
        },
      });
  return mergeAutoMovieMeshParts(parts);
};
