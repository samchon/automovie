import type { IPlanPoint } from "../../types/IPlanPoint";
import { PAVING_CONNECTOR_CELLS } from "./PAVING_CONNECTOR_CELLS";

/** Add the connector's four segment endpoints to a neighbouring slab edge. */

export const seamRect = (
  x: readonly [number, number],
  z: readonly [number, number],
  west: readonly (readonly [number, number])[] = [],
  east: readonly (readonly [number, number])[] = []
): IPlanPoint[] => {
  const stations = (runs: readonly (readonly [number, number])[]): number[] => [...new Set([z[0], z[1], ...runs.flatMap(([a, b]) => Array.from({ length: PAVING_CONNECTOR_CELLS + 1 }, (_, i) => a + ((b - a) * i) / PAVING_CONNECTOR_CELLS)
  )])].sort((a, b) => a - b);
  return [
    ...stations(east).map((value) => ({ x: x[1], z: value })),
    ...stations(west).reverse().map((value) => ({ x: x[0], z: value })),
  ];
};
