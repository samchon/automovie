/**
 * Geometry-owned station of one actual emitted strand, in head-local metres.
 *
 * @evidence contracts/common.md#principled-implementation Vertex membership, radius and arc distance come from the emitting geometry, not consumer topology inference.
 * @evidence contracts/common.md#clear-and-simple-design One station record carries the exact transverse group and its metric facts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Tube rings are not reduced to paired ribbon vertices.
 * @evidence contracts/common.md#meaningful-documentation Fields state ordinal and metric units and the root-zero meaning.
 * @evidence contracts/modeling.md#spatial-conventions Radius and arc length are metres; vertex ordinals address the actual emitted mesh.
 * @author Samchon
 */
export interface IHumanFaceHairContactStation {
  /** Actual mesh vertex ordinals belonging to this station, including its cap centre when present. */
  vertices: readonly number[];

  /** Actual emitted transverse radius; zero is the canonical attached root. */
  radius: number;

  /** Measured source curve distance from the root, in metres. */
  arcLength: number;
}
