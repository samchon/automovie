import type { IHumanFaceHairContactCurve } from "./IHumanFaceHairContactCurve";

/**
 * One emitted hair part's contact layout, copied with its owned mesh and cache.
 * Vertex addresses are derived geometry facts, never personal authoring input.
 *
 * @evidence contracts/common.md#principled-implementation Per-part source identity, representation, actual station groups and profile gap remain coupled with the emitted owned mesh.
 * @evidence contracts/common.md#clear-and-simple-design One carrier serves Face construction, success-only observation and Person contact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A different population's maximum clearance cannot replace this part's profile.
 * @evidence contracts/common.md#meaningful-documentation States generated membership, source meaning and the absence of author-addressed vertices.
 * @evidence contracts/modeling.md#shared-boundaries Person contact consumes the same registered root and whole transverse stations while preserving part calibre.
 * @author Samchon
 */
export interface IHumanFaceHairContactLayout {
  /** Same immutable source surface selected by the admitted layer. */
  surface: string;

  /** Same registered native growth domain. */
  domain: string;

  /** Actual generated representation; consumers do not infer it from vertex pairing. */
  representation: "ribbon" | "terminal-shaft";

  /** Actual profile's requested body-contact gap, in metres. */
  clearance: number;

  /** Complete ordered strand/station membership emitted by the mesh owner. */
  curves: readonly IHumanFaceHairContactCurve[];
}
