import { createPortraitNoseComponent } from "@automovie/human/face/anatomy/nose/createPortraitNoseComponent";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";
/**
 * An aperture edit moves the rim and spreads that move into the pinned skin
 * around it, decaying over the adaptation reach. This scenario pins the spread
 * of the displacement; it does not establish that the assembled skin is free
 * of folds or intersections.
 *
 * Scenarios:
 * 1. On a 5x5 planar grid whose central eight triangles are cut away, doubling
 *    the aperture width with reach 10 moves the outer skin ring outward too,
 *    with the edge-adjacent vertex moving more than the corner one, while
 *    reach 0 leaves that skin exactly where it was (the earlier behaviour) and
 *    the widening of the corner is smaller.
 */
export const test_subject_nasal_skin_spread = (): void => {
  const positions: number[][] = [];
  for (let row = 0; row < 5; row++)
    for (let column = 0; column < 5; column++)
      positions.push([2 * column - 4, 2 * row - 4, 0]);
  const grid: number[] = [];
  const cut: number[] = [];
  for (let row = 0; row < 4; row++)
    for (let column = 0; column < 4; column++) {
      const a = row * 5 + column;
      const inner = row >= 1 && row <= 2 && column >= 1 && column <= 2;
      if (inner) cut.push(grid.length / 3, grid.length / 3 + 1);
      grid.push(a, a + 1, a + 5, a + 1, a + 6, a + 5);
    }
  const socket = {
    midline: 0,
    tipY: 0,
    tipRadius: [1, 1] as [number, number],
    alarOffset: 1,
    alarY: 0,
    alarRadius: 1,
    surface: positions.map((_p, id) => id),
    nostrils: [cut],
  };
  const shape = (blendReach: number) => ({
    widthScale: 1,
    tipProjection: 0,
    alarProjection: 0,
    nostrilWidthScale: 2,
    nostrilHeightScale: 1,
    nostrilRise: 0,
    nostrilTilt: 0,
    rimRoundness: 0,
    rimSupport: 0.1,
    cavityContraction: 0.6,
    cavityOffset: [0, 3, -5],
    blendReach,
  });
  const targetsOf = (blendReach: number) =>
    new Map(
      createPortraitNoseComponent(socket, shape(blendReach))
        .fit({ positions, indices: grid, viewRay: [0, 0, 1] })
        .constraints.map((c) => [c.vertex, c.target] as const),
    );
  const spread = targetsOf(10);
  const still = targetsOf(0);
  // Vertex 14 (4, 0) is edge-adjacent to the rim's x = 2 column; vertex 24 is
  // the far corner (4, 4).
  TestValidator.predicate(
    "reach 10 moves the outer skin outward, more beside the rim than at the corner",
    spread.get(14)![0] > 4 && spread.get(24)![0] >= 4 && spread.get(14)![0] - 4 > spread.get(24)![0] - 4,
  );
  TestValidator.predicate(
    "reach 0 keeps the skin pinned",
    still.get(14)!.every((value, axis) => nclose(value, [4, 0, 0][axis]!)),
  );
};
