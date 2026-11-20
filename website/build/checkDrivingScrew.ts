import { ArchetypeFrame } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import { strict as assert } from "node:assert";

import { PlaygroundPerformance } from "../src/playground/package/PlaygroundPerformance";
import { SCENES } from "../src/scenes/SCENES";
import { SceneTake } from "../src/scenes/SceneTake";
import { SceneArchetype } from "../src/scenes/package/SceneArchetype";

/** Check the displayed screwdriver tip against the named bench on both published bodies. */
export function checkDrivingScrew(): void {
  const scene = SCENES.find(({ id }) => id === "driving-a-screw")!;
  for (const take of [scene.takes[0]!, scene.takes[2]!]) {
    const composition = SceneTake.apply(scene.composition!, take);
    const { performance } = PlaygroundPerformance.build(composition);
    const segments = performance.segments("w5");
    const screw = segments.find(({ name }) => name === "screw")!;
    assert(
      segments.some(({ name, end }) => name === "pickUp" && end <= screw.start),
    );
    const mounted = (subject: string, id: string, at: number) => {
      const data = composition.objects!.find(
        (object) => object.subject === subject,
      )!;
      const model = SceneArchetype.model(data);
      const frame = performance.prop(subject, at);
      return ArchetypeFrame.compose(
        {
          translation: frame.position,
          rotation: frame.rotation,
          scale: { x: 1, y: 1, z: 1 },
        },
        model.affordance(id).frame,
      ).translation;
    };
    const contacts = screw.plan.events.filter(
      ({ name }) => name === "ready" || name.startsWith("contact"),
    );
    assert(contacts.length > 1, take.label);
    for (const event of contacts) {
      const at = screw.start + screw.plan.duration * event.share;
      const tip = mounted("driver", "face", at);
      const work = mounted("bench", "top", at);
      assert(
        Vector3.distance(tip, work) <= 0.01,
        take.label + " " + event.name,
      );
    }
    performance.bones("w5", screw.end);
  }
}
