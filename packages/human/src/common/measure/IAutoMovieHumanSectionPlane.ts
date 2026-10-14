import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A cutting plane for one body section measurement.
 *
 * The plane passes through `point` with normal `normal`. A vertex whose
 * signed distance is zero counts as the positive side. An edge from an
 * on-plane vertex to a negative-side vertex therefore crosses at that endpoint.
 *
 *
 * @evidence contracts/common.md#principled-implementation A point and normal define the cutting plane; zero signed distance belongs to the positive side so an on-plane to negative edge crosses at its endpoint.
 * @evidence contracts/common.md#clear-and-simple-design The plane record supplies geometry to the section instrument without owning loop assembly or anatomical station selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The zero-side convention is explicit source incidence semantics rather than epsilon welding or a specimen-specific offset.
 * @evidence contracts/common.md#meaningful-documentation The prose describes incidence and zero-side behavior; the point has metre units and the normal defines orientation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This plane shape executes no vertex classification or intersection algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration stores no cached signed distances across changed geometry or station planes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Concrete point/normal vectors are caller-held inputs and carry no persistent handle or running task.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSectionPlane {
  /** A point the plane passes through, in metres. */
  point: IAutoMovieVector3;

  /** Unit plane normal required by the section hull's metric frame; its positive side includes on-plane vertices. */
  normal: IAutoMovieVector3;
}
