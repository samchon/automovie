import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";

/**
 * The body side of a generation's band, compiled once: which face-producer
 * part evaluates it, how its render vertices map to body vertices, and the
 * body vertices' own skin weights.
 *
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
