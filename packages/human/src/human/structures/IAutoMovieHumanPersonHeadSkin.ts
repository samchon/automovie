import type { IAutoMovieHumanSkinBinding } from "../../common/basis/IAutoMovieHumanSkinBinding";

/**
 * The one skin-weight map of a source generation, restricted to its head
 * partition: four influences per face skin vertex, in the face surface's
 * shared vertex order.
 *
 * The body partition keeps the same map in its own surface's `skin`; both
 * halves are rows of one compiled table over one connected skin, so a
 * boundary sample present in both partitions carries the same influences on
 * both sides. `joints` names the body joints the indices address, the order
 * the body skin table uses. Weights are dimensionless and each vertex's four
 * sum to one. The table is source data, not a document input.
 *
 * @evidence contracts/common.md#principled-implementation One weight table over one skin is what lets a shared vertex receive one skinning transform; storing the head rows beside the body surface's own rows keeps both halves rows of that same table.
 * @evidence contracts/common.md#clear-and-simple-design Three flat arrays in the body skin table's own layout, so the body's dual quaternion skinning consumes them unchanged.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The rows are the compiled generation's weights; nothing here is derived from a person document or fitted at runtime.
 * @evidence contracts/common.md#meaningful-documentation States the vertex order, the joint addressing, the units and that both partitions share the table.
 * @evidence contracts/modeling.md#shared-boundaries A boundary sample present in both partitions has identical influences on both sides by construction, which the one-skin evaluator relies on.
 * @evidence contracts/modeling.md#spatial-conventions Weights are dimensionless and index the body basis's declared joints.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The table defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The table is not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The table emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The table is not observed on its own.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The table carries source rig weights, not an anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Weights are not an anatomical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The table is compiled source data, not a caller input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadSkin extends IAutoMovieHumanSkinBinding {}
