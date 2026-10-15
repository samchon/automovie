import type { IAutoMovieVector3 } from "@automovie/interface";
import type { IHousePart } from "../../types/IHousePart";
import { part } from "../part";
import { slopedSlab } from "../slopedSlab";
import { pavingFreeEdge } from "./pavingFreeEdge";
import { PAVING_CONNECTOR_CELLS } from "./PAVING_CONNECTOR_CELLS";

/**
 * A sloped run over X = `x`, Z = `z` whose top is `height(x, z)`, emitted as
 * `cells × cells` quads split into triangles, each a prism of `depth`.
 */

export const blendedRun = (props: {
  id: string;
  owner: string;
  color: number;
  x: readonly [number, number];
  z: readonly [number, number];
  height: (x: number, z: number) => number;
  depth: number;
  /** Edge joined to another part of the same paving union. */
  joined?: (a: IAutoMovieVector3, b: IAutoMovieVector3) => boolean;
}): IHousePart[] => {
  const n = PAVING_CONNECTOR_CELLS;
  const xs = Array.from(
    { length: n + 1 },
    (_, i) => props.x[0] + ((props.x[1] - props.x[0]) * i) / n
  );
  const zs = Array.from(
    { length: n + 1 },
    (_, i) => props.z[0] + ((props.z[1] - props.z[0]) * i) / n
  );
  const parts: IHousePart[] = [];
  for (let i = 0; i < n; ++i)
    for (let j = 0; j < n; ++j) {
      const p00 = { x: xs[i]!, z: zs[j]! };
      const p10 = { x: xs[i + 1]!, z: zs[j]! };
      const p11 = { x: xs[i + 1]!, z: zs[j + 1]! };
      const p01 = { x: xs[i]!, z: zs[j + 1]! };
      // Each triangle's three corners are planar by construction, so the
      // bilinear height sampled at them defines its top exactly.
      for (const [k, tri] of [[p00, p10, p11], [p00, p11, p01]].entries())
        parts.push(
          part(
            `${props.id}-${i}-${j}-${k}`,
            props.owner,
            "paving",
            props.color,
            slopedSlab({
              plan: tri,
              top: props.height,
              thickness: props.depth,
              freeEdge: pavingFreeEdge(props.x, props.z, props.joined),
            })
          )
        );
    }
  return parts;
};
