import { HumanPerformance, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { applyPlaygroundFix } from "../../src/playground/applyPlaygroundFix";
import { findPlaygroundRefusedAction } from "../../src/playground/findPlaygroundRefusedAction";
import { PlaygroundBodies } from "../../src/playground/package/PlaygroundBodies";
import { PlaygroundChain } from "../../src/playground/package/PlaygroundChain";
import type { IPlaygroundComposition } from "../../src/playground/structures/IPlaygroundComposition";
import type { IPlaygroundRefusal } from "../../src/playground/structures/IPlaygroundRefusal";
import { SCENES } from "../../src/scenes/SCENES";
import type { IScene } from "../../src/scenes/structures/IScene";

/**
 * The playground's composition data becomes a performance of `@automovie/motions`, and a refusal is placed on the action it names and repaired from its own alternatives.
 *
 * Scenarios:
 * 1. The dance circle, a scene of three people that plans in under a second, plans on the installed package: each performer's placed actions are the scene's actions in order, and the film is longer than zero seconds. Every other scene is planned by the site's bake, which fails on a refusal.
 * 2. A composition without any action is not handed to the package; building it throws with a message that says to add an action.
 * 3. An action name the vocabulary lacks is refused by the package itself, as a `HumanRefusal` on the axis `act` whose alternatives include `stand`.
 * 4. That refusal is found on the action that caused it and on no other, and applying the alternative `stand` gives a composition that plans.
 */
export function test_website_playground_perform(): void {
  const perform = (composition: IPlaygroundComposition): HumanPerformance => {
    const built: PlaygroundChain.IBuilt = PlaygroundChain.build(composition);
    return new HumanPerformance({
      seed: composition.seed,
      performers: composition.performers.map(
        (performer: IPlaygroundComposition.IPerformer) => ({
          subject: performer.subject,
          body: PlaygroundBodies.get(performer.body).body,
          at: { x: performer.x, y: 0, z: performer.z },
          yaw: performer.yaw,
          proficiency: { level: performer.proficiency },
        }),
      ),
      composition: built.composition,
    });
  };

  // 1. A scene plans.
  const base: IPlaygroundComposition = SCENES.find(
    (scene: IScene): boolean => scene.id === "dance-circle",
  )!.composition!;
  {
    const performance: HumanPerformance = perform(base);
    TestValidator.predicate(
      "the dance circle has a duration",
      performance.duration > 0,
    );
    for (const performer of base.performers)
      TestValidator.equals(
        `the dance circle: ${performer.subject} performs its actions in order`,
        performance
          .segments(performer.subject)
          .map((segment: { name: string }): string => segment.name),
        performer.actions.map(
          (action: IPlaygroundComposition.IAction): string => action.name,
        ),
      );
  }

  // 2. No action.
  let message: string = "";
  try {
    PlaygroundChain.build({
      ...base,
      performers: base.performers.map(
        (
          performer: IPlaygroundComposition.IPerformer,
        ): IPlaygroundComposition.IPerformer => ({ ...performer, actions: [] }),
      ),
    });
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  TestValidator.predicate(
    "a composition without an action says to add one",
    message.includes("add one"),
  );

  // 3. An unknown action is the package's refusal.
  const unknown: IPlaygroundComposition = {
    ...base,
    performers: [
      {
        ...base.performers[0]!,
        actions: [
          { name: "stand", params: {} },
          { name: "levitate", params: {} },
        ],
      },
    ],
  };
  let caught: unknown = null;
  try {
    perform(unknown);
  } catch (error) {
    caught = error;
  }
  if (!(caught instanceof HumanRefusal))
    throw new Error(
      `An unknown action was not refused by the package: ${String(caught)}`,
    );
  TestValidator.equals("the refusal's axis", caught.axis, "act");
  const alternatives: string[] =
    caught.feasible !== null && caught.feasible.kind === "alternatives"
      ? [...caught.feasible.values]
      : [];
  TestValidator.predicate(
    "the refusal offers stand",
    alternatives.includes("stand"),
  );

  // 4. The refusal is located and repaired.
  const refusal: IPlaygroundRefusal = {
    kind: caught.kind,
    message: caught.message,
    performer: caught.performer,
    act: caught.act,
    instance: caught.instance,
    axis: caught.axis,
    value: caught.value,
    feasible: null,
    alternatives,
    fix: caught.fix,
  };
  TestValidator.equals(
    "the refusal is on the unknown action",
    findPlaygroundRefusedAction(unknown, refusal) ===
      unknown.performers[0]!.actions[1],
    true,
  );
  const fixed: IPlaygroundComposition | null = applyPlaygroundFix(
    unknown,
    refusal,
    "stand",
  );
  if (fixed === null)
    throw new Error("The refusal's alternative was not applied");
  TestValidator.equals(
    "the fixed composition performs stand twice",
    perform(fixed)
      .segments(unknown.performers[0]!.subject)
      .map((segment: { name: string }): string => segment.name),
    ["stand", "stand"],
  );
}
