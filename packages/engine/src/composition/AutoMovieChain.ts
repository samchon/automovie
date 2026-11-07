import { AutoMovieComposition } from "./AutoMovieComposition";

/**
 * An immutable composition value with fluent combinators, the return type of
 * a production's subject methods: `a.jab().next(a.cross()).with(b.slip())`.
 *
 * `next` appends in sequence (not `then`, which would make every chain a
 * thenable that `await` unwraps) and `with` joins in parallel; each returns a
 * new chain of the same class through {@link derive} and never changes this
 * one, so a chain can be shared and reused. A production subclass adds its
 * own vocabulary methods that call `next` with its subject's intents, so
 * `a.jab().cross()` keeps its vocabulary after every combinator; a subclass
 * whose constructor takes more than the node overrides `derive`. The engine
 * keeps no vocabulary.
 */
export class AutoMovieChain {
  /** The composition this chain holds; never reassigned. */
  public readonly node: AutoMovieComposition;

  /**
   * A chain holding a composition.
   *
   * @param node The node.
   */
  public constructor(node: AutoMovieComposition) {
    this.node = node;
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
   * @returns A new chain of this chain's class.
   */
  public next(...parts: AutoMovieComposition.Part[]): this {
    const head: readonly AutoMovieComposition[] =
      this.node.kind === "sequence" ? this.node.parts : [this.node];
    return this.derive({
      kind: "sequence",
      parts: [...head, ...parts.map(AutoMovieComposition.of)],
    });
  }

  /**
   * This chain together with parts starting at the same instant.
   *
   * @param parts The parallel parts.
   * @returns A new chain of this chain's class.
   */
  public with(...parts: AutoMovieComposition.Part[]): this {
    const head: readonly AutoMovieComposition[] =
      this.node.kind === "parallel" ? this.node.parts : [this.node];
    return this.derive({
      kind: "parallel",
      parts: [...head, ...parts.map(AutoMovieComposition.of)],
    });
  }

  /**
   * A new chain of this chain's class holding another node; a subclass whose
   * constructor needs more than the node overrides it.
   *
   * @param node The new node.
   * @returns The new chain.
   */
  protected derive(node: AutoMovieComposition): this {
    const make: new (node: AutoMovieComposition) => this = this
      .constructor as new (node: AutoMovieComposition) => this;
    return new make(node);
  }
}
