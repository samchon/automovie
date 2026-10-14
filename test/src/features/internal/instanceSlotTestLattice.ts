import type { IAutoMovieInstanceSetPlacement } from "@automovie/engine";

import { instanceSlotTestPlacement as placement } from "./instanceSlotTestPlacement";

/**
 * Preserve the original eight-member two-by-two-by-two lattice input.
 *
 * @evidence contracts/testing.md#behavioral-verification Supplies the unchanged lattice to actual instance-slot regeneration for first/last layer-row-column observations.
 * @evidence contracts/testing.md#independent-expectations Literal axis spacing 1/2/3 and zero anchor/heading are inputs; the consumer independently states the two expected world points.
 * @evidence contracts/testing.md#distinguishing-cases Retains all eight addressed slots and the original first/last witnesses without deriving a predicted member or adding a case.
 * @evidence contracts/testing.md#execution-ownership Returns fresh caller-owned placement/layout/spacing records through the existing placement owner, acquiring no file, host, browser or GPU.
 */
export function instanceSlotTestLattice(): IAutoMovieInstanceSetPlacement {
  return placement({
    count: 8,
    facingDeg: 0,
    anchor: { x: 0, y: 0, z: 0 },
    layout: { kind: "lattice", rows: 2, columns: 2, layers: 2, spacing: { x: 1, y: 2, z: 3 } },
  });
}
