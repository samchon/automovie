import type { IAutoMovieInstanceSetPlacement } from "@automovie/engine";

/**
 * Preserve the original six-member, quarter-turned grid placement input.
 *
 * @evidence contracts/testing.md#behavioral-verification Supplies the existing layout/variation law to actual instance-slot layout and refusal cases; caller overrides remain applied last.
 * @evidence contracts/testing.md#independent-expectations Literal grid spacing, anchor, heading and variation fields are inputs, while the consumer separately authors world-point and refusal expectations.
 * @evidence contracts/testing.md#distinguishing-cases Keeps original grid and override-based lattice/scatter/explicit/route and invalid-value twins without selecting cases or deriving their oracle.
 * @evidence contracts/testing.md#execution-ownership Returns a fresh caller-owned placement with the original shallow override semantics; it opens no filesystem, renderer, browser or GPU and replaces no foreign method.
 */
export function instanceSlotTestPlacement(
  overrides: Partial<IAutoMovieInstanceSetPlacement> = {},
): IAutoMovieInstanceSetPlacement {
  return {
    id: "trees",
    count: 6,
    model: "tree",
    layout: { kind: "grid", rows: 2, columns: 3, spacing: { x: 2, z: 3 } },
    route: null,
    anchor: { x: 10, y: 1, z: -5 },
    facingDeg: 90,
    seed: 7,
    variation: { scale: { min: 1, max: 1 }, palette: ["#336633"], traits: [] },
    ...overrides,
  };
}
