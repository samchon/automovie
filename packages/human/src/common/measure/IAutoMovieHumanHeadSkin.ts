import type { IAutoMovieHumanSkinLandmark } from "../basis/IAutoMovieHumanSkinLandmark";
import type { IAutoMovieHumanSkinRegion } from "../basis/IAutoMovieHumanSkinRegion";

/**
 * The head view of a person's skin at rest, as the head measurement rules
 * read it: the face producer skin's Float32 positions in the person frame,
 * its triangles, the surface index they belong to, and the head view basis's
 * named skin points and areas that address them.
 *
 * @evidence contracts/common.md#principled-implementation The rules read one record that carries the skin and the names that address it, so no rule numbers a vertex.
 * @evidence contracts/common.md#clear-and-simple-design Identity, surface, positions, triangles and the two name tables.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Points and areas are addressed only through the basis's declared names.
 * @evidence contracts/common.md#meaningful-documentation States the frame, the precision and what each field is.
 * @evidence contracts/modeling.md#spatial-conventions Flat XYZ metres of the person frame, +Y up and +Z forward.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rules cite their definitions.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record converts no input.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanHeadSkin {
  /** The head view basis identity, named in refusals. */
  id: string;

  /** The head view's surface index these positions belong to. */
  surface: number;

  /** Flat XYZ per head view vertex, Float32-quantized, in the person frame at rest. */
  positions: number[];

  /** Triangle vertex indices of the head view skin. */
  indices: number[];

  /** The head view basis's named skin points. */
  skinLandmarks?: Record<string, IAutoMovieHumanSkinLandmark>;

  /** The head view basis's named skin areas. */
  skinRegions?: Record<string, IAutoMovieHumanSkinRegion>;
}
