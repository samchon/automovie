/**
 * Source-owned skin roles carried beside one emitted rest mesh, never inferred from its UV packing.
 *
 * Each coarse quad owns one role. The existing Catmull-Clark emitter writes 2*4^levels consecutive triangles per coarse face, so this compact sidecar follows actual triangle ordinals through seam vertex splitting without a per-render-corner table. The owner validates the expected triangle count. The source's conventional region boundaries are not clinical segmentation.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkinDomain {
  /** Coarse source roles in exactly the cage's face order. */
  faces: IAutoMovieHumanSkinDomain.Role[];

  /** Consecutive emitted triangles per coarse face, a positive integer. */
  trianglesPerFace: number;
}

/** Categorical eligibility of ordinary follicular-looking pits and engineering marks. */
export namespace IAutoMovieHumanSkinDomain {
  /** Ordinary is the existing uniform artistic field; other roles suppress its pits and marks. */
  export type Role = "ordinary" | "glabrous" | "vermilion" | "oral" | "unknown";
}
