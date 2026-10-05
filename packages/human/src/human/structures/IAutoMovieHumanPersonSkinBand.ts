import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";

/**
 * The body side of a generation's band, compiled once: which face-producer
 * part evaluates it, how its render vertices map to body vertices, and the
 * body vertices' own skin weights.
 *
 * @evidence contracts/common.md#principled-implementation Everything about the band that does not depend on the document is compiled once.
 * @evidence contracts/common.md#clear-and-simple-design Six fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The band's body vertices keep the body's own weights.
 * @evidence contracts/common.md#meaningful-documentation States what each field holds.
 * @evidence contracts/modeling.md#shared-boundaries Names the band vertices that carry the face producer's displacement into the body side.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The band is an evaluation region of the one skin, not a part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The band carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The band emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The band holds indices and weights only.
 * @evidenceExclude contracts/modeling.md#rendered-observation The band is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The band carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The band admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The band converts no input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSkinBand {
  /** The face-producer part id that evaluates the band. */
  surface: string;

  /** The band view vertex each of that part's render vertices reads. */
  sources: readonly number[];

  /** The body vertex of each band view vertex. */
  viewBodyVertices: readonly number[];

  /** The band's own body vertices (not shared samples), in slot order. */
  bodyVertices: readonly number[];

  /** Each band body vertex's slot. */
  slots: ReadonlyMap<number, number>;

  /** The band body vertices' own skin weights, in slot order. */
  skin: IAutoMovieHumanBodyBasis["surfaces"][number]["skin"];
}
