import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";

/**
 * The body side of a generation's band, compiled once: which face-producer part evaluates it, how its render vertices map to body vertices, and the body vertices' own skin weights.
 *
 * @evidence contracts/common.md#principled-implementation Face-producer render sources map through band-view vertices to body source vertices and their own skin weights, preserving one source registration during band posing.
 * @evidence contracts/common.md#clear-and-simple-design The band stores both dense slot order and sparse body-vertex lookup because rendering and body correspondence use different namespaces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Own body weights remain attached to the band instead of reusing unrelated head weights to conceal a neck displacement.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish producer part IDs, render-to-view indices, body source IDs, slot lookup and slot-ordered skin weights.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The compiled band vertex correspondence and weight references are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the compiled band vertex correspondence and weight references; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring compiled band vertex correspondence and weight references acquires no handles or running tasks; the object owner controls ordinary data lifetime.
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
