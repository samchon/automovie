import { IAutoMovieLightShadow, IAutoMovieColor, IAutoMovieLight, IAutoMovieTransform } from "@automovie/interface";

import { IAutoMovieLightOverride } from "./IAutoMovieLightOverride";

/**
 * Reconstruct an admitted light kind from staged fields and present overrides, preserving optional shadow policy and area extents. Unanimated nested values remain borrowed; the direct helper returns a new light record while shot resolution bypasses untouched lights.
 *
 * @evidence contracts/common.md#principled-implementation Reconstruct each admitted light kind from staged fields plus present overrides, preserving optional shadow policy spelling and the kind's own range/cone/area extent fields.
 * @evidence contracts/common.md#clear-and-simple-design An exhaustive discriminator switch owns light shape, while the local transform helper borrows unchanged transform/scale references.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent fields preserve staged values rather than zero defaults; directional lights do not gain range and area dimensions remain staged rather than fictional animation axes.
 * @evidence contracts/common.md#meaningful-documentation Docs identify whole-record reconstruction, untouched-transform identity and supported animated fields; scalar/channel validity is established by sampling and light admission.
 * @evidence contracts/performance.md#efficient-algorithms A fixed set of light fields requires O(1) work/storage; only animated placement causes an additional transform wrapper.
 * @evidence contracts/performance.md#reuse-equivalent-work Unanimated nested values and optional shadow records are borrowed; the shot resolver bypasses this function entirely for untouched lights.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the new light/optional transform wrapper and the source owns borrowed fields; no native light, texture or task is acquired.
 */
export const applyLightOverride: (light: IAutoMovieLight, override: IAutoMovieLightOverride) => IAutoMovieLight = (
  light: IAutoMovieLight,
  override: IAutoMovieLightOverride,
): IAutoMovieLight => {
  const base: { shadow?: IAutoMovieLightShadow | undefined; castShadow?: boolean | undefined; id: string; transform: IAutoMovieTransform; color: IAutoMovieColor; intensity: number; } = {
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
const applyLightTransformOverride: (transform: IAutoMovieTransform, override: IAutoMovieLightOverride) => IAutoMovieTransform = (
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
