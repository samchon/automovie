import type { IAutoMovieFluidDomain } from "@automovie/interface";
import { flatBasin } from "./flatBasin";

/**
 * Preserve the original four-by-four quarter-metre pond fixture with its mist
 * emitter and jet, then shallowly apply caller domain overrides. The existing
 * binding entry uses it for join refusals, placement twins and frame lowering;
 * expected results come from that entry's authored ids, halfspaces and clock.
 * Lists and nested override values stay borrowed as before. Construction starts
 * no validation, simulation, native artifact or rendering host.
 */
export function createFluidBindingPondDomain(overrides: Partial<IAutoMovieFluidDomain> = {}): IAutoMovieFluidDomain {
  return flatBasin({
    columns: 4,
    rows: 4,
    depth: 0.25,
    overrides: {
      id: "basin",
      sprays: [
        {
          id: "mist",
          column: 1,
          row: 1,
          rate: 8,
          lifetime: 1,
          speed: 2,
          direction: { x: 0, y: 1, z: 0 },
          spread: 0,
          size: 0.05,
          seed: 3,
          maxParticles: 16,
          lodDistance: 10,
        },
      ],
      sources: [
        { id: "jet", column: 1, row: 1, flowRate: 0.05, start: 0, end: null },
      ],
      ...overrides,
    },
  });
}
