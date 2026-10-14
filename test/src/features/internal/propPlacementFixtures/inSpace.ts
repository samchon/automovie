import type { IAutoMoviePropRelation } from "@automovie/interface";

/**
 * An `in-space` relation naming one logical space.
 *
 * Behavior: Builds the original in-space citation consumed by real placement validation in the furnished-room tests.
 * Expectation basis: Caller-authored space and environment ids are inputs; existence, ambiguity and cross-environment expectations are asserted by the owning identity/geometry cases.
 * Cases: Preserves explicit environment and the original house default, without adding reference validation inside the fixture.
 * Execution: The existing owning entries call inSpace during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function inSpace(
  space: string,
  environment: string = "house",
): IAutoMoviePropRelation {
  return {
    kind: "in-space",
    target: { kind: "space", environment, space },
  };
}
