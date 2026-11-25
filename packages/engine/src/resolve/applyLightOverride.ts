import {
  IAutoMovieColor,
  IAutoMovieLight,
  type IAutoMovieLightOverride,
  IAutoMovieLightShadow,
  IAutoMovieTransform,
} from "@automovie/interface";

/**
 * Reconstruct an admitted light kind from staged fields and present overrides,
 * preserving optional shadow policy and area extents. Unanimated nested values
 * remain borrowed; the direct helper returns a new light record while shot
 * resolution bypasses untouched lights.
 */
export const applyLightOverride: (
  light: IAutoMovieLight,
  override: IAutoMovieLightOverride,
) => IAutoMovieLight = (
  light: IAutoMovieLight,
  override: IAutoMovieLightOverride,
): IAutoMovieLight => {
  const base: {
    shadow?: IAutoMovieLightShadow | undefined;
    castShadow?: boolean | undefined;
    id: string;
    transform: IAutoMovieTransform;
    color: IAutoMovieColor;
    intensity: number;
  } = {
    id: light.id,
    transform: applyLightTransformOverride(light.transform, override),
    color: override.color ?? light.color,
    intensity: override.intensity ?? light.intensity,
    // Shadow casting is a staged renderer policy with no channel, so it is
    // carried rather than rebuilt. Spreading only the animated fields would let
    // dimming a lamp silently stop it casting, and each optional key is kept
    // ABSENT when the staged light omitted it so a folded light and an
    // untouched one serialize to the same bytes.
    ...(light.castShadow === undefined ? {} : { castShadow: light.castShadow }),
    ...(light.shadow === undefined ? {} : { shadow: light.shadow }),
  };
  switch (light.type) {
    case "directional":
      return { ...base, type: "directional" };
    case "point":
      return { ...base, type: "point", range: override.range ?? light.range };
    case "spot":
      return {
        ...base,
        type: "spot",
        range: override.range ?? light.range,
        coneAngle: override.coneAngle ?? light.coneAngle,
      };
    case "area":
      // A panel's extent is staged geometry, not a timeline axis: `width` and
      // `height` carry no channel entry, so no override can reach them and both
      // are carried through from the staged light.
      return {
        ...base,
        type: "area",
        width: light.width,
        height: light.height,
      };
  }
};

/**
 * The light's placement at this instant: the staged transform with whichever of
 * its translation and rotation a track wrote.
 *
 * `scale` is deliberately not animatable and is carried through untouched. A
 * punctual light has no extent for a scale to mean anything about — `three.js`
 * reads none of it, and glTF's `KHR_lights_punctual` defines none — so an
 * animatable scale axis would be a channel that validates, applies, and changes
 * no frame, which is the false green #1339 named.
 *
 * A transform no track touched is returned BY IDENTITY, the same guarantee
 * `resolveShotLighting` gives for a whole light: a shot that dims a lamp
 * without moving it leaves the very transform object the scene staged, so
 * nothing downstream can mistake a re-boxed copy for a move.
 */
const applyLightTransformOverride: (
  transform: IAutoMovieTransform,
  override: IAutoMovieLightOverride,
) => IAutoMovieTransform = (
  transform: IAutoMovieTransform,
  override: IAutoMovieLightOverride,
): IAutoMovieTransform =>
  override.position === undefined && override.rotation === undefined
    ? transform
    : {
        translation: override.position ?? transform.translation,
        rotation: override.rotation ?? transform.rotation,
        scale: transform.scale,
      };
