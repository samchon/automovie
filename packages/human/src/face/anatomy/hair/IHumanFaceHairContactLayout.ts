import type { IHumanFaceHairContactCurve } from "./IHumanFaceHairContactCurve";

/**
 * One emitted hair part's contact layout, copied with its owned mesh and cache. Vertex addresses are derived geometry facts, never personal authoring input.
 *
 * @evidence contracts/common.md#principled-implementation The actual representation discriminator, native source/domain and emitted station membership retain the geometry facts needed for body-contact clearance.
 * @evidence contracts/common.md#clear-and-simple-design A per-part layout accompanies its owned mesh and cache so consumers use the emitter's ribbon or terminal-shaft structure directly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Vertex addresses are derived output metadata, not personal authoring controls; representation is not guessed from a favored fixture's vertex pairing.
 * @evidence contracts/common.md#meaningful-documentation The comments specify native surface/domain identity, actual representation, the body-contact gap including half the sampling step, and complete ordered curve membership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The layout schema selects no clearance algorithm; work scales with its emitted curve/station memberships at the consuming solver.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Layout copies accompany the same owned mesh/cache, preserving provenance; this type does not equate layouts from different sources or representations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Curves and station memberships retain memory proportional to emitted hair geometry; ownership follows the associated part and cache entry.
 *
 * @author Samchon
 */
export interface IHumanFaceHairContactLayout {
  /** Same immutable source surface selected by the admitted layer. */
  surface: string;

  /** Same registered native growth domain. */
  domain: string;

  /** Actual generated representation; consumers do not infer it from vertex pairing. */
  representation: "ribbon" | "terminal-shaft";

  /** Body-contact gap in metres: the admitted layer's requested gap plus half its integration sampling step, as published by the hair builder. */
  clearance: number;

  /** Complete ordered strand/station membership emitted by the mesh owner. */
  curves: readonly IHumanFaceHairContactCurve[];
}
