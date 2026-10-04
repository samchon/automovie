import type { IAutoMovieHumanFaceBasis } from "../../face/structures/IAutoMovieHumanFaceBasis";

/**
 * The head partition view with the body side of the neck band added as one
 * more face surface, so the face producer evaluates its own channels, closure
 * and articulation on the band with one definition.
 *
 * `basis` is the face view plus the surface `surface`: the band's body
 * triangles over copies of their body vertices (body neutral positions, the
 * face band rows and continued attachment rows), drawn as one region of the
 * same id. `bodyVertices[i]` is the body skin vertex of that surface's vertex
 * `i`. The face's own skin surface, its closure and hair records are
 * unchanged. The surface is evaluated, read back and never emitted; the body
 * partition still emits those triangles.
 *
 * @evidence contracts/common.md#principled-implementation The face producer stays the one evaluator of face channels; the band cells are added to its view as their own surface rather than re-implementing its stages for body vertices or reopening the face skin's sealed openings.
 * @evidence contracts/common.md#clear-and-simple-design One basis, one surface id and one vertex map.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The added vertices carry the generation's neutral and band rows only; nothing is fitted.
 * @evidence contracts/common.md#meaningful-documentation States what the surface holds, the vertex map and that it is never emitted.
 * @evidence contracts/modeling.md#shared-boundaries The band surface's cut-sample copies coincide with the face cells' shared vertices at the neutral; the evaluator reads only the band's own vertices from it.
 * @evidence contracts/modeling.md#spatial-conventions The added neutral positions are the body view's, in the shared metre frame.
 * @evidence contracts/modeling.md#part-identity-and-grouping The band surface is an evaluation view of body cells and is never emitted as a face part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The view adds no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The view emits nothing itself.
 * @evidenceExclude contracts/modeling.md#rendered-observation The view is not observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The view adds no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The view admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The view is compiled data.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBandFaceView {
  /** The face view with the band surface added. */
  basis: IAutoMovieHumanFaceBasis;

  /** The id of the never-emitted band surface and of its one region. */
  surface: string;

  /** Body skin vertex of each band surface vertex, in surface order. */
  bodyVertices: number[];
}
