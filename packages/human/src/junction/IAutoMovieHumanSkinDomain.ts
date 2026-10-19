/**
 * Source-owned skin roles carried beside one emitted rest mesh, never inferred from its UV packing.
 *
 * A uniform subdivision emitter may repeat one coarse-face role over its fixed
 * triangle count. An adaptive generated field instead supplies exactly one role
 * per actual triangle. Both follow emitted triangle ordinals through UV/normal
 * vertex splitting; neither infers anatomy from a packed texture rectangle.
 * The owner validates the expected triangle count. Conventional role boundaries
 * are not clinical segmentation.
 *
 * @author Samchon
 */
export type IAutoMovieHumanSkinDomain = {
  /** Coarse source roles in exactly the cage's face order. */
  faces: IAutoMovieHumanSkinDomain.Role[];

  /** Consecutive emitted triangles per coarse face, a positive integer. */
  trianglesPerFace: number;
} | {
  /** Actual generated triangle roles in emitted index order, including partial realization. */
  triangles: IAutoMovieHumanSkinDomain.Role[];
};

/** Categorical eligibility of ordinary follicular-looking pits and engineering marks. */
export namespace IAutoMovieHumanSkinDomain {
  /** Ordinary is the existing uniform artistic field; other roles suppress its pits and marks. */
  export type Role = "ordinary" | "glabrous" | "vermilion" | "oral" | "unknown";
}
