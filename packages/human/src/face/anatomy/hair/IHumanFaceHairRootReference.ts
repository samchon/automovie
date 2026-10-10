/**
 * Reference to a sampled root on the original growth surface.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootReference {
  /** Original resident triangle ordinal, before contact-cap triangles are appended. */
  triangle: number;

  /** Barycentric weights over that triangle, admitted by the root sampler. */
  weights: readonly number[];
}
