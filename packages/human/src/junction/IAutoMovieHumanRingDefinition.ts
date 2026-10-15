import { AutoMovieHumanDirection } from "./AutoMovieHumanDirection";
import { AutoMovieHumanJunctionSite } from "./AutoMovieHumanJunctionSite";
import { AutoMovieHumanPart } from "./AutoMovieHumanPart";

/**
 * The fixed contract of one junction site: which parts meet there and how both open their ring.
 *
 * Both parts of a site read the same definition and the same frame from `layoutAutoMovieHumanRing`, so their rings pair vertex for vertex without either part knowing the other. The counts are constants of the profile's topology: every identity opens the same rings, which is what keeps one connectivity and one UV layout for every person.
 *
 * @template Site The junction site
 * @author Samchon
 */
export interface IAutoMovieHumanRingDefinition<
  Site extends AutoMovieHumanJunctionSite = AutoMovieHumanJunctionSite,
> {
  /** The site this definition fixes. */
  site: Site;

  /** The part on the trunk side of the site, whose ring normal points along the site axis. */
  proximal: AutoMovieHumanPart;

  /** The part on the far side of the site, whose ring normal points back against the site axis. */
  distal: AutoMovieHumanPart;

  /** Whether the site exists once per side; false for the two neck sites. */
  bilateral: boolean;

  /**
   * Number of ring vertices, equal on both sides of the site. A multiple of four, so the anterior, posterior and both side directions each fall on a vertex.
   */
  count: number;

  /** Anatomical direction of vertex 0 from the ring's centre. */
  start: AutoMovieHumanDirection;
}
