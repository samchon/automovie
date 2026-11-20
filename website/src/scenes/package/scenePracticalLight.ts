import type { IAutoMovieAffordance } from "@automovie/interface";
import { type Group, PointLight } from "three";

import type { IPlaygroundTimeline } from "../../playground/structures/IPlaygroundTimeline";
import type { IScene } from "../structures/IScene";
import type { SceneArchetype } from "./SceneArchetype";

/**
 * Mount an authored practical light at its prop's emitter and link its
 * intensity to the take's switch cue. Seeking before the cue turns it off.
 *
 * @param group The prop's moving world frame.
 * @param model The prop that owns the fixed emitter.
 * @param timeline The published take's film clock.
 * @param binding The emitter and its switching cue.
 * @returns A reader that sets the light for a film second.
 * @throws {Error} When the emitter or the switching cue does not resolve.
 */
export function scenePracticalLight(
  group: Group,
  model: SceneArchetype.Model,
  timeline: IPlaygroundTimeline,
  binding: IScene.IPracticalLight,
): (seconds: number) => void {
  const emitter: IAutoMovieAffordance | undefined = model.affordances.find(
    (candidate): boolean => candidate.id === binding.emitter,
  );
  if (emitter === undefined || emitter.rides !== undefined)
    throw new Error(
      `No fixed light emitter "${binding.emitter}" on "${binding.prop}".`,
    );
  const event: IPlaygroundTimeline.IEvent | undefined = timeline.tracks
    .find((track): boolean => track.subject === binding.on.subject)
    ?.spans.find((span): boolean => span.id === binding.on.action)
    ?.events.find((cue): boolean => cue.name === binding.on.event);
  if (event === undefined)
    throw new Error(
      `No light cue "${binding.on.subject}.${binding.on.action}.${binding.on.event}".`,
    );
  const light: PointLight = new PointLight(binding.color, 0);
  light.position.set(
    emitter.frame.translation.x,
    emitter.frame.translation.y,
    emitter.frame.translation.z,
  );
  group.add(light);
  return (seconds: number): void => {
    light.intensity = seconds >= event.seconds ? binding.intensity : 0;
  };
}
