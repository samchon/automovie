import { IAutoMovieClearanceBox } from "./IAutoMovieClearanceBox";
import { IAutoMoviePropBox } from "./IAutoMoviePropBox";
import { IAutoMoviePropRelation } from "./IAutoMoviePropRelation";

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
 *
 * @evidence contracts/common.md#principled-implementation Claims resolve against per-call registries and world AABBs from the staged piece. Only forged, uniquely declared and uniquely staged props with a sound optional footprint enter geometry; upstream staging and building admission remain premises. These rest-placement proxy checks do not measure an articulated or imported mesh at every animation instant.
 * @evidence contracts/common.md#clear-and-simple-design Relations, the occupied volume and keep-out volumes are the three kinds of claim a prop makes; volumes are model-local so the staging transform is applied once, by the engine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registry order does not decide admitted identity. A placementless sound prop remains a clearance obstacle and affordance host, but pairwise occupancy overlap is checked only when both props declare placement; any prop-affordance relation between that pair exempts that overlap. Geometry uses the unique occupied environment or one environment shared by all building citations; no unique environment means no containment or passage measurement.
 * @evidence contracts/common.md#meaningful-documentation States the validator, the cite-not-copy rule, order independence, the staging requirement, and what an absent placement means; members give the relation limits, the footprint default and when to declare one, and the clearance purpose.
 * @author Samchon
 */
export interface IAutoMoviePropPlacement {
  /**
   * Typed spatial relations this prop claims.
   *
   * A prop declares at most one `in-space` and one `fill-opening` relation,
   * since it occupies one logical space and fills one passage, and never the
   * same kind and target twice. Other kinds may repeat, such as a cabinet
   * against two walls. Whether the placement passes does not depend on
   * relation order.
   */
  relations: IAutoMoviePropRelation[];

  /**
   * Model-local occupancy box, or `null` to derive it from the prop's own
   * model parts.
   *
   * Occupancy drives declared containment, pairwise overlap and other props' clearance checks, subject to those checks' exemptions. The default is the world bound of authored mesh or tessellated primitive vertices under rest part/stage transforms, not the imported appearance or an animation sweep; a vertexless model collapses to a zero box at the staged origin. Declare a use volume when the proxy does not express it, such as a chair's backward sweep, or to trim a decorative overhang.
   */
  footprint: IAutoMoviePropBox | null;

  /**
   * Model-local keep-out boxes, such as the swing of a door or drawer, that no
   * other staged prop may occupy.
   */
  clearance: IAutoMovieClearanceBox[];
}
