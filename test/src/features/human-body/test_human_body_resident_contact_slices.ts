import { measureAutoMovieModelCrossings } from "@automovie/engine";
import {
  type IAutoMovieHumanBodyBasisDocument,
  createHumanBodyBasisBuilder,
  segmentHumanBodyModel,
  serializeHumanBodyBasisDocument,
} from "@automovie/human";
import { createConnectedBodyRuntime } from "@automovie/playground/src/human/connectedBodyRuntime";
import { TestValidator } from "@nestia/e2e";

import { humanBodyTrunkArmFixture } from "../internal/humanBodyTrunkArmFixture";

/**
 * The resident body worker takes a contact reading in slices, so a request
 * that arrives while it reads is evaluated before the reading ends, and the
 * reading it supersedes is abandoned.
 *
 * On the trunk-and-arm fixture with the left arm hanging straight down, the
 * arm block passes through the trunk block.
 *
 * Scenarios:
 * 1. A reading with the default slice, and one yielding to the thread after
 *    every segment and pair, each equal one `measureAutoMovieModelCrossings`
 *    call with `withinParts` over the same segmented build, entries and
 *    order, and it is not empty.
 * 2. With a slice of 0 and a yield the test releases by hand, a preview
 *    asked for while the reading waits at its first slice resolves first,
 *    and the reading then answers with no reading (`crossings: null`) while
 *    still returning its preview model; superseded after its first slice,
 *    between two pairs, it answers none too.
 * 3. A reading nothing supersedes, taken through the same hand-released
 *    yield, completes with the full reading.
 */
export const test_human_body_resident_contact_slices =
  async (): Promise<void> => {
    const basis = humanBodyTrunkArmFixture(0.24);
    const document: IAutoMovieHumanBodyBasisDocument = {
      id: "contact",
      name: "Contact",
      basis: basis.id,
      shape: {},
      shoulders: [
        { bone: "leftUpperArm", plane: 0, elevation: 0, axialRotation: 0 },
      ],
    };
    const text = serializeHumanBodyBasisDocument(document);
    const expected = measureAutoMovieModelCrossings(
      segmentHumanBodyModel(basis, createHumanBodyBasisBuilder(basis)(document))
        .model,
      { withinParts: true },
    );
    TestValidator.predicate(
      "the hanging arm crosses the trunk",
      expected.length > 0,
    );
    const whole = await createConnectedBodyRuntime(basis)({
      operation: "preview",
      document: text,
      measure: true,
    });
    if (whole.operation !== "preview") throw new Error("Expected preview.");
    TestValidator.equals(
      "sliced reading equals one call",
      whole.crossings,
      expected,
    );
    const everyPair = await createConnectedBodyRuntime(basis, { sliceMs: 0 })({
      operation: "preview",
      document: text,
      measure: true,
    });
    if (everyPair.operation !== "preview") throw new Error("Expected preview.");
    TestValidator.equals(
      "yielding after every pair reads the same",
      everyPair.crossings,
      expected,
    );

    const releases: ((value: undefined) => void)[] = [];
    const runtime = createConnectedBodyRuntime(basis, {
      sliceMs: 0,
      yieldThread: () =>
        new Promise<undefined>((resolve) => {
          releases.push(resolve);
        }),
    });
    const order: string[] = [];
    const reading = runtime({
      operation: "preview",
      document: text,
      measure: true,
    }).then((result) => {
      order.push("reading");
      return result;
    });
    // let the reading reach its first slice
    while (releases.length === 0) await Promise.resolve();
    const preview = runtime({
      operation: "preview",
      document: text,
      measure: false,
    }).then((result) => {
      order.push("preview");
      return result;
    });
    await preview;
    releases.shift()!(undefined);
    const abandoned = await reading;
    if (abandoned.operation !== "preview") throw new Error("Expected preview.");
    TestValidator.equals("the later preview answers first", order, [
      "preview",
      "reading",
    ]);
    TestValidator.equals(
      "a superseded reading answers none",
      abandoned.crossings,
      null,
    );
    TestValidator.predicate(
      "the superseded reading still returns its model",
      abandoned.model.parts.length > 0,
    );

    // superseded inside the pair loop: the first slice (a segment against
    // itself) passes, the second (the first pair) is where the preview lands
    const late = runtime({
      operation: "preview",
      document: text,
      measure: true,
    });
    while (releases.length === 0) await Promise.resolve();
    releases.shift()!(undefined);
    while (releases.length === 0) await Promise.resolve();
    await runtime({ operation: "preview", document: text, measure: false });
    releases.shift()!(undefined);
    const lateResult = await late;
    if (lateResult.operation !== "preview")
      throw new Error("Expected preview.");
    TestValidator.equals(
      "a reading superseded between pairs answers none",
      lateResult.crossings,
      null,
    );

    const alone = runtime({
      operation: "preview",
      document: text,
      measure: true,
    });
    let settled = false;
    void alone.then(() => (settled = true));
    while (!settled) {
      await Promise.resolve();
      releases.shift()?.(undefined);
    }
    const complete = await alone;
    if (complete.operation !== "preview") throw new Error("Expected preview.");
    TestValidator.equals(
      "an unsuperseded reading completes",
      complete.crossings,
      expected,
    );
  };
