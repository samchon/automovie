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
 * @evidence contracts/common.md#principled-implementation Claims are ids resolved against indexed registries and volumes carried through the set piece's transform, so each judgment compares the claim with geometry the building and the staged scene already own.
 * @evidence contracts/common.md#clear-and-simple-design Relations, the occupied volume and keep-out volumes are the three kinds of claim a prop makes; volumes are model-local so the staging transform is applied once, by the engine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts References resolve regardless of declaration order instead of by last write, and a prop with no placement is exempted from claims only, never from being measured by others.
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
   * The occupancy is what other props must not intrude on and what the
   * occupied space must contain. Deriving it is the exact bound of the parts.
   * Declare one to state a use volume the geometry does not show, such as the
   * room a chair's seat sweeps back into, or to trim a decorative overhang.
   */
  footprint: IAutoMoviePropBox | null;

  /**
   * Model-local keep-out boxes, such as the swing of a door or drawer, that no
   * other staged prop may occupy.
   */
  clearance: IAutoMovieClearanceBox[];
}
