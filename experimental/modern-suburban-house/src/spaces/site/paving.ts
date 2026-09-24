/**
 * Paving depths and the sloped-connector surface used by the site paving owners.
 *
 * Design owner: `docs/spaces/site/01-paving-support.md`
 * (`paving-depth-reservation`): the three walking surfaces reserve 0.12 m of
 * base below their top, the driveway 0.15 m. A connector whose top blends two
 * different edge heights is a bilinear surface; the owner splits each sloped
 * run into at least four parts along X and Z so the two-triangle difference
 * stays under about 0.00083 m, and every cell is two triangles whose corners
 * are shared with their neighbours. This helper emits no surface of its own.
 */
import { type IHousePart, part, slopedSlab } from "../solids";

/** Base depth below a walking surface, metres. */
export const WALK_DEPTH = 0.12;
/** Base depth below the driveway surface, metres. */
export const DRIVE_DEPTH = 0.15;

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
  cells?: number;
}): IHousePart[] => {
  const n = props.cells ?? 4;
  const xs = Array.from({ length: n + 1 }, (_, i) => props.x[0] + ((props.x[1] - props.x[0]) * i) / n);
  const zs = Array.from({ length: n + 1 }, (_, i) => props.z[0] + ((props.z[1] - props.z[0]) * i) / n);
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
          part(`${props.id}-${i}-${j}-${k}`, props.owner, "paving", props.color, slopedSlab({ plan: tri, top: props.height, thickness: props.depth })),
        );
    }
  return parts;
};
