import { AutoMovieEngineChain } from "@automovie/engine";
import type {
  IAutoMovieChain,
  IAutoMovieComposition,
  IAutoMovieIntent,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieEngineChain` composes immutably: `next` appends to a sequence and `with`
 * to a parallel group, each flattening only a head of its own kind, and every
 * step returns a new chain of the caller's own class.
 *
 * Scenarios:
 *
 * 1. `of(reach).next(turn).next(nod)` is one flat three-part sequence, and the
 *    first chain still holds the lone intent.
 * 2. `next` after `with` nests: the parallel group becomes the sequence's first
 *    part rather than being flattened into it.
 * 3. A subclass adding its own verb keeps that verb after `next` and `with`.
 */
export function test_engine_composition_chain(): void {
  const act = (capability: string): IAutoMovieIntent => ({
    subject: "a",
    capability,
  });
  const intent = (capability: string): IAutoMovieComposition => ({
    type: "intent",
    intent: act(capability),
  });

  const first: IAutoMovieChain = AutoMovieEngineChain.of(act("reach"));
  const sequence: IAutoMovieChain = first.next(act("turn")).next(act("nod"));
  TestValidator.equals(
    "next flattens a sequence head and leaves the first chain alone",
    [first.node, sequence.node],
    [
      intent("reach"),
      {
        type: "sequence",
        parts: [intent("reach"), intent("turn"), intent("nod")],
      },
    ],
  );

  TestValidator.equals(
    "next after with nests the parallel group",
    first.with(act("watch")).with(act("wait")).next(act("turn")).node,
    {
      type: "sequence",
      parts: [
        {
          type: "parallel",
          parts: [intent("reach"), intent("watch"), intent("wait")],
        },
        intent("turn"),
      ],
    },
  );

  /** A production chain with a verb of its own. */
  class Performer extends AutoMovieEngineChain {
    public turn(): Performer {
      return this.next(act("turn"));
    }
  }
  const own: Performer = new Performer(first.node).with(act("watch")).turn();
  TestValidator.equals(
    "a subclass keeps its own verb after every step",
    own.turn().node,
    {
      type: "sequence",
      parts: [
        { type: "parallel", parts: [intent("reach"), intent("watch")] },
        intent("turn"),
        intent("turn"),
      ],
    },
  );
}
