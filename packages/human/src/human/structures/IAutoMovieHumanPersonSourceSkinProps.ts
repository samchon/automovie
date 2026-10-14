import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanPersonSeam } from "./IAutoMovieHumanPersonSeam";
import type { IAutoMovieHumanPersonSkinSurface } from "./IAutoMovieHumanPersonSkinSurface";

/**
 * What a final face skin evaluator in the performed body frame is compiled from: the face skin's vertex count and region sources, the body basis and its skin surface, the neck seam, the neutral cut body positions, the mandible-carried face vertices and the neutral head anchor (metres, Y up, +Z forward).
 *
 * @evidence contracts/common.md#principled-implementation Face region source indices, frozen neck cut, body skin weights and neutral head anchor describe one admitted shared frame; the evaluator relies on their matching vertex populations.
 * @evidence contracts/common.md#clear-and-simple-design Generation-invariant basis, seam and region data are separated from the performed face and body passed to each call.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Mandible membership and neutral coordinates arrive from source owners rather than consumer-specific vertex lists authored in this type.
 * @evidence contracts/common.md#meaningful-documentation Properties distinguish region IDs from skin vertices, identify neutral metre coordinates and name the mandible-carried population.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Compilation operands choose no skinning traversal in this interface; the source-skin factory owns evaluation cost and temporary arrays.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Invariant fields are exposed for capture by one evaluator; the factory defines reuse across performed inputs, not this data declaration.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Basis, region and seam references are borrowed by the factory; declaring them acquires no buffer, handle or asynchronous task.
 *
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
