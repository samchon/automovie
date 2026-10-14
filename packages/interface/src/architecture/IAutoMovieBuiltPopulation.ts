import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieInstanceSetDesign } from "../production/IAutoMovieInstanceSetDesign";

/**
 * One compact population of repeated members standing in one logical space.
 *
 * A population pairs a logical-space id with the thing itself, as
 * {@link IAutoMovieBuiltSurface} does, so it is a building fact with an owner
 * rather than a world fact that happens to overlap a building. The set is held
 * by value and lowered to the production world as the same instance set, so
 * one placement law serves both the render and every building query, and no
 * second record of the population's world extent exists to drift from it.
 *
 * @evidence contracts/common.md#principled-implementation `builtInstanceSetPlacementBounds` derives world envelopes from the authored prototype box: occupied grid/lattice hull slots, the declared scatter disk or the first count explicit transforms. Fixed rotations transform corners; varying rotation ranges use an origin-centred enclosing sphere. Scatter/variation envelopes can exceed realized seeded members and ignore visibility thinning; binary64 arithmetic is not outward rounded and does not certify an enclosure of arbitrary rendered geometry.
 * @evidence contracts/common.md#clear-and-simple-design Three members, the owning space, the local prototype box, and the set, are exactly what a building query cannot obtain elsewhere; lowering hands the same set object to the production world instead of copying or expanding it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Space containment and prototype completeness remain author obligations, not measured claims. Building validation checks the placement subset, including safe counts, finite ordered prototype/variation data and all stored explicit transforms, while production owns the full instance-set recipe contract. `along-route` is refused because no production route registry is available; no population is expanded to make its bounds appear exact.
 * @evidence contracts/common.md#meaningful-documentation States which space to name and what validation checks of it, the model-local frame and metre units of the prototype box, that the author must refresh it when a prototype changes, which boxes are valid, and which layout is refused and why.
 * @author Samchon
 */
export interface IAutoMovieBuiltPopulation {
  /**
   * The one logical space this population occupies.
   *
   * Exactly one, and the smallest declared space that contains the whole
   * population. A slate field covering an entire roof therefore names the
   * building's own space rather than the rooms beneath it, so "what is in this
   * room" excludes the slate above its ceiling. A field that runs through two
   * rooms is authored as two populations, one per room.
   *
   * Validation only checks that the id resolves; choosing the smallest
   * containing space is the author's obligation, and space queries trust the
   * declared id, folding it into every ancestor, instead of testing member
   * positions.
   */
  space: string;

  /**
   * Conservative occupied box of every selectable prototype, in model-local
   * metres before a slot's rotation, scale, and placement are applied.
   *
   * The set names model recipes that the building record does not contain, so
   * a spatial query cannot measure their meshes; this authored box is the
   * basis it measures instead. It is one union for the default recipe and
   * every weighted prototype. The engine derives the world box from it and the
   * set's placement law, so changing an anchor, heading, spacing, or scale
   * needs no edit here, but changing the default recipe or a weighted
   * prototype does: nothing re-measures the recipes against this box.
   *
   * A collapsed axis and a point box are valid and describe flat or degenerate
   * geometry; only an inverted or non-finite box is invalid.
   */
  prototypeBounds: {
    /** Inclusive model-local minimum corner, in metres. */
    min: IAutoMovieVector3;

    /** Inclusive model-local maximum corner, in metres. */
    max: IAutoMovieVector3;
  };

  /**
   * The compact set that places every member of this population; its `id` is
   * the population's identity, unique within the environment.
   *
   * Every layout except `along-route` may be used. A route is a
   * production-world fact this record holds no field to reach, so a population
   * whose members follow a route belongs to the world rather than to a building
   * space, and validation refuses it.
   */
  set: IAutoMovieInstanceSetDesign;
}
