import type { IAutoMovieHumanFaceFacialHairSite } from "@automovie/human/face/structures/IAutoMovieHumanFaceFacialHairSite";

/**
 * Source-authored native facial shaft territory; no follicle norm is inferred.
 *
 * @author Samchon
 */
export interface IHumanSourceFacialHairDomainRegistration {
  /** Public anatomical site selected by a numerical shaft profile. */
  site: IAutoMovieHumanFaceFacialHairSite;

  /** Actual native host surface and growth-domain identity. */
  surface: string;

  /** Unique source-owned domain on the existing skin. */
  domain: string;

  /** Registered source landmarks that define the authoring convention. */
  landmarks: string[];

  /** Complete selected native triangle ordinals, before render separation. */
  triangles: number[];

  /** Number of edge-connected native components; publication requires one. */
  components: number;

  /** Landmark-derived selection, explicitly distinguished from a clinical boundary. */
  convention: string;
}
