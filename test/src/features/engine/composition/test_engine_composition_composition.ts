import { AutoMovieChain, AutoMovieComposition } from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieIntent,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieComposition` builds composition nodes from parts: an intent is
 * wrapped, a node is kept, and a chain contributes its node.
 *
 * Scenarios:
 *
 * 1. `of` wraps an intent, keeps a node as it is and unwraps a chain.
 * 2. `sequence` and `parallel` turn every part into a node, in order.
 * 3. `at` anchors a part with a zero offset by default and carries the given
 *    offset, event and occurrence index.
 */
export function test_engine_composition_composition(): void {
  const act: IAutoMovieIntent = { subject: "a", capability: "reach" };
  const wrapped: IAutoMovieComposition = { kind: "intent", intent: act };
  const nested: IAutoMovieComposition = { kind: "sequence", parts: [wrapped] };

  TestValidator.equals(
    "of wraps an intent, keeps a node and unwraps a chain",
    [
      AutoMovieComposition.of(act),
      AutoMovieComposition.of(nested),
      AutoMovieComposition.of(AutoMovieChain.of(act)),
    ],
    [wrapped, nested, wrapped],
  );
  TestValidator.equals(
    "sequence and parallel take every part in order",
    [
      AutoMovieComposition.sequence(act, nested),
      AutoMovieComposition.parallel(nested, act),
    ],
    [
      { kind: "sequence", parts: [wrapped, nested] },
      { kind: "parallel", parts: [nested, wrapped] },
    ],
  );
  TestValidator.equals(
    "at anchors a part, offset zero by default",
    [
      AutoMovieComposition.at("k", act),
      AutoMovieComposition.at("k", act, -0.5, { event: "impact", index: 1 }),
    ],
    [
      { kind: "at", anchor: "k", offset: 0, part: wrapped },
      {
        kind: "at",
        anchor: "k",
        offset: -0.5,
        part: wrapped,
        event: "impact",
        index: 1,
      },
    ],
  );
}
