import type { IAutoMovieMesh, IAutoMovieMeshPhysicalSource } from "@automovie/interface";

import type { IAutoMovieHumanPersonSeam } from "./IAutoMovieHumanPersonSeam";

/**
 * What subdividing one posed skin region onto the common face/body neck
 * polyline reads: the region's posed mesh and its skin source vertices, which
 * side it is, the seam, the posed face skin with its normals, and optional
 * failure provenance and physical registration. Positions are metres, Y up,
 * +Z forward.
 *
 * @evidence contracts/common.md#principled-implementation Both sides are stitched from the same seam and the same evaluated face loop, so each call reads exactly these values.
 * @evidence contracts/common.md#clear-and-simple-design One named carrier of the region, its side and the shared boundary inputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Boundary points and normals come from the evaluated face skin on both sides; nothing is re-derived per side.
 * @evidence contracts/common.md#meaningful-documentation States each member, its units and frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The region is an existing material region; the carrier defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The carrier emits no geometry; the stitch owns emission.
 * @evidence contracts/modeling.md#spatial-conventions Positions are metres and normals directions in the shared Y-up, +Z-forward posed frame.
 * @evidence contracts/modeling.md#shared-boundaries Both sides read the same seam, face skin and face normals for one shared boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The person assembly owns what is displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value; it joins already evaluated skins.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical document admission precedes this mesh stage.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal evaluated meshes and source identities, not caller sculpting controls.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBoundaryStitchProps {
  /** The region's posed mesh. */
  mesh: IAutoMovieMesh;

  /** Skin source vertex per mesh vertex. */
  sources: readonly number[];

  /** Which skin the region belongs to. */
  side: "face" | "body";

  /** The face/body neck seam. */
  seam: IAutoMovieHumanPersonSeam;

  /** Posed face skin positions, metres. */
  face: readonly number[];

  /** Posed skin normals, flat triples indexed by face skin vertex; read at face-loop vertices. */
  faceNormals: readonly number[];

  /** Body source positions after rig posing, before collar alignment; failure provenance only. */
  bodyBeforeCollar?: readonly number[];

  /** Canonical physical pairs aligned with the registered face loop. */
  physicalBoundary?: readonly IAutoMovieMeshPhysicalSource[];
}
