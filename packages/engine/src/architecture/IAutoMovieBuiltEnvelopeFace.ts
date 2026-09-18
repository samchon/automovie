import { IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieEnvelopeFaceAspect } from "./AutoMovieEnvelopeFaceAspect";

/**
 * One exposed separation of a building unit, placed in world space.
 *
 * A separation is exposed when it encloses exactly one logical space, because
 * the record's other spelling names the two regions a separation stands
 * between. What is left over is the envelope, which is precisely the population
 * a facade, corner, and roof review is counted over.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Names each exposed envelope face a building owes an observation for.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Types the world-placed envelope face the observation population is derived from.
 */
export interface IAutoMovieBuiltEnvelopeFace {
  /** Boundary whose face this is. */
  boundary: string;
  /** Building unit owning the enclosed space. */
  building: string;
  /** The one logical space this separation encloses. */
  space: string;
  /** Authored boundary label, preserved without being trusted for geometry. */
  kind: string;
  /** Observation role derived from the outward normal. */
  aspect: AutoMovieEnvelopeFaceAspect;
  /**
   * Unit normal pointing away from the enclosed space.
   *
   * Derived rather than copied. The authored frame states its own outward `+Z`,
   * and a face wound the other way would otherwise put every camera inside the
   * wall it was meant to photograph, so the direction is settled by asking the
   * space which side it is on.
   */
  normal: IAutoMovieVector3;
  /** Area-weighted world centroid of the face outline. */
  centroid: IAutoMovieVector3;
  /** Face outline in world metres, in authored order. */
  vertices: IAutoMovieVector3[];
  /** Authored separation thickness along the face normal, in metres. */
  thickness: number;
}
