import type { IAutoMovieHumanFaceFacialHairProfile } from "./IAutoMovieHumanFaceFacialHairProfile";
import type { IAutoMovieHumanFaceFacialHairSite } from "./IAutoMovieHumanFaceFacialHairSite";

/**
 * Independent authored visible terminal populations on seven named sites.
 * Omission, null or an empty record adds no visible facial shafts; it does not
 * remove vellus skin appearance or claim absence of biological follicles.
 * Source native growth domains own all roots and attachment identities. This
 * input contains no personal source vertices, guides, meshes or textures.
 *
 * @evidence contracts/common.md#principled-implementation Numerical targets are distinct from anatomical observations and resolve against source-authored native domains.
 * @evidence contracts/common.md#clear-and-simple-design One seven-site record feeds the existing hair and combined Person consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No personal geometry or observed-FU conversion enters the input.
 * @evidence contracts/common.md#meaningful-documentation States absence, source ownership and lack of follicle inference.
 * @evidence contracts/modeling.md#parameter-channels Each site independently owns count, dimensions and styling controls.
 * @evidence contracts/anatomy.md#parametric-authority Named scalar targets address no personal source geometry.
 * @evidence contracts/anatomy.md#anatomical-source Authored targets establish no universal physiological norm and leave measured records separate.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceFacialHair {
  /** Independently selected anatomical sites; omission leaves a site without an emitted terminal layer. */
  sites: Partial<Record<IAutoMovieHumanFaceFacialHairSite, IAutoMovieHumanFaceFacialHairProfile>>;
}
