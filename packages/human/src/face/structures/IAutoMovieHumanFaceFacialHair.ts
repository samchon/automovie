import type { IAutoMovieHumanFaceFacialHairProfile } from "./IAutoMovieHumanFaceFacialHairProfile";
import type { IAutoMovieHumanFaceFacialHairSite } from "./IAutoMovieHumanFaceFacialHairSite";

/**
 * Independent authored visible terminal populations on seven named sites.
 * Omission, null or an empty record adds no visible facial shafts; it does not
 * remove vellus skin appearance or claim absence of biological follicles.
 * Source native growth domains own all roots and attachment identities. This
 * input contains no personal source vertices, guides, meshes or textures.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceFacialHair {
  /** Independently selected anatomical sites; omission leaves a site without an emitted terminal layer. */
  sites: Partial<Record<IAutoMovieHumanFaceFacialHairSite, IAutoMovieHumanFaceFacialHairProfile>>;
}
