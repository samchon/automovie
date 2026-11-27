import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { strict as assert } from "node:assert";

import { PlaygroundPerformance } from "../src/playground/package/PlaygroundPerformance";
import type { IPlaygroundComposition } from "../src/playground/structures/IPlaygroundComposition";
import { SCENES } from "../src/scenes/SCENES";
import { SceneTake } from "../src/scenes/SceneTake";
import { SceneArchetype } from "../src/scenes/package/SceneArchetype";
import type { IScene } from "../src/scenes/structures/IScene";
import { sceneAffordanceFrame } from "./sceneAffordanceFrame";

/** The working contact bound between the tip and the bench top, metres. */
const TIP: number = 0.01;

/**
 * Check the displayed screwdriver tip against the named bench on both
 * published bodies.
 *
 * Scenarios:
 * 1. The screwdriver is picked up before the screw action begins.
 * 2. At the screw's `ready` and every `contact` event the tip is at the
 *    bench top; there is more than one such event.
 * 3. The pose at the screw's end resolves.
 */
export function checkDrivingScrew(): void {
  const scene: IScene = SCENES.find(
    ({ id }: IScene): boolean => id === "driving-a-screw",
  )!;
  for (const take of [scene.takes[0]!, scene.takes[2]!]) {
    const composition: IPlaygroundComposition = SceneTake.apply(
      scene.composition!,
      take,
    );
    const { performance }: PlaygroundPerformance.IBuilt =
      PlaygroundPerformance.build(composition);
    const segments: readonly IAutoMovieMotionHumanSegment[] =
      performance.segments("w5");
    const screw: IAutoMovieMotionHumanSegment = segments.find(
      ({ name }: IAutoMovieMotionHumanSegment): boolean => name === "screw",
    )!;
    assert(
      segments.some(
        ({ name, end }: IAutoMovieMotionHumanSegment): boolean =>
          name === "pickUp" && end <= screw.start,
      ),
      take.label + " picks the driver up first",
    );
    const contacts: IAutoMovieMotionEvent[] = screw.plan.events.filter(
      ({ name }: IAutoMovieMotionEvent): boolean =>
        name === "ready" || name.startsWith("contact"),
    );
    assert(contacts.length > 1, take.label);
    for (const event of contacts) {
      const at: number = screw.start + screw.plan.duration * event.share;
      const tip: IAutoMovieVector3 = mounted(
        performance,
        composition,
        "driver",
        "face",
        at,
      );
      const work: IAutoMovieVector3 = mounted(
        performance,
        composition,
        "bench",
        "top",
        at,
      );
      assert(AutoMovieEngineVector3.distance(tip, work) <= TIP, take.label + " " + event.name);
    }
    performance.bones("w5", screw.end);
  }
}

/** A placed prop's affordance origin in the world at a film second, metres. */
function mounted(
  performance: IAutoMovieMotionHumanPerformance,
  composition: IPlaygroundComposition,
  subject: string,
  id: string,
  at: number,
): IAutoMovieVector3 {
  const model: SceneArchetype.Model = SceneArchetype.model(
    composition.objects!.find(
      (object: IPlaygroundComposition.IObject): boolean =>
        object.subject === subject,
    )!,
  );
  return sceneAffordanceFrame(performance, model, subject, id, at).pose
    .translation;
}
