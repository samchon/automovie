import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Inputs of `placeHumanPersonSkinPart`: one skin render part of a partition,
 * the evaluated skin it takes positions and normals from, and the source
 * domains its correspondence moves between.
 *
 * @evidence contracts/common.md#principled-implementation The part's registration is checked against the partition's own samples and domain, then moved to the person's domain.
 * @evidence contracts/common.md#clear-and-simple-design Eight fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The origin domain is passed so an unregistered part refuses instead of being relabelled.
 * @evidence contracts/common.md#meaningful-documentation States what each field is.
 * @evidence contracts/modeling.md#spatial-conventions Positions are metres and normals unit vectors of the posed person frame.
 * @evidence contracts/modeling.md#shared-boundaries The normal field spans both halves, so a shared sample reads one normal.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The part keeps its own identity; the props carry it.
 * @evidenceExclude contracts/modeling.md#parameter-channels The props carry no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function owns the emitted mesh.
 * @evidenceExclude contracts/modeling.md#rendered-observation The props are not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The props carry no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The props admit nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The props convert no input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSkinPartProps {
  /** The partition builder's render part mesh. */
  mesh: IAutoMovieMesh;

  /** The skin vertex each render vertex reads, in render order. */
  sources: readonly number[];

  /** The partition's evaluated posed skin positions. */
  positions: readonly number[];

  /** The one normal field over both halves: head vertices first, then body. */
  normals: readonly number[];

  /** Where this partition's vertices start in `normals`: zero for the head, the head count for the body. */
  offset: number;

  /** The partition's source sample per skin vertex. */
  samples: readonly number[];

  /** The source domain the partition builder registered the part in. */
  origin: string;

  /** The person's source domain the part is moved to. */
  domain: string;
}
