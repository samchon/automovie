import {
  IAutoMovieColor,
  IAutoMovieLight,
  IAutoMovieLightBase,
  IAutoMovieQuaternion,
  IAutoMovieStageLight,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { aimRotation } from "../../../kinematics/aimRotation";
import { Transform } from "../../../math/Transform";

/** A light aims its local `-Z`, the glTF camera and light convention. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };

/** A spot's cone half-angle in degrees when the placement leaves it out. */
const DEFAULT_CONE_ANGLE: number = 45;

/**
 * Lower one accepted light placement into the scene light it describes.
 *
 * The node transform translates to `position`, or the origin for a light
 * without one, and turns by the shortest-arc rotation that puts local `-Z` on
 * `direction`, or the identity for a light without one, such as a point light,
 * which radiates every way. An omitted color is neutral white with `a: null`,
 * the light-slot convention {@link IAutoMovieColor} documents. `castShadow` and
 * `shadow` are copied when present. A point or spot light's omitted `range`
 * becomes `0`, which the light model reads as unlimited range, and a spot's
 * omitted `coneAngle` becomes 45 degrees. An area light takes the `width` and
 * `height` the placement must state: a panel has no default size, because an
 * unstated width is an author who has not decided how big the window is.
 *
 * Precondition: `validateLightPlacementShape` accepted the placement, so its
 * type is supported, an aimed light has a direction, and an area light has both
 * extents. The vectors, color and shadow are the placement's own objects.
 *
 * @param light The accepted staging light placement.
 * @returns The scene light of the placement's kind.
 */
export function lowerLightPlacement(
  light: IAutoMovieStageLight,
): IAutoMovieLight {
  const transform: IAutoMovieTransform = Transform.of(
    light.position ?? { x: 0, y: 0, z: 0 },
    light.direction === undefined
      ? identityRotation()
      : aimRotation(FORWARD, light.direction),
  );
  const color: IAutoMovieColor = light.color ?? {
    r: 1,
    g: 1,
    b: 1,
    a: null,
    hex: null,
  };
  const base: IAutoMovieLightBase = {
    id: light.node,
    transform,
    color,
    intensity: light.intensity,
    ...(light.castShadow === undefined ? {} : { castShadow: light.castShadow }),
    ...(light.shadow === undefined ? {} : { shadow: light.shadow }),
  };
  if (light.type === "point")
    return { ...base, type: light.type, range: light.range ?? 0 };
  if (light.type === "spot")
    return {
      ...base,
      type: light.type,
      range: light.range ?? 0,
      coneAngle: light.coneAngle ?? DEFAULT_CONE_ANGLE,
    };
  if (light.type === "area")
    return {
      ...base,
      type: light.type,
      width: light.width,
      height: light.height,
    };
  return { ...base, type: "directional" };
}

/** A fresh identity rotation, so no two lights share one object. */
function identityRotation(): IAutoMovieQuaternion {
  return {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
  };
}
