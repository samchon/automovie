/**
 * A view-part leaf supplied by this realization's caller-owned source context.
 *
 * The key names an already evaluated source definition, not a mesh or a loft.
 * Its actual frame and scalar owners reach the engine unchanged. The runtime
 * context belongs to the engine call rather than this pure authoring AST.
 *
 * @evidence contracts/development/design.md#principled-representation An explicit leaf key binds one complete generating definition in the current invocation, preserving functions that a finite knot declaration cannot represent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A discriminant, unique face name and source key form one closed construction leaf without importing runtime geometry types.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The key selects no global registry, person, cached loft or sampled substitute; a missing or differently named source is a realization diagnostic.
 * @evidence contracts/development/common.md#meaningful-documentation States the separate invocation context, complete-source meaning, unique face identity and runtime failure boundary; the context's evaluated lengths use the engine's documented units.
 */
export interface IAutoMovieConstructionSource {
  /** Discriminator of an externally supplied complete view source. */
  type: "source";

  /** Unique part/face name in the tree, equal to the supplied source's name. */
  name: string;

  /** Nonempty key in this realization call's explicit source context. */
  source: string;
}
