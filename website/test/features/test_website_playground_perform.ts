import type { IAutoMovieMotionHumanPerformance } from "@automovie/interface";
import { HumanPerformance, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import type { IPlaygroundAdapter } from "../../src/playground/IPlaygroundAdapter";
import { PlaygroundAddress } from "../../src/playground/PlaygroundAddress";
import { applyPlaygroundFix } from "../../src/playground/applyPlaygroundFix";
import { changePlaygroundPerformer } from "../../src/playground/changePlaygroundPerformer";
import { findPlaygroundRefusedAction } from "../../src/playground/findPlaygroundRefusedAction";
import { PlaygroundBodies } from "../../src/playground/package/PlaygroundBodies";
import { PlaygroundChain } from "../../src/playground/package/PlaygroundChain";
import { performPlaygroundComposition } from "../../src/playground/performPlaygroundComposition";
import type { IPlaygroundComposition } from "../../src/playground/structures/IPlaygroundComposition";
import type { IPlaygroundRefusal } from "../../src/playground/structures/IPlaygroundRefusal";
import { SCENES } from "../../src/scenes/SCENES";
import type { IScene } from "../../src/scenes/structures/IScene";

/**
 * The playground's composition data becomes a performance of `@automovie/motions`, and a refusal is placed on the action it names and repaired from its own alternatives.
 *
 * Scenarios:
 * 1. The dance circle, a scene of three people that plans in under a second, plans on the installed package: each performer's placed actions are the scene's actions in order, and the film is longer than zero seconds. Every other scene is planned in the browser when its view is seen, and a refusal its record does not mark with `refusedUntil` shows there as an error.
 * 2. A composition without any action is not handed to the package; building it throws with a message that says to add an action.
 * 3. An action name the vocabulary lacks is refused by the package itself, as a `HumanRefusal` on the axis `act` whose alternatives include `stand`.
 * 4. That refusal is found on the action that caused it and on no other, and applying the alternative `stand` gives a composition that plans.
 * 5. The page's actual request helper returns an error for an empty or whitespace impulse subject before publishing an address or calling the adapter. A corrected retry publishes the same impulse composition before returning the adapter's unchanged result.
 * 6. Browser history and adapter failures return their original messages through the same result path, so the page can leave its building state without weakening address admission.
 */
export async function test_website_playground_perform(): Promise<void> {
  const perform = (
    composition: IPlaygroundComposition,
  ): IAutoMovieMotionHumanPerformance => {
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
    const performance: IAutoMovieMotionHumanPerformance = perform(base);
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

  // 5. Editable inputs use the same admission boundary as shareable links.
  const impulsed: IPlaygroundComposition | null | undefined = SCENES.find(
    (scene: IScene): boolean => scene.id === "balance-impulse",
  )?.composition;
  if (impulsed === null || impulsed === undefined || !impulsed.forces?.length)
    throw new Error("The impulse scene must carry its authored impulse");
  const answer: IPlaygroundAdapter.Result = { kind: "refusal", refusal };
  const order: string[] = [];
  const published: string[] = [];
  let requests: number = 0;
  const adapter: Pick<IPlaygroundAdapter, "perform"> = {
    perform: async (
      received: IPlaygroundComposition,
    ): Promise<IPlaygroundAdapter.Result> => {
      requests++;
      order.push("perform");
      TestValidator.predicate(
        "the adapter receives the edited input",
        received === impulsed,
      );
      return answer;
    },
  };
  const write: (hash: string) => void = (hash: string): void => {
    order.push("address");
    published.push(hash);
  };
  for (const subject of ["", "  "]) {
    const invalid: IPlaygroundComposition = changePlaygroundPerformer(
      impulsed,
      0,
      { subject },
    );
    const failed: IPlaygroundAdapter.Result =
      await performPlaygroundComposition(adapter, invalid, write);
    TestValidator.predicate(
      "an invalid impulse subject gives a visible error result",
      failed.kind === "refusal" &&
        failed.refusal.kind === "error" &&
        failed.refusal.message.length !== 0,
    );
  }
  TestValidator.equals(
    "invalid inputs neither publish nor request a take",
    [published.length, requests],
    [0, 0],
  );
  const retried: IPlaygroundAdapter.Result = await performPlaygroundComposition(
    adapter,
    impulsed,
    write,
  );
  TestValidator.predicate(
    "a corrected retry returns the adapter result unchanged",
    retried === answer,
  );
  TestValidator.equals(
    "the admitted address is published before its take",
    order,
    ["address", "perform"],
  );
  TestValidator.equals(
    "the published address retains the impulses",
    PlaygroundAddress.decode(published[0]!),
    impulsed,
  );

  // 6. Neither a browser failure nor an unexpected request rejection strands the page.
  const historyFailure: IPlaygroundAdapter.Result =
    await performPlaygroundComposition(adapter, impulsed, (): void => {
      throw new Error("history unavailable");
    });
  TestValidator.predicate(
    "a history failure is an error and makes no take request",
    historyFailure.kind === "refusal" &&
      historyFailure.refusal.kind === "error" &&
      historyFailure.refusal.message === "history unavailable" &&
      requests === 1,
  );
  const requestFailure: IPlaygroundAdapter.Result =
    await performPlaygroundComposition(
      {
        perform: async (): Promise<IPlaygroundAdapter.Result> => {
          throw new Error("worker unavailable");
        },
      },
      impulsed,
      (): void => {},
    );
  TestValidator.predicate(
    "a rejected request is an error result with its original message",
    requestFailure.kind === "refusal" &&
      requestFailure.refusal.kind === "error" &&
      requestFailure.refusal.message === "worker unavailable",
  );
}
