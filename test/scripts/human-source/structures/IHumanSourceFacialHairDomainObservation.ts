import type { IAutoMovieHumanFaceFacialHairSite } from "@automovie/human/face/structures/IAutoMovieHumanFaceFacialHairSite";

/**
 * Native connected-component observations for one authored shaft territory.
 * Every component retains its source triangle ordinals before the registration
 * owner accepts a single connected territory or reports all refused sites.
 *
 * @author Samchon
 */
export interface IHumanSourceFacialHairDomainObservation {
  /** Anatomical authoring site whose native crop was inspected. */
  site: IAutoMovieHumanFaceFacialHairSite;

  /** Edge-connected groups of native triangle ordinals, including all islands. */
  components: number[][];
}
