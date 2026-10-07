import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanPersonSeam } from "./IAutoMovieHumanPersonSeam";
import type { IAutoMovieHumanPersonSkinSurface } from "./IAutoMovieHumanPersonSkinSurface";

/**
 * What a final face skin evaluator in the performed body frame is compiled
 * from: the face skin's vertex count and region sources, the body basis and
 * its skin surface, the neck seam, the neutral cut body positions, the
 * mandible-carried face vertices and the neutral head anchor (metres, Y up,
 * +Z forward).
 *
 * @evidence contracts/common.md#principled-implementation Every member is a value person assembly has already derived once from the two bases.
 * @evidence contracts/common.md#clear-and-simple-design One named carrier of the eight compiled values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Each value comes from its own owner, the bases or the seam; nothing is restated.
 * @evidence contracts/common.md#meaningful-documentation States each member, its units and frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Regions and surfaces are the bases' own; the carrier defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The carrier emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Neutral positions and the anchor are metres in the shared Y-up, +Z-forward frame.
 * @evidence contracts/modeling.md#shared-boundaries The seam is the face and body skins' one shared neck boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal construction input that is not observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value of its own; the bases own anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range Basis admission precedes this carrier.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived from the bases, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceSkinProps {
  /** Number of face skin vertices. */
  faceCount: number;

  /** Face skin vertex per render-part vertex, by face region (part) ID. */
  faceRegions: ReadonlyMap<string, readonly number[]>;

  /** The body basis. */
  bodyBasis: IAutoMovieHumanBodyBasis;

  /** The body basis's skin surface. */
  bodySkin: IAutoMovieHumanPersonSkinSurface<
    IAutoMovieHumanBodyBasis["surfaces"][number]
  >;

  /** The face/body neck seam, with its frozen body cut. */
  seam: IAutoMovieHumanPersonSeam;

  /** Neutral body skin positions after the cut, metres. */
  neutralBody: readonly number[];

  /** Face skin vertices the mandible carries. */
  jawVertices: readonly number[];

  /** The head anchor on the neutral body, metres. */
  neutralAnchor: IAutoMovieVector3;
}
