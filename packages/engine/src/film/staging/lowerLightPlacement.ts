import {
  IAutoMovieColor,
  IAutoMovieLight,
  IAutoMovieLightBase,
  IAutoMovieQuaternion,
  IAutoMovieStageLight,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { aimRotation } from "../../kinematics/aimRotation";

/** A light aims its local `-Z`, the glTF camera and light convention. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };

/** A spot's cone half-angle in degrees when the placement leaves it out. */
const DEFAULT_CONE_ANGLE: number = 45;

/**
 * Lower one accepted light placement into the scene light it describes.
 *
 * The node transform translates to `position`, or the origin for a light without one, and turns by the shortest-arc rotation that puts local `-Z` on `direction`, or the identity for a light without one, such as a point light, which radiates every way. An omitted color is neutral white with `a: null`, the light-slot convention {@link IAutoMovieColor} documents. `castShadow` and `shadow` are copied when present. A point or spot light's omitted `range` becomes `0`, which the light model reads as unlimited range, and a spot's omitted `coneAngle` becomes 45 degrees. An area light takes the `width` and `height` the placement must state: a panel has no default size, because an unstated width is an author who has not decided how big the window is.
 *
 * Precondition: `validateLightPlacementShape` accepted the placement, so its type is supported, an aimed light has a direction, and an area light has both extents. The vectors, color and shadow are the placement's own objects.
 *
 * @param light The accepted staging light placement.
 * @returns The scene light of the placement's kind.
 *
 * @evidence contracts/common.md#principled-implementation Aims with `aimRotation`, the shortest-arc rotation between local `-Z` and the authored direction that handles aligned and antiparallel cases explicitly, and fills only the defaults the light model defines, the unlimited `0` range and a documented cone angle, while an area extent is required rather than invented.
 * @evidence contracts/common.md#clear-and-simple-design One lowering per accepted placement, with the shared fields built once and each kind adding only the fields it carries, after the separate shape validator has decided acceptance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No light role or node is special-cased; the placement's discriminated union supplies each required physical field without casts, and no default panel size is substituted for the area source's authored extents.
 * @evidence contracts/common.md#meaningful-documentation States the transform rule, every default with its unit and meaning, why area extents have none, the precondition, and what the result aliases.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant work: one optional shortest-arc rotation and a few field copies, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Lowers one placement per call; `stageScene` lowers each placement once per accepted write.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the light references the placement's position, color and shadow objects and owns a fresh rotation and scale.
 */
export function lowerLightPlacement (
  light: IAutoMovieStageLight,
): IAutoMovieLight {
  const transform: IAutoMovieTransform = {
    translation: light.position ?? { x: 0, y: 0, z: 0 },
    rotation:
      light.direction === undefined
        ? identityRotation()
        : aimRotation(FORWARD, light.direction),
    scale: { x: 1, y: 1, z: 1 },
  };
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
  if (light.type === "point") return { ...base, type: light.type, range: light.range ?? 0 };
  if (light.type === "spot")
    return {
      ...base,
      type: light.type,
      range: light.range ?? 0,
      coneAngle: light.coneAngle ?? DEFAULT_CONE_ANGLE,
    };
  if (light.type === "area")
    return { ...base, type: light.type, width: light.width, height: light.height };
  return { ...base, type: "directional" };
}

/** A fresh identity rotation, so no two lights share one object. */
function identityRotation (): IAutoMovieQuaternion { return ({
  x: 0,
  y: 0,
  z: 0,
  w: 1,
}); }
