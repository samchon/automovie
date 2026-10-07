/**
 * One edge of a source cell while proving chart coverage: its first recorded
 * direction and how many cells have used the undirected edge.
 *
 * @evidence contracts/common.md#principled-implementation Interior edges cancel once in opposite directions; the first direction and a use count are exactly what that check needs.
 * @evidence contracts/common.md#clear-and-simple-design Three fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts come from actual cell edges; no tolerance or repair is applied.
 * @evidence contracts/common.md#meaningful-documentation States each field and its role in cancellation.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping An edge record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry An edge record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Sample IDs and a count carry no frame or unit.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Internal bookkeeping of one coverage proof; it builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal source lineage that is not observed directly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical lineage, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled or derived lineage, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceEdge {
  /** Sample ID the edge leaves in its first recorded direction. */
  from: number;

  /** Sample ID the edge reaches in its first recorded direction. */
  to: number;

  /** Number of cells that have used the edge, one or two. */
  count: number;
}
