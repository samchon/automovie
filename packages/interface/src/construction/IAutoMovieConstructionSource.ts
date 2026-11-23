/**
 * A view-part leaf supplied by this realization's caller-owned source context.
 *
 * The key names an already evaluated source definition, not a mesh or a loft.
 * Its actual frame and scalar owners reach the engine unchanged. The runtime
 * context belongs to the engine call rather than this pure authoring AST.
 */
export interface IAutoMovieConstructionSource {
  /** Discriminator of an externally supplied complete view source. */
  type: "source";

  /** Unique part/face name in the tree, equal to the supplied source's name. */
  name: string;

  /** Nonempty key in this realization call's explicit source context. */
  source: string;
}
