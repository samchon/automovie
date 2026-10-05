/**
 * One vertex of a registered lip pair with its place along the mandibular
 * axis and its pair's exact closure gain, a node of the closure gain field.
 *
 * @evidence contracts/common.md#principled-implementation The gain is the pair's exact contact gain, so interpolation between nodes starts from exact values.
 * @evidence contracts/common.md#clear-and-simple-design Vertex, position and gain.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nodes are derived per state, never stored per person.
 * @evidence contracts/common.md#meaningful-documentation States each field.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The node names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The node is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The node emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Position along the mandibular axis in basis metres; the gain is dimensionless.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The node builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The node owns nothing a viewer displays.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The node carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The gain field bounds its gains.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The node is derived, not an input.
 * @author Samchon
 */
export interface IHumanFaceClosureNode {
  /** Vertex of the lips surface. */
  vertex: number;

  /** Rest position along the mandibular axis, metres. */
  at: number;

  /** The pair's exact closure gain per unit weight. */
  gain: number;
}
