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
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadSkin extends IAutoMovieHumanSkinBinding {}
