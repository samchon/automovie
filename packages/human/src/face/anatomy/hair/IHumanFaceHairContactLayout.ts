import type { IHumanFaceHairContactCurve } from "./IHumanFaceHairContactCurve";

/**
 * One emitted hair part's contact layout, copied with its owned mesh and cache.
 * Vertex addresses are derived geometry facts, never personal authoring input.
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

  /** Actual profile's requested body-contact gap, in metres. */
  clearance: number;

  /** Complete ordered strand/station membership emitted by the mesh owner. */
  curves: readonly IHumanFaceHairContactCurve[];
}
