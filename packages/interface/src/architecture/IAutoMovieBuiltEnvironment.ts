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
 * The record separates the visible element hierarchy from the logical space
 * hierarchy, so a continuous hall may contain named rooms, floors, an attic,
 * and a double-height void without inventing walls, while a stair, lift, ramp,
 * or skybridge explicitly connects those spaces.
 *
 * The scope ends at the building: facade ladders, rails, external stairs,
 * balconies, roofs, and helipads belong here, but surrounding land, parks, sky,
 * and natural water remain production-world concerns. Sun, sky, season,
 * orientation, reference ground, and neighbouring occluder masses are read-only
 * analysis inputs in `IAutoMovieEnvironmentContext`, and no field here can hold
 * them, so they never leak into a building's own models, set pieces, or spaces.
 * An indoor water feature composes a separate engine fluid domain with a
 * building space. Element kinds are open strings, so every architectural style
 * uses the same transform and model primitives.
 *
 * Ordinary TypeScript produces the record; a building class may use loops,
 * parameters, and reusable parts. Lowering turns it into scene models, set
 * pieces, and locomotion spaces, naming the scene space of logical space `s` as
 * `${id}/${s}` and the set piece of element `e` as `${id}/${e}`.
 *
 * @evidence contracts/common.md#principled-implementation An id-referenced graph that `validateBuiltEnvironment` checks in a fixed order, from version and metre units through models, spaces, hierarchies with unit ownership, populations, boundaries, openings, connectors and surfaces, before running staged-configuration checks; lowering, drawing, scheduling and take-off refuse a record it rejects.
 * @evidence contracts/common.md#clear-and-simple-design Flat arrays of separately validated records joined by ids, so each concern (elements, spaces, boundaries, openings, connectors, surfaces, populations) is owned by one list and one validator section rather than by nested element trees.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Site context has no field here and is validated separately against this record's reserved ids, repeated parts stay compact populations rather than expanded elements, and a work with no building unit or with unattributed members is refused instead of gaining an implicit unit.
 * @evidence contracts/common.md#meaningful-documentation States the element and space separation, the building scope and what lives outside it, the units, the lowering naming scheme, unit ownership, the meaning of omitted populations, and which lists ids must resolve into.
 * @author Samchon
 */
export interface IAutoMovieBuiltEnvironment {
  /** Schema version. */
  version: 1;

  /** Non-blank stable identity of this environment. */
  id: string;

  /** All authored dimensions are measured in metres. */
  units: "meter";

  /**
   * Independently owned and independently placed building units in this work;
   * at least one.
   *
   * Ownership is total: every element and every logical space descends from
   * exactly one unit's roots, so nothing in the work is unattributed. A
   * skybridge is a work-owned relation between two units rather than a third
   * unit, so its connector may cross units even though its roots may not.
   */
  buildings: IAutoMovieBuildingUnit[];

  /** Models owned by the environment and cited by visible elements. */
  models: IAutoMovieModel[];

  /**
   * Compiler-owned runtime model ids cited by elements, including imported
   * external assets whose bytes cannot be created inside source code; each is
   * non-blank, listed once, and distinct from every owned model id.
   */
  modelReferences: string[];

  /** Parent-local full-TRS hierarchy of visible and grouping elements. */
  elements: IAutoMovieBuiltElement[];

  /**
   * Compact repeated populations this work stages, each in one logical space.
   *
   * A repeated part such as thousands of roof slates is a population rather
   * than thousands of elements. Declaring it here is what lets a space answer
   * for it: a population placed only in the production world is invisible to
   * this record, so a room asked what it holds would answer with a plausibly
   * small box that leaves out its dominant geometry.
   *
   * Omitted is equivalent to an empty list.
   */
  populations?: IAutoMovieBuiltPopulation[];

  /**
   * Independently nested semantic partitions inside or on the building
   * envelope.
   */
  spaces: IAutoMovieBuiltSpace[];

  /** Physical or logical separations between spaces. */
  boundaries: IAutoMovieBuiltBoundary[];

  /** Passages cut through boundaries. */
  openings: IAutoMovieBuiltOpening[];

  /** Traversable relations such as stairs, lifts, ramps, and skybridges. */
  connectors: IAutoMovieBuiltConnector[];

  /** Ground and support patches assigned to logical spaces. */
  surfaces: IAutoMovieBuiltSurface[];

  /**
   * Surface ids on which locomotion is permitted; each names a
   * {@link surfaces} entry and appears once.
   */
  walkable: string[];
}
