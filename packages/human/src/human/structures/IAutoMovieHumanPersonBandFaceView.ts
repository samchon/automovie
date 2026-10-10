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
