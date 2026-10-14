
import { slopedSlab } from "../solids";
import { part } from "../part";
import type { IHousePart } from "../../types/IHousePart";
import type { IPlanPoint } from "../../types/IPlanPoint";
import type {
  IAutoMovieHeightRule,
  IAutoMovieVector3,
} from "@automovie/interface";

const CONNECTOR_CELLS = 4;
const edgeAt = (a: number, b: number, value: number): boolean =>
  Math.abs(a - value) < 1e-8 && Math.abs(b - value) < 1e-8;

/** Keep only the outside sides of a paving rectangle; omit a caller-owned joined edge.
 */
export const pavingFreeEdge = (
  x: readonly [number, number],
  z: readonly [number, number],
  joined: (a: IAutoMovieVector3, b: IAutoMovieVector3) => boolean = () => false,
): ((a: IAutoMovieVector3, b: IAutoMovieVector3) => boolean) =>
  (a, b) => (
    edgeAt(a.x, b.x, x[0]) || edgeAt(a.x, b.x, x[1]) ||
    edgeAt(a.z, b.z, z[0]) || edgeAt(a.z, b.z, z[1])
  ) && !joined(a, b);

/** Base depth below a walking surface, metres. */
export const WALK_DEPTH = 0.12;
/** Base depth below the driveway surface, metres. */
export const DRIVE_DEPTH = 0.15;

/** Add the connector's four segment endpoints to a neighbouring slab edge. */
export const seamRect = (
  x: readonly [number, number],
  z: readonly [number, number],
  west: readonly (readonly [number, number])[] = [],
  east: readonly (readonly [number, number])[] = [],
): IPlanPoint[] => {
  const stations = (runs: readonly (readonly [number, number])[]): number[] =>
    [...new Set([z[0], z[1], ...runs.flatMap(([a, b]) =>
      Array.from({ length: CONNECTOR_CELLS + 1 }, (_, i) => a + ((b - a) * i) / CONNECTOR_CELLS),
    )])].sort((a, b) => a - b);
  return [
    ...stations(east).map((value) => ({ x: x[1], z: value })),
    ...stations(west).reverse().map((value) => ({ x: x[0], z: value })),
  ];
};

/** The bilinear rule sampled from the same height callback as the paving mesh.
 */
export const pavingHeightfield = (
  x: readonly [number, number],
  z: readonly [number, number],
  height: (x: number, z: number) => number,
): IAutoMovieHeightRule => ({
  kind: "heightfield",
  originX: x[0],
  originZ: z[0],
  spacingX: x[1] - x[0],
  spacingZ: z[1] - z[0],
  columns: 2,
  rows: 2,
  samples: [
    height(x[0], z[0]),
    height(x[1], z[0]),
    height(x[0], z[1]),
    height(x[1], z[1]),
  ],
});

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
  const n = CONNECTOR_CELLS;
  const xs = Array.from(
    { length: n + 1 },
    (_, i) => props.x[0] + ((props.x[1] - props.x[0]) * i) / n,
  );
  const zs = Array.from(
    { length: n + 1 },
    (_, i) => props.z[0] + ((props.z[1] - props.z[0]) * i) / n,
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
            }),
          ),
        );
    }
  return parts;
};
