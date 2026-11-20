import { HumanColliders, StrikingBody } from "@automovie/motions";
import { strict as assert } from "node:assert";
import { Group, PointLight } from "three";

import { BakedTake } from "../src/baked/BakedTake";
import { PlaygroundPerformance } from "../src/playground/package/PlaygroundPerformance";
import { SCENES } from "../src/scenes/SCENES";
import { SCENE_FPS } from "../src/scenes/SCENE_FPS";
import { SceneTake } from "../src/scenes/SceneTake";
import { SceneTrack } from "../src/scenes/SceneTrack";
import { SceneArchetype } from "../src/scenes/package/SceneArchetype";
import { scenePracticalLight } from "../src/scenes/package/scenePracticalLight";
import type { IScene } from "../src/scenes/structures/IScene";
import { TakeCompute } from "../src/takes/package/TakeCompute";

/**
 * Check the site-rate observations for authored office and recovery actions.
 *
 * Scenarios:
 * 1. The office's visible rocker reaches its native limit. Its lamp follows
 *    the same take's press cue at the endpoint and when rewinding.
 * 2. Both published body combinations hold Eve's palm on her hip
 *    between the rise and the wipe. The original hard push still refuses.
 */
export function checkEverydayScenes(): void {
  const office: IScene = SCENES.find((scene) => scene.id === "office")!;
  const officeComposition = SceneTake.apply(
    office.composition!,
    office.takes[0]!,
  );
  const response = TakeCompute.take(officeComposition, SCENE_FPS);
  assert(
    "track" in response,
    "message" in response ? response.message : undefined,
  );
  const officeTake = BakedTake.decode(BakedTake.encode(response));
  const pressed = officeTake.timeline.tracks
    .find((track) => track.subject === "eli")!
    .spans.find((span) => span.name === "operate")!
    .events.find((cue) => cue.name === "stroke")!.seconds;
  const propIndex =
    officeTake.figures.length + officeTake.props.indexOf("switch");
  const partAt = (seconds: number): SceneTrack.IPlacement =>
    SceneTrack.sample(officeTake.track, seconds)[propIndex]!.find(
      (part) => part.bone === SceneTrack.PROP_PART + "face",
    )!;
  const rocker = SceneArchetype.model(
    officeComposition.objects!.find((object) => object.subject === "switch")!,
  );
  const limit = rocker.affordance("press").travel!;
  assert(
    Math.abs(
      partAt(0).position[2] - partAt(officeTake.duration).position[2] - limit,
    ) < 1e-7,
    "the visible face must travel exactly to the switch's limit",
  );
  assert(
    Math.abs(partAt(0).position[2] - partAt(pressed).position[2] - limit) <=
      0.0005,
    "the visible face must reach the limit at the light cue, within track resolution",
  );

  const light = office.practicalLights![0]!;
  const fixture = SceneArchetype.model(
    officeComposition.objects!.find((object) => object.subject === light.prop)!,
  );
  const group = new Group();
  const seekLight = scenePracticalLight(
    group,
    fixture,
    officeTake.timeline,
    light,
  );
  const bulb = group.children[0];
  assert(bulb instanceof PointLight);
  seekLight(pressed - 1e-6);
  assert.equal(bulb.intensity, 0);
  seekLight(pressed);
  assert.equal(bulb.intensity, light.intensity);
  seekLight(officeTake.duration);
  assert.equal(bulb.intensity, light.intensity);
  seekLight(0);
  assert.equal(bulb.intensity, 0);

  const fall: IScene = SCENES.find((scene) => scene.id === "fall-and-rise")!;
  for (const choice of [fall.takes[0]!, fall.takes[2]!]) {
    const composition = SceneTake.apply(fall.composition!, choice);
    const { performance } = PlaygroundPerformance.build(composition);
    const eve = performance.segments("eve");
    const touch = eve.find((segment) => segment.name === "touch")!;
    const at = (name: string): number =>
      touch.start +
      touch.plan.duration *
        touch.plan.events.find((event) => event.name === name)!.share;
    const body = touch.context.body;
    const ready = at("ready");
    const relax = at("relax");
    assert(eve.find((segment) => segment.name === "kneel")!.end <= ready);
    assert(eve.find((segment) => segment.name === "wipe")!.start > relax);
    for (
      let frame = Math.ceil(ready * SCENE_FPS);
      frame < relax * SCENE_FPS;
      frame++
    ) {
      const bones = performance.bones("eve", frame / SCENE_FPS);
      const hand = new Map([["rightHand" as const, bones.get("rightHand")!]]);
      // The visible hip is a physical patch. Read its central skin point on
      // the posed pelvis independently of the aim used to bring the hand in.
      const target = StrikingBody.region(body, bones, "hipRight");
      const distance = HumanColliders.distance(
        body,
        hand,
        target.point,
      ).distance;
      assert(
        distance <= 0 && distance >= -0.005,
        `${choice.label}: palm-to-hip distance ${distance} m`,
      );
    }
    const stagger = composition.performers
      .find((person) => person.subject === "dee")!
      .actions.find((action) => action.name === "stagger")!;
    stagger.params = { speed: 1.2 };
    const refused = TakeCompute.take(composition, SCENE_FPS);
    assert(
      !("track" in refused) &&
        refused.act === "stagger" &&
        refused.axis === "speed",
    );
  }
}
