import {
  createCyclingHelmet,
  createDiveMask,
  createScubaSet,
  createSnorkel,
  createSwimFin,
  createTransitionRack,
  createWearable,
} from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * The water-sport and triathlon gear producers expose the contacts their
 * motions read, sized by their own drawn dimensions.
 *
 * Scenarios:
 * 1. A fin's blade face is its drawn length by width, and its pocket is a
 *    socket for the foot.
 * 2. A snorkel's top stands its drawn length above the mouthpiece.
 * 3. A mask, a scuba set and a cycling helmet carry their wear sockets; the
 *    helmet is also a saved wearable kind with the same contacts.
 * 4. A transition rack's bar top is at its drawn height.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names each producer and the contact it is checked for.
 * @evidence contracts/development/testing.md#behavioral-verification Builds each archetype and reads its affordances and dimensions.
 * @evidence contracts/development/testing.md#independent-expectations Each expectation is the producer's own drawn dimension or the contact a law requires.
 * @evidence contracts/development/testing.md#distinguishing-cases Two fin sizes and every new producer.
 * @evidence contracts/development/testing.md#execution-ownership In-memory archetypes only.
 */
export function test_archetype_aquatic_gear(): void {
  for (const length of [0.3, 0.45]) {
    const fin: ReturnType<typeof createSwimFin> = createSwimFin({ length }, 1);
    const blade: IAutoMovieAffordance = fin.affordance("blade");
    TestValidator.predicate(
      `the ${length} m fin's blade face is its drawn area`,
      nclose(
        (blade.width ?? 0) * (blade.depth ?? 0),
        length * fin.dimensions.width!,
        1e-9,
      ) && fin.affordance("wear").kind === "socket",
    );
  }
  const snorkel: ReturnType<typeof createSnorkel> = createSnorkel({}, 1);
  TestValidator.predicate(
    "the snorkel's top stands its length above the mouthpiece",
    nclose(
      snorkel.affordance("top").frame.translation.y -
        snorkel.affordance("wear").frame.translation.y,
      snorkel.dimensions.length!,
      1e-9,
    ),
  );
  for (const [name, model] of [
    ["mask", createDiveMask({}, 1)],
    ["scuba set", createScubaSet({}, 1)],
    ["helmet", createCyclingHelmet({}, 1)],
    ["saved helmet", createWearable({ kind: "helmet" }, 1)],
  ] as const)
    TestValidator.predicate(
      `the ${name} has a wear socket`,
      model.affordances.some(
        (a: IAutoMovieAffordance): boolean =>
          a.id === "wear" && a.kind === "socket",
      ),
    );
  const rack: ReturnType<typeof createTransitionRack> = createTransitionRack(
    { height: 0.95 },
    1,
  );
  TestValidator.predicate(
    "the rack's bar top is at its drawn height",
    nclose(rack.affordance("bar").frame.translation.y, 0.95, 1e-9),
  );
}
