/**
 * Legacy project prop conversion boundary. The stored format preserves its existing
 * identities and units; runtime consumers use the same declared fields.
 */
import type { IAutoMovieDriver, IAutoMovieProfile, IAutoMoviePropSpec } from "@automovie/interface";
import type { IAutoMovieLegacyPropSpec } from "./IAutoMovieLegacyPropSpec";
import type { IAutoMovieLegacyPropDriver } from "./IAutoMovieLegacyPropDriver";
import type { IAutoMovieLegacyPropProfile } from "./IAutoMovieLegacyPropProfile";

/**
 * Convert one stored legacy prop spec into the engine's own shape.
 *
 * The stored form keeps ranges as objects because the payload it came from
 * could not express tuples, so the engine pair is rebuilt here rather than
 * stored twice.
 */
export const toEnginePropSpec = (
  spec: IAutoMovieLegacyPropSpec,
): IAutoMoviePropSpec => ({
  node: spec.node,
  model: spec.model,
  articulation:
    spec.articulation === null
      ? null
      : {
          nodes: spec.articulation.nodes,
          profile: toEnginePropProfile(spec.articulation.profile),
          binding: spec.articulation.binding,
        },
});

const toEnginePropProfile = (
  profile: IAutoMovieLegacyPropProfile,
): IAutoMovieProfile => ({
  id: profile.id,
  name: profile.name,
  controls: profile.controls,
  drivers: profile.drivers.map(toEnginePropDriver),
  limits: profile.limits,
});

const toEnginePropDriver = (
  driver: IAutoMovieLegacyPropDriver,
): IAutoMovieDriver => {
  if (driver.type !== "driven") return driver;
  // Strip the v1-form ranges and re-add engine tuples only when present, a
  // curve-driven driver omits both, so it must not carry a dead range (#724).
  const { inRange, outRange, ...rest } = driver;
  return {
    ...rest,
    ...(inRange !== undefined
      ? { inRange: [inRange.from, inRange.to] as [number, number] }
      : {}),
    ...(outRange !== undefined
      ? { outRange: [outRange.from, outRange.to] as [number, number] }
      : {}),
  };
};
