import { IAutoMovieLight, IAutoMovieStageLight, IAutoMovieVector3 } from "@automovie/interface";
import { aimRotation } from "../../kinematics/aimRotation";
import { lightTypeOf } from "./lightTypeOf";

/** Camera and light aim use local negative Z in the glTF world convention. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };

/** No turn: a point light radiates every way, so its orientation is arbitrary. */
const IDENTITY_ROTATION = { x: 0, y: 0, z: 0, w: 1 };

/** A spot's cone half-angle when the placement leaves it to the engine. */
const DEFAULT_CONE_ANGLE = 45;

/**
 * Lower one accepted placement into the scene light it describes.
 *
 * An aimed light keeps the shortest-arc rotation that puts its local −Z on
 * `direction`; a positioned light keeps that same aim (a spot needs it, a point
 * is rotation-indifferent and takes identity) and translates to `position`.
 * Omitted color is neutral white with `a: null`, the light-slot convention
 * {@link IAutoMovieColor} documents.
 *
 * @evidence requirements/lighting/sources-and-photometry.md#lighting-source-distribution Lowers an already-admitted staged source into its kind-specific world transform, authored linear color and shadow sampling state.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-source-distribution-color Lowers an already-admitted staged source into its kind-specific world transform, authored linear color and shadow sampling state.
 */
export const lowerLightPlacement = (light: IAutoMovieStageLight): IAutoMovieLight => {
  const type = lightTypeOf(light)!;
  const base = {
    id: light.node,
    transform: {
      translation: light.position ?? { x: 0, y: 0, z: 0 },
      rotation:
        light.direction === undefined
          ? IDENTITY_ROTATION
          : aimRotation(FORWARD, light.direction),
      scale: { x: 1, y: 1, z: 1 },
    },
    color: light.color ?? { r: 1, g: 1, b: 1, a: null, hex: null },
    intensity: light.intensity,
    ...(light.castShadow === undefined ? {} : { castShadow: light.castShadow }),
    ...(light.shadow === undefined ? {} : { shadow: light.shadow }),
  };
  if (type === "point") return { ...base, type, range: light.range ?? 0 };
  if (type === "spot")
    return {
      ...base,
      type,
      range: light.range ?? 0,
      coneAngle: light.coneAngle ?? DEFAULT_CONE_ANGLE,
    };
  // A panel has no defaultable extent: an unstated width is not "some usual
  // softbox", it is an author who has not decided how big the window is, so the
  // placement gate refuses it and lowering reads what was decided.
  if (type === "area") {
    const extent = light;
    return {
      ...base,
      type,
      width: extent.width as number,
      height: extent.height as number,
    };
  }
  return { ...base, type };
};
