import type { IAutoMovieClearanceBox } from "./IAutoMovieClearanceBox";
import type { IAutoMoviePropBox } from "./IAutoMoviePropBox";
import type { IAutoMoviePropRelation } from "./IAutoMoviePropRelation";

/**
 * The building relations and model-local volumes one prop claims, judged by
 * `validatePropPlacements` against the staged set and the built environments.
 *
 * Relations cite the architecture graph and other props by id and never copy
 * their geometry. The registry is indexed before any relation is judged, so a
 * prop may cite one declared later. The prop must be staged by exactly one set
 * piece, whose transform places every model-local box below. A prop without a
 * placement claims nothing and is still measured as an occupant others must
 * clear and as a host others may rest on.
 */
export interface IAutoMoviePropPlacement {
  /**
   * Typed spatial relations this prop claims.
   *
   * A prop declares at most one `in-space` and one `fill-opening` relation,
   * since it occupies one logical space and fills one passage, and never the
   * same kind and target twice. Other kinds may repeat, such as a cabinet
   * against two walls. Whether the placement passes does not depend on relation
   * order.
   */
  relations: IAutoMoviePropRelation[];

  /**
   * Model-local occupancy box, or `null` to derive it from the prop's own model
   * parts.
   *
   * Occupancy drives declared containment, pairwise overlap and other props'
   * clearance checks, subject to those checks' exemptions. The default is the
   * world bound of authored mesh or tessellated primitive vertices under rest
   * part/stage transforms, not the imported appearance or an animation sweep; a
   * vertexless model collapses to a zero box at the staged origin. Declare a
   * use volume when the proxy does not express it, such as a chair's backward
   * sweep, or to trim a decorative overhang.
   */
  footprint: IAutoMoviePropBox | null;

  /**
   * Model-local keep-out boxes, such as the swing of a door or drawer, that no
   * other staged prop may occupy.
   */
  clearance: IAutoMovieClearanceBox[];
}
