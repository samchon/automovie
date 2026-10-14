import type { IAutoMovieDriver, IAutoMovieProfile, IAutoMoviePropSpec } from "@automovie/interface";
import type { IAutoMovieLegacyPropSpec } from "./IAutoMovieLegacyPropSpec";
import type { IAutoMovieLegacyPropDriver } from "./IAutoMovieLegacyPropDriver";
import type { IAutoMovieLegacyPropProfile } from "./IAutoMovieLegacyPropProfile";

/**
 * Convert one stored legacy prop spec into the engine's own shape.
 *
 * The stored form keeps ranges as objects because the payload it came from could not express tuples, so the engine pair is rebuilt here rather than stored twice.
 *
 * Historical controls, binding root and instance labels are omitted: no runtime used them. Model, nodes, limits and boneMap retain caller ownership; lowered profiles and driven-range tuples are fresh objects.
 *
 * @evidence contracts/common.md#principled-implementation Named v1 endpoints lower to ordered two-element engine ranges without changing values or units; omitted ranges stay absent so curve-driven records gain no invented linear interval.
 * @evidence contracts/common.md#clear-and-simple-design One boundary converts legacy persistence to active prop semantics, with private helpers for nested profile and driver representations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unread controls, root and instance labels are omitted rather than given fabricated behavior; ordinary drivers and active shared data remain unmutated.
 * @evidence contracts/common.md#meaningful-documentation States tuple lowering, absent-range behavior, omitted historical metadata and shared versus allocated output ownership.
 * @evidence contracts/performance.md#efficient-algorithms For D profile drivers conversion takes O(D) time and O(D) output space; only driven drivers and supplied range pairs allocate new nested objects.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each conversion answers one stored prop; a fresh profile protects the ownership boundary and no cross-prop cache is retained.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned objects transfer to the runtime prop while shared model, node, limit and mapping data remain caller-owned; no global state or resource is acquired.
 */
export function toEnginePropSpec(spec: IAutoMovieLegacyPropSpec): IAutoMoviePropSpec {
  return ({
  node: spec.node,
  model: spec.model,
  articulation:
    spec.articulation === null
      ? null
      : {
          nodes: spec.articulation.nodes,
          profile: toEnginePropProfile(spec.articulation.profile),
          binding: {
            profile: spec.articulation.binding.profile,
            boneMap: spec.articulation.binding.boneMap,
          },
        },
});
}

function toEnginePropProfile(profile: IAutoMovieLegacyPropProfile): IAutoMovieProfile {
  return ({
  id: profile.id,
  name: profile.name,
  drivers: profile.drivers.map(toEnginePropDriver),
  limits: profile.limits,
});
}

function toEnginePropDriver(driver: IAutoMovieLegacyPropDriver): IAutoMovieDriver {
  if (driver.type !== "driven") return driver;
  // Strip the v1-form ranges and re-add engine tuples only when present, a
  // curve-driven driver omits both, so it must not carry a dead range (#724).
  const { inRange, outRange, ...rest }: Extract<IAutoMovieLegacyPropDriver, { type: "driven" }> = driver;
  return {
    ...rest,
    ...(inRange !== undefined
      ? { inRange: [inRange.from, inRange.to] as [number, number] }
      : {}),
    ...(outRange !== undefined
      ? { outRange: [outRange.from, outRange.to] as [number, number] }
      : {}),
  };
}
