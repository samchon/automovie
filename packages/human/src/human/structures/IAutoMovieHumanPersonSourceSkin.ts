import type { IAutoMovieHumanPersonHeadTransform } from "./IAutoMovieHumanPersonHeadTransform";

/**
 * One final skin of a performed person in its body frame: the posed face
 * skin, the cut body skin after collar conformance and before it, and the
 * head transform that placed the face. Positions are owned flat triples in
 * metres, Y up, +Z forward.
 *
 * @evidence contracts/common.md#principled-implementation Normals, stitching and rigid parts all read these four results of one evaluation.
 * @evidence contracts/common.md#clear-and-simple-design Four members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every array is evaluated from the actual face and body; nothing neutral substitutes.
 * @evidence contracts/common.md#meaningful-documentation States each member, ownership, units and frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The skins are existing surfaces; the result defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Holds evaluated positions; the person assembly emits the parts.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the shared Y-up, +Z-forward performed body frame.
 * @evidence contracts/modeling.md#shared-boundaries The collar-conformed body meets the posed face on their shared neck seam.
 * @evidenceExclude contracts/modeling.md#rendered-observation The person assembly owns what is displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range Producer admission precedes this result.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Evaluated geometry, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceSkin {
  /** Posed face skin positions, metres. */
  face: number[];

  /** Cut body skin positions after collar conformance, metres. */
  body: number[];

  /** Cut body skin positions before collar conformance, metres. */
  bodyBeforeCollar: number[];

  /** The head transform that placed the face. */
  head: IAutoMovieHumanPersonHeadTransform;
}
