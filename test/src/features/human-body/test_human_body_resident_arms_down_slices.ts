import {
  type IAutoMovieHumanBodyBasisDocument,
  createHumanBodyBasisBuilder,
  serializeHumanBodyBasisDocument,
  solveHumanBodyArmsDown,
} from "@automovie/human";
import { createConnectedBodyRuntime } from "@automovie/playground/src/human/connectedBodyRuntime";
import { TestValidator } from "@nestia/e2e";

import { humanBodyTrunkArmFixture } from "../internal/humanBodyTrunkArmFixture";
import { rejectsError } from "../internal/predicates";

/**
 * The resident body worker solves arms down a step at a time, handing its
 * thread back between steps, so a later request is evaluated during the
 * solve and supersedes it.
 *
 * Scenarios, on the trunk-and-arm fixture with a yield the test releases by
 * hand and a slice of 0:
 * 1. A solve nothing supersedes answers what `solveHumanBodyArmsDown` does.
 * 2. A preview asked for while the solve waits between steps answers first,
 *    and the solve then refuses as superseded.
 */
export const test_human_body_resident_arms_down_slices =
  async (): Promise<void> => {
    const basis = humanBodyTrunkArmFixture(0.24);
    const document: IAutoMovieHumanBodyBasisDocument = {
      id: "arms",
      name: "Arms",
      basis: basis.id,
      shape: {},
    };
    const text = serializeHumanBodyBasisDocument(document);
    const expected = solveHumanBodyArmsDown(
      basis,
      createHumanBodyBasisBuilder(basis),
      document,
    );
    const releases: ((value: undefined) => void)[] = [];
    const runtime = createConnectedBodyRuntime(basis, {
      sliceMs: 0,
      yieldThread: () =>
        new Promise<undefined>((resolve) => {
          releases.push(resolve);
        }),
    });

    const alone = runtime({ operation: "armsDown", document: text });
    let settled = false;
    void alone.then(() => (settled = true));
    let yields = 0;
    while (!settled) {
      await Promise.resolve();
      const release = releases.shift();
      if (release !== undefined) {
        yields++;
        release(undefined);
      }
    }
    const solved = await alone;
    if (solved.operation !== "armsDown") throw new Error("Expected arms down.");
    TestValidator.equals(
      "the stepped solve answers the synchronous one",
      { pose: solved.pose, shoulders: solved.shoulders },
      { pose: expected.pose ?? [], shoulders: expected.shoulders ?? [] },
    );
    TestValidator.predicate("the solve yielded between steps", yields > 1);

    const order: string[] = [];
    const superseded = runtime({
      operation: "armsDown",
      document: text,
    }).finally(() => order.push("solve"));
    while (releases.length === 0) await Promise.resolve();
    await runtime({ operation: "preview", document: text, measure: false });
    order.push("preview");
    releases.shift()!(undefined);
    TestValidator.predicate(
      "a superseded solve refuses",
      await rejectsError(() => superseded, "superseded"),
    );
    TestValidator.equals("the later preview answers first", order, [
      "preview",
      "solve",
    ]);
  };
