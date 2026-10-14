import type { IAutoMoviePropSpec } from "@automovie/interface";
import { inSpace } from "./inSpace";
import { boxProp } from "./boxProp";

/**
 * Hung from a building element.
 *
 * Behavior: Constructs the original pendant suspended from the ceiling element for real placement and contact-boundary tests.
 * Expectation basis: Literal room/ceiling relation ids define its input meaning; the owning entries independently choose overlapping and exact-contact positions.
 * Cases: Keeps suspension, null footprint and empty clearances without changing the original neighboring hanging-prop cases.
 * Execution: The existing owning entries call pendant during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function pendant(): IAutoMoviePropSpec { return ({
  ...boxProp("pendant"),
  placement: {
    relations: [
      inSpace("room"),
      {
        kind: "suspended",
        target: { kind: "element", environment: "house", element: "ceiling" },
      },
    ],
    footprint: null,
    clearance: [],
  },
}); }
