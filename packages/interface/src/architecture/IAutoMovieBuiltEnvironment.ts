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
 */
export interface IAutoMovieBuiltEnvironment {
  /** Schema version. */
  version: 1;

  /** Stable identity of this environment. */
  id: string;

  /** All authored dimensions are measured in metres. */
  units: "meter";

  /**
   * Independently owned and independently placed building units in this work.
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
   * external assets whose bytes cannot be created inside source code.
   */
  modelReferences: string[];

  /** Parent-local full-TRS hierarchy of visible and grouping elements. */
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
   */
  populations?: IAutoMovieBuiltPopulation[];

  /**
   * Independently nested semantic partitions inside/on the building envelope.
   */
  spaces: IAutoMovieBuiltSpace[];

  /** Physical or logical separations between spaces. */
  boundaries: IAutoMovieBuiltBoundary[];

  /** Passages cut through boundaries. */
  openings: IAutoMovieBuiltOpening[];

  /** Traversable relations such as stairs, lifts, ramps, and skybridges. */
  connectors: IAutoMovieBuiltConnector[];

  /** Ground/support patches assigned to logical spaces. */
  surfaces: IAutoMovieBuiltSurface[];

  /** Surface ids on which locomotion is permitted. */
  walkable: string[];
}
