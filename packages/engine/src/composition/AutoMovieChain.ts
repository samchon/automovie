import { AutoMovieComposition } from "./AutoMovieComposition";

/**
 * An immutable composition value with fluent combinators, the return type of
 * a production's subject methods: `a.jab().next(a.cross()).with(b.slip())`.
 *
 * `next` appends in sequence (not `then`, which would make every chain a
 * thenable that `await` unwraps) and `with` joins in parallel; each returns a new
 * chain and never changes this one, so a chain can be shared and reused. A
 * production subclass may add its own vocabulary methods that call `next`
 * with the subject's intents; the engine keeps none.
 */
export class AutoMovieChain {
  /** The composition this chain holds. */
  public readonly node: AutoMovieComposition;

  /**
   * A chain holding a composition.
   *
   * @param node The node.
   */
  public constructor(node: AutoMovieComposition) {
    this.node = node;
    Object.freeze(this);
  }

  /**
   * A chain of one part.
   *
   * @param part An intent, composition or chain.
   * @returns The chain.
   */
  public static of(part: AutoMovieComposition.Part): AutoMovieChain {
    return new AutoMovieChain(AutoMovieComposition.of(part));
  }

  /**
   * This chain followed by parts, flattening a trailing sequence.
   *
   * @param parts The following parts.
   * @returns A new chain.
   */
  public next(...parts: AutoMovieComposition.Part[]): AutoMovieChain {
    const head: readonly AutoMovieComposition[] =
      this.node.kind === "sequence" ? this.node.parts : [this.node];
    return new AutoMovieChain({
      kind: "sequence",
      parts: [...head, ...parts.map(AutoMovieComposition.of)],
    });
  }

  /**
   * This chain together with parts starting at the same instant.
   *
   * @param parts The parallel parts.
   * @returns A new chain.
   */
  public with(...parts: AutoMovieComposition.Part[]): AutoMovieChain {
    const head: readonly AutoMovieComposition[] =
      this.node.kind === "parallel" ? this.node.parts : [this.node];
    return new AutoMovieChain({
      kind: "parallel",
      parts: [...head, ...parts.map(AutoMovieComposition.of)],
    });
  }
}
