import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanPersonHeadTransform } from "./IAutoMovieHumanPersonHeadTransform";

/**
 * One generated head part that also carries exact registered skin aliases.
 * Native aliases read the final posed skin in the person's frame; the other
 * vertices receive the same rigid head carry as their generated part. The
 * source-domain pair identifies the physical instance rebase, not a weld.
 *
 * @evidence contracts/common.md#principled-implementation Explicit native correspondence and evaluated skin positions pair one actual shared point with the generated part that uses it.
 * @evidence contracts/common.md#clear-and-simple-design The mesh, rigid carry, canonical sample lookup, skin coordinates and two domains fully identify the placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source aliases are identified by domain/ID rather than positions or part-name patterns.
 * @evidence contracts/common.md#meaningful-documentation Separates skin attachment coordinates from the generated part's rigid vertices.
 * @evidence contracts/modeling.md#spatial-conventions Input mesh uses head-frame metres; skin positions and placed output use person-frame metres.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Part and joint owners define the tissue; this record transports their shared point identities.
 * @evidenceExclude contracts/anatomy.md#permitted-range The source and pose owners admit geometry.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This record adds no authoring value.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonMixedSourceMeshProps {
  /** Actual generated mesh, including source-domain skin aliases. */
  mesh: IAutoMovieMesh;

  /** The same head carry used for its remaining generated vertices. */
  head: IAutoMovieHumanPersonHeadTransform;

  /** Canonical sample ID to the final skin-array vertex; compiled once. */
  samples: ReadonlyMap<number, number>;

  /** Final body-weighted, performed face skin in person-frame metres. */
  positions: readonly number[];

  /** Native skin physical domain of the actual face-producing instance. */
  origin: string;

  /** Shared skin physical domain of the actual person instance. */
  domain: string;
}
