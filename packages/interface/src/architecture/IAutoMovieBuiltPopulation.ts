import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieInstanceSetDesign } from "../production/IAutoMovieInstanceSetDesign";

/**
 * One compact population of repeated members standing in one logical space.
 *
 * The pairing is the one {@link IAutoMovieBuiltSurface} already uses: a
 * logical-space id beside the thing itself, so a population is a building fact
 * with an owner rather than a world fact that happens to overlap a building.
 * The set is held by value and lowered to the production world as an ordinary
 * instance set, so one placement law is written once; a second record stating
 * the same population's extent beside it would be an assertion nobody
 * re-measures, and it would drift the first time either side was edited.
 *
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Binds one compact population to the space it occupies, which this requirement holds apart from the logical groups the same members may join.
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-compression-individuality Preserves the compact set record needed to address and regenerate individual population members without dropping the population from spatial inspection.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Structures the compressed population so its members stay inspectable through the owning space rather than disappearing into count-and-seed storage.
 * @author Samchon
 */
export interface IAutoMovieBuiltPopulation {
  /**
   * The one logical space this population occupies.
   *
   * Exactly one, and the smallest declared space that contains the whole
   * population. A slate field covering an entire roof therefore names the
   * building's own space rather than the rooms beneath it, and "what is in this
   * room" excludes the slate above its ceiling: a room's contents are what
   * stands in the room, not what covers it. A field that genuinely runs through
   * two rooms is authored as two populations, one per room, which costs two
   * compact records rather than two thousand member records.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group States the space membership this requirement keeps distinct from a member's logical group.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Names the owning space through which each compressed member stays selectable and inspectable.
   */
  space: string;

  /**
   * Conservative occupied box of every selectable prototype, in model-local
   * metres before a slot's rotation, scale, and placement are applied.
   *
   * The set names model recipes that the building record does not contain, so
   * a spatial query cannot measure their meshes. Keeping this authored box
   * beside the population makes that missing basis explicit. It is one union
   * for the default recipe and every weighted prototype, not a second world
   * extent: the engine derives the world box from this local fact and the set's
   * deterministic placement law, which prevents a stored placement box from
   * going stale when an anchor, heading, spacing, or scale changes.
   * The author must refresh this union whenever the default recipe or a
   * weighted prototype changes; this compact building record does not pretend
   * to carry an independent asset-revision receipt.
   *
   * A collapsed axis and a point box are valid. They describe flat or
   * degenerate blocking geometry honestly; only an inverted or non-finite box
   * is invalid.
   *
   * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-declared-measured-bounds Keeps the population's authored model-local bound distinct from the world-space bound the engine derives after placement.
   * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-bounds-inputs States the model-local coordinate basis and extent consumed by the population placement fold while leaving asset-revision provenance to the recipe owner.
   */
  prototypeBounds: {
    /** Inclusive model-local minimum corner, in metres. */
    min: IAutoMovieVector3;

    /** Inclusive model-local maximum corner, in metres. */
    max: IAutoMovieVector3;
  };

  /**
   * The compact set that places every member of this population.
   *
   * Every layout except `along-route` may be used. A route is a production-world
   * fact and this record deliberately holds no field that can reach one, so a
   * population whose members follow a route belongs to the world rather than to
   * a building space, and the validator refuses it here instead of resolving it
   * against a route the building cannot see.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Carries the shared prototype and placement law the requirement lets many members reuse without losing their own identity.
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-compression-individuality Carries the count, seed, prototypes, and explicit exceptions from which every compressed member remains deterministically addressable.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Supplies the count, seed, and prototype the specification permits compression to use.
   */
  set: IAutoMovieInstanceSetDesign;
}
