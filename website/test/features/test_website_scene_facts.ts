import { TestValidator } from "@nestia/e2e";

import type { IPlaygroundComposition } from "../../src/playground/structures/IPlaygroundComposition";
import { SceneFacts } from "../../src/scenes/SceneFacts";
import type { IScene } from "../../src/scenes/structures/IScene";

/**
 * A scene page names the ways its scene composes actions, read from the record.
 *
 * Scenarios:
 * 1. A scene that uses every feature lists them all, in the page's order: performed over another action, cut early and redirected, timed to another person's instant, done together, seated, riding, with a placed object.
 * 2. A scene of plain sequences lists none.
 */
export function test_website_scene_facts(): void {
  const scene: (composition: IPlaygroundComposition) => IScene = (
    composition: IPlaygroundComposition,
  ): IScene => ({
    id: "facts",
    title: "Facts",
    summary: "A record for the test.",
    setting: "everyday",
    cast: composition.performers.map(
      (p: IPlaygroundComposition.IPerformer): IScene.ICast => ({
        subject: p.subject,
        role: "person",
      }),
    ),
    composition,
    takes: [],
    camera: { view: "three-quarter" },
    needs: [],
  });
  const person: (
    subject: string,
    actions: IPlaygroundComposition.IAction[],
  ) => IPlaygroundComposition.IPerformer = (
    subject: string,
    actions: IPlaygroundComposition.IAction[],
  ): IPlaygroundComposition.IPerformer => ({
    subject,
    body: "f1",
    x: 0,
    z: 0,
    yaw: 0,
    proficiency: "trained",
    actions,
  });

  // 1. Every feature.
  TestValidator.equals(
    "every feature, in order",
    SceneFacts.features(
      scene({
        version: 2,
        seed: "facts",
        performers: [
          person("a", [
            { name: "sit", params: { seat: { $seat: "chair" } } },
            { name: "pickUp", params: { prop: "mug" } },
            { name: "ride", params: { on: "horse", seconds: 2 } },
          ]),
          person("b", [
            {
              name: "walk",
              params: { to: { x: 0, y: 0, z: 2 } },
              until: { share: 0.5 },
              over: [{ name: "gesture", params: { kind: "wave" } }],
            },
            {
              name: "look",
              params: { seconds: 1 },
              sync: { of: "cue", event: "contact" },
            },
          ]),
        ],
        mutuals: [
          { name: "toast", cast: { host: "a", guest: "b" }, params: {} },
        ],
        objects: [
          { subject: "chair", producer: "createSeat", x: 0, z: 1, yaw: 0 },
          { subject: "mug", producer: "createDrinkware", x: 1, z: 1, yaw: 0 },
        ],
      }),
    ),
    [
      "performed over another action",
      "cut early and redirected",
      "timed to another person's instant",
      "done together",
      "seated",
      "riding",
      "with a placed object",
    ],
  );

  // 2. Plain sequences.
  TestValidator.equals(
    "a plain sequence lists none",
    SceneFacts.features(
      scene({
        version: 1,
        seed: "plain",
        performers: [
          person("a", [
            { name: "walk", params: { to: { x: 0, y: 0, z: 2 } } },
            { name: "stand", params: { seconds: 1 } },
          ]),
        ],
        mutuals: [],
      }),
    ),
    [],
  );
}
