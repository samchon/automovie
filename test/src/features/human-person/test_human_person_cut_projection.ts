import { projectHumanLoopPoint } from "@automovie/human/human/seam/projectHumanLoopPoint";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Shared nearest-face projection has independent segment-foot expectations.
 *
 * Scenarios:
 * 1. Interior projections onto each edge, including the closing edge, recover
 *    the orthogonal segment foot and fraction.
 * 2. An exterior point clamps to the common endpoint, with exact ties owned
 *    by the first edge; a repeated endpoint exercises a zero-length edge.
 */
export const test_human_person_cut_projection = (): void => {
  const points = [{ x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, { x: 2, y: 0, z: 2 }];
  for (const [point, edge, fraction] of [
    [{ x: 1, y: 1, z: 0 }, 0, 0.5],
    [{ x: 2, y: 0, z: 1 }, 1, 0.5],
    [{ x: 0.5, y: 0, z: 0.5 }, 2, 0.75],
  ] as const) {
    const result = projectHumanLoopPoint(points, point);
    TestValidator.predicate("orthogonal segment foot", result.edge === edge && nclose(result.fraction, fraction));
  }
  TestValidator.equals("endpoint clamps and exact tie chooses first edge", projectHumanLoopPoint(points, { x: -1, y: 0, z: -1 }), { edge: 0, fraction: 0 });
  TestValidator.equals("zero-length edge has its endpoint fraction", projectHumanLoopPoint([points[0], points[0], points[1], points[2]], points[0]), { edge: 0, fraction: 0 });
};
