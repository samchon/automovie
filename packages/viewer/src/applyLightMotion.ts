import { resolveShotLighting } from "@automovie/engine";
import type { IAutoMovieClip, IAutoMovieLight } from "@automovie/interface";
import type * as THREE from "three";

import { applyLightState } from "./applyLightState.js";

/**
 * Drive scene lights from a shot's `lightMotions`: evaluate the clips at
 * `seconds` through the engine's {@link resolveShotLighting} and write each
 * resolved light onto the `THREE.Light` that `resolve` returns for its **id**.
 *
 * The render side of #1348, and the reason the axis is not a false green: the
 * engine decides what the light IS at an instant and this writes it, so a
 * candle blown out at 1.6s dims in the viewer at 1.6s instead of holding its
 * staged glow for the whole film.
 *
 * Lights are resolved by id and never by position. `buildScene` adds them as
 * top-level children and the segmentation mask palette is keyed by top-level
 * child index, so an index-addressed light would silently re-target whenever
 * staging inserts one; {@link IAutoMovieSceneObject.lights} is the id index
 * built for exactly this call.
 *
 * Every staged light is written, not only the ones a clip addresses, which is
 * the deliberate difference from {@link applyObjectMotion}. That helper owns no
 * rest poses, so it must leave an unaddressed channel alone; a light carries
 * its rest on the scene, so writing all of them makes the viewer's lighting a
 * pure function of scene, clips and time. A host swapping clips mid-scene gets
 * the staged light back instead of whatever the previous frame left behind.
 *
 * A light the host cannot resolve is skipped: the engine has already refused a
 * clip addressing a light the scene does not stage, so the only way to arrive
 * here unresolved is a host that built a subset of the scene.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Resolves all staged lights through engine absolute-time clip authority and writes matching borrowed Three targets by semantic id; admitted light channels and matching target classes are premises, and unresolved host-subset targets are skipped while unaddressed fields return to staged values.
 * @evidence contracts/common.md#clear-and-simple-design Keeps light interpolation/rest authority in resolveShotLighting and concrete Three field mapping in applyLightState; id lookup avoids dependency on top-level scene child indices used by segmentation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses every actual resolved light without fixture candle times or positional targeting; skips missing host objects by the partial-scene contract rather than manufacturing substitute geometry/light.
 * @evidence contracts/common.md#meaningful-documentation Gives seconds, id-based lookup, all-staged rest restoration, difference from partial object-channel writes and unresolved-subset behavior.
 * @evidence contracts/performance.md#efficient-algorithms Engine resolution scans staged lights and candidate light channels/key authority, then each resolved light incurs one lookup and fixed-size field write; storage follows the engine's resolved light collection rather than rendered pixels.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares one engine resolver and concrete state writer between builds/frames; clips/time/rest source determine resolution and target mutation is effectful, so no cached final write is reused across arbitrary hosts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows declarations/clips/targets and retains no frame collection after return; owns no light, shadow map, renderer or task and transfers only field updates to the host.
 */
export const applyLightMotion: (
  lights: readonly IAutoMovieLight[],
  clips: readonly IAutoMovieClip[],
  seconds: number,
  resolve: (light: string) => THREE.Light | undefined,
) => void = (
  lights: readonly IAutoMovieLight[],
  clips: readonly IAutoMovieClip[],
  seconds: number,
  resolve: (light: string) => THREE.Light | undefined,
): void => {
  for (const light of resolveShotLighting({ lights, clips, seconds })) {
    const target: THREE.Light | undefined = resolve(light.id);
    if (target === undefined) continue;
    applyLightState(target, light);
  }
};
