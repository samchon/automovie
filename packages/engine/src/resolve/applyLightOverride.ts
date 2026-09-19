import { IAutoMovieLight, IAutoMovieTransform } from "@automovie/interface";
import { IAutoMovieLightOverride } from "./IAutoMovieLightOverride";

/**
 * Fold the accumulated overrides back onto a light, rebuilding it kind by kind.
 *
 * Written as a total switch rather than a spread so each kind keeps exactly the
 * parameters its discriminator promises: a `range` recorded against a light
 * that later reads as directional cannot leak a field the type does not carry.
 *
 * Every kind is its own `case` and there is no `default`. A `default` arm would
 * silently build a spot for a kind added later, and it would hide that omission
 * from the exhaustiveness check: the switch is what makes adding an
 * `IAutoMovieLight` arm a compile error here rather than a wrong light at
 * runtime.
 *
 * @evidence requirements/lighting/scope-and-identity.md#lighting-authored-input Applies sampled properties without changing the staged light kind.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-light-authority-branches Rebuilds each light through its own exhaustive authority branch.
 */
export const applyLightOverride = (
  light: IAutoMovieLight,
  override: IAutoMovieLightOverride,
): IAutoMovieLight => {
  const base = {
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
const applyLightTransformOverride = (
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
