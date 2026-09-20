import { IAutoMovieClearanceBox } from "./IAutoMovieClearanceBox";
import { IAutoMoviePropBox } from "./IAutoMoviePropBox";
import { IAutoMoviePropRelation } from "./IAutoMoviePropRelation";

/**
 * Stable building relations and model-local proxies for one prop.
 *
 * These references name the architecture graph and other prop specifications;
 * they never copy their geometry. The engine resolves the complete prop
 * registry before checking them, so a relation may cite a prop declared later
 * without changing the result. A staged set piece supplies the prop's world
 * TRS, and every model-local box below is read through that same transform.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `IAutoMoviePropPlacement` as the portable data boundary for the story scene local arc requirement.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `IAutoMoviePropPlacement` for the narrative intent scene prose index system contract.
 * @author Samchon
 */
export interface IAutoMoviePropPlacement {
  /**
   * Typed spatial relations this prop claims, in authored order.
   *
   * Order never changes the outcome. At most one `in-space` and at most one
   * `fill-opening` relation may be declared, because a prop occupies one
   * logical space and fills one passage; every other kind may repeat (a cabinet
   * standing against two walls, a rail socketed into three posts).
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `relations` as the portable data boundary for the story scene local arc requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `relations` for the narrative intent scene prose index system contract.
   */
  relations: IAutoMoviePropRelation[];

  /**
   * Model-local occupancy box, or `null` to derive it from visible geometry.
   *
   * A declared footprint is what other props must not intrude on and what the
   * occupied space must contain. Deriving is the honest default: it is the
   * exact bound of the prop's own parts. Declaring one states a use volume the
   * geometry does not show (a chair needs the room its seat sweeps back into)
   * or trims a decorative overhang that is not really in the way.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `footprint` as the portable data boundary for the story scene local arc requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `footprint` for the narrative intent scene prose index system contract.
   */
  footprint: IAutoMoviePropBox | null;

  /**
   * Model-local keep-out boxes for doors, drawers, service, and use.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `clearance` as the portable data boundary for the story scene local arc requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `clearance` for the narrative intent scene prose index system contract.
   */
  clearance: IAutoMovieClearanceBox[];
}
