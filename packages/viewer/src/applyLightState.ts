import type { IAutoMovieLight } from "@automovie/interface";
import * as THREE from "three";

import { applyTransform } from "./applyTransform";

/**
 * Write one {@link IAutoMovieLight}'s value onto the `three.js` light that plays
 * it: its PLACEMENT for every kind, colour and intensity for every kind,
 * falloff distance for the two that have one, the cone half-angle (degrees on
 * the artifact, radians in `three.js`) for a spot, and the panel extent for an
 * area source.
 *
 * The one place the mapping lives. {@link buildLight} calls it to place a staged
 * light and {@link applyLightMotion} calls it to move that same light over time,
 * so an animated light and a static one can never disagree about what `range`
 * or `coneAngle` means.
 *
 * The transform is written HERE rather than once at build time, which is what
 * makes a light's direction animatable at all. `buildLight` used to place the
 * light itself and this helper wrote everything except its placement, so a
 * `/lights/<id>/rotation` track could resolve to a new orientation every frame
 * and the `three.js` light would keep the one it was staged with forever. Both
 * callers now go through one writer, so the rendered placement is the resolved
 * placement by construction; {@link aimLight} keeps the light's target as a
 * CHILD for exactly the same reason, so a turning light turns what it aims at
 * with it.
 *
 * Writing an absolute TRS every frame is also what lets `applyLightMotion` keep
 * its promise that the viewer's lighting is a pure function of scene, clips and
 * time: a light nothing addresses is written back to where the scene staged it
 * rather than holding wherever the previous frame left it.
 *
 * @evidence requirements/lighting/sources-and-photometry.md#lighting-source-time-sampling Writes this light surface from the exact sampled source state.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-source-sampling-refusal Implements the fixed-time source sampling and refusal boundary.
 * @author Samchon
 */
export const applyLightState = (
  target: THREE.Light,
  light: IAutoMovieLight,
): void => {
  applyTransform(target, light.transform);
  target.color.setRGB(light.color.r, light.color.g, light.color.b);
  target.intensity = light.intensity;
  if (light.type === "point" && target instanceof THREE.PointLight)
    target.distance = light.range;
  else if (light.type === "spot" && target instanceof THREE.SpotLight) {
    target.distance = light.range;
    target.angle = (light.coneAngle * Math.PI) / 180;
  } else if (light.type === "area" && target instanceof THREE.RectAreaLight) {
    // Extent carries no channel, so it never changes between frames; it is
    // written here anyway because this is the one place a light's values are
    // mapped, and a second writer at build time is the duplicate that survives
    // until the two copies disagree.
    target.width = light.width;
    target.height = light.height;
  }
};
