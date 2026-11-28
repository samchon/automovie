import { AutoMovieEngineChain, AutoMovieEngineComposition } from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieIntent,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieEngineComposition` builds composition nodes from parts: an intent is
 * wrapped, a node is kept, and a chain contributes its node.
 *
 * Scenarios:
 *
 * 1. `of` wraps an intent, keeps a node as it is and unwraps a chain.
 * 2. `sequence` and `parallel` turn every part into a node, in order.
 * 3. `at` anchors a part with a zero offset by default and carries the given
 *    offset, event and occurrence index.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the accepted input forms, stable ordering and explicit or default event alignment fields.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public of, sequence, parallel and at builders with an intent, a composition node and a chain, then compares the returned records.
 * @evidence contracts/development/testing.md#independent-expectations Literal tagged nodes preserve each fixture part in its declared position. The anchored examples separately require default offset 0 and supplied offset -0.5 with event impact at index 1.
 */
export function test_engine_composition_composition(): void {
  const act: IAutoMovieIntent = { subject: "a", capability: "reach" };
  const wrapped: IAutoMovieComposition = { type: "intent", intent: act };
  const nested: IAutoMovieComposition = { type: "sequence", parts: [wrapped] };

  TestValidator.equals(
    "of wraps an intent, keeps a node and unwraps a chain",
    [
      AutoMovieEngineComposition.of(act),
      AutoMovieEngineComposition.of(nested),
      AutoMovieEngineComposition.of(AutoMovieEngineChain.of(act)),
    ],
    [wrapped, nested, wrapped],
  );
  TestValidator.equals(
    "sequence and parallel take every part in order",
    [
      AutoMovieEngineComposition.sequence(act, nested),
      AutoMovieEngineComposition.parallel(nested, act),
    ],
    [
      { type: "sequence", parts: [wrapped, nested] },
      { type: "parallel", parts: [nested, wrapped] },
    ],
  );
  TestValidator.equals(
    "at anchors a part, offset zero by default",
    [
      AutoMovieEngineComposition.at("k", act),
      AutoMovieEngineComposition.at("k", act, -0.5, { event: "impact", index: 1 }),
    ],
    [
      { type: "at", anchor: "k", offset: 0, part: wrapped },
      {
        type: "at",
        anchor: "k",
        offset: -0.5,
        part: wrapped,
        event: "impact",
        index: 1,
      },
    ],
  );
}
