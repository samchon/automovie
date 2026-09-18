import { IAutoMovieModel } from "../model/IAutoMovieModel";
import { IAutoMovieBuildingUnit } from "./IAutoMovieBuildingUnit";
import { IAutoMovieBuiltBoundary } from "./IAutoMovieBuiltBoundary";
import { IAutoMovieBuiltConnector } from "./IAutoMovieBuiltConnector";
import { IAutoMovieBuiltElement } from "./IAutoMovieBuiltElement";
import { IAutoMovieBuiltOpening } from "./IAutoMovieBuiltOpening";
import { IAutoMovieBuiltPopulation } from "./IAutoMovieBuiltPopulation";
import { IAutoMovieBuiltSpace } from "./IAutoMovieBuiltSpace";
import { IAutoMovieBuiltSurface } from "./IAutoMovieBuiltSurface";

/**
 * A complete code-authored building work containing one or more building units.
 *
 * The record deliberately separates the visible element hierarchy from the
 * logical space hierarchy. A continuous hall may therefore contain named rooms,
 * floors, an attic, and a double-height void without inventing walls, while a
 * stair, lift, ramp, or skybridge explicitly connects those spaces. The scope
 * ends at the building: facade ladders, rails, external stairs, balconies,
 * roofs, and helipads belong here, but surrounding land, parks, sky, and
 * natural water remain production-world concerns. Sun, sky, season,
 * orientation, reference ground, and neighbouring occluder masses are therefore
 * read-only inputs a daylight or shadow study reads from the world;
 * deliberately no field here can hold them, so they can never leak into a
 * building's own models, set pieces, or spaces. An indoor water feature
 * composes a separate engine fluid domain with a building space; fluid
 * simulation is not owned by this architecture record. Element kinds are open
 * strings: historical, vernacular, contemporary, and speculative architecture
 * all use the same transform and model primitives instead of being limited by a
 * catalogue of styles.
 *
 * This is an engine/interchange record produced by ordinary TypeScript. A
 * building class may use loops, parameters, and reusable parts, then lower the
 * resulting record to scene models, set pieces, and locomotion spaces.
 *
 * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `IAutoMovieBuiltEnvironment` as the portable data boundary for the building external multi building connection requirement.
 * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `IAutoMovieBuiltEnvironment` for the building envelope multibuilding connector failures system contract.
 */
export interface IAutoMovieBuiltEnvironment {
  /**
   * Schema version.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `version` as the portable data boundary for the building external multi building connection requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `version` for the building envelope multibuilding connector failures system contract.
   */
  version: 1;
  /**
   * Stable identity of this environment.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `id` as the portable data boundary for the building external multi building connection requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `id` for the building envelope multibuilding connector failures system contract.
   */
  id: string;
  /**
   * All authored dimensions are measured in metres.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `units` as the portable data boundary for the building external multi building connection requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `units` for the building envelope multibuilding connector failures system contract.
   */
  units: "meter";
  /**
   * Independently owned and independently placed building units in this work.
   *
   * Ownership is total: every element and every logical space descends from
   * exactly one unit's roots, so nothing in the work is unattributed. A
   * skybridge is a work-owned relation between two units rather than a third
   * unit, so its connector may cross units even though its roots may not.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `buildings` as the portable data boundary for the building external multi building connection requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `buildings` for the building envelope multibuilding connector failures system contract.
   */
  buildings: IAutoMovieBuildingUnit[];
  /**
   * Models owned by the environment and cited by visible elements.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `models` as the portable data boundary for the building external multi building connection requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `models` for the building envelope multibuilding connector failures system contract.
   */
  models: IAutoMovieModel[];
  /**
   * Compiler-owned runtime model ids cited by elements, including imported
   * external assets whose bytes cannot be created inside source code.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `modelReferences` as the portable data boundary for the building external multi building connection requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `modelReferences` for the building envelope multibuilding connector failures system contract.
   */
  modelReferences: string[];
  /**
   * Parent-local full-TRS hierarchy of visible and grouping elements.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `elements` as the portable data boundary for the building external multi building connection requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `elements` for the building envelope multibuilding connector failures system contract.
   */
  elements: IAutoMovieBuiltElement[];
  /**
   * Compact repeated populations this work stages, each in one logical space.
   *
   * A repeated part is a population rather than thousands of elements. The
   * medieval-residence experiment stood 2,392 roof slates, 927 ashlar blocks,
   * 1,045 floor flags and 419 oak boards, and writing those into
   * {@link elements} would have been four thousand records of the same three
   * fields. Declaring them here is what lets a space answer for them: a
   * population placed only in the production world is a world fact this record
   * cannot see, so a room asked what it holds would leave out the geometry that
   * dominates it and answer with a plausibly small box instead of nothing,
   * which is the harder failure to notice.
   *
   * Omitted is equivalent to an empty list, so a record written before this
   * field validates, lowers, and measures exactly as it did.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Gives a compact instance population the space membership this requirement holds apart from its logical grouping.
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-compression-individuality Keeps a compressed population present and inspectable in the building's portable content graph.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Types the compressed population so count-and-seed storage keeps each member inspectable through the space that owns it.
   */
  populations?: IAutoMovieBuiltPopulation[];
  /**
   * Independently nested semantic partitions inside/on the building envelope.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `spaces` as the portable data boundary for the building external multi building connection requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `spaces` for the building envelope multibuilding connector failures system contract.
   */
  spaces: IAutoMovieBuiltSpace[];
  /**
   * Physical or logical separations between spaces.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `boundaries` as the portable data boundary for the building external multi building connection requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `boundaries` for the building envelope multibuilding connector failures system contract.
   */
  boundaries: IAutoMovieBuiltBoundary[];
  /**
   * Passages cut through boundaries.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `openings` as the portable data boundary for the building external multi building connection requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `openings` for the building envelope multibuilding connector failures system contract.
   */
  openings: IAutoMovieBuiltOpening[];
  /**
   * Traversable relations such as stairs, lifts, ramps, and skybridges.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `connectors` as the portable data boundary for the building external multi building connection requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `connectors` for the building envelope multibuilding connector failures system contract.
   */
  connectors: IAutoMovieBuiltConnector[];
  /**
   * Ground/support patches assigned to logical spaces.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `surfaces` as the portable data boundary for the building external multi building connection requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `surfaces` for the building envelope multibuilding connector failures system contract.
   */
  surfaces: IAutoMovieBuiltSurface[];
  /**
   * Surface ids on which locomotion is permitted.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `walkable` as the portable data boundary for the building external multi building connection requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `walkable` for the building envelope multibuilding connector failures system contract.
   */
  walkable: string[];
}
