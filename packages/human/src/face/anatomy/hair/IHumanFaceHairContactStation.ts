/**
 * Geometry-owned station of one actual emitted strand, in head-local metres.
 *
 * @evidence contracts/common.md#principled-implementation Actual mesh-vertex membership, transverse radius and measured arc length describe a generated station without inferring representation from vertex order.
 * @evidence contracts/common.md#clear-and-simple-design One station record groups its emitted vertices and metric geometry, allowing ribbons and terminal shafts to share the clearance consumer contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero radius is the canonical attached root defined by the geometry producer, rather than a hidden exception for a particular test mesh.
 * @evidence contracts/common.md#meaningful-documentation The fields document metre arc length, inclusion of any cap centre and the root meaning of a zero emitted radius.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Station metadata selects no mesh traversal algorithm; work over vertex ordinals occurs when body clearance consumes the layout.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work These ordinals belong to the actual emitted part, so the record makes no equivalence promise for a separately rebuilt mesh.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The vertex-membership array retains one station's emitted addresses until its containing contact curve is released.
 *
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
