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
 * This record owns building geometry: facade ladders, rails, external stairs, balconies, roofs and helipads belong here; surrounding terrain, parks, sky and natural water belong to the production world. Sun, season, orientation, reference ground and neighbouring occluders are separate analysis context. Open model/element data does not enforce that semantic ownership by inspecting depicted content. An indoor water feature composes a separate engine fluid domain with a building space, and open element kinds reuse the same transform/model primitives across styles.
 *
 * Ordinary TypeScript produces the record; a building class may use loops,
 * parameters, and reusable parts. Lowering turns it into scene models, set
 * pieces, and locomotion spaces, naming the scene space of logical space `s` as
 * `${id}/${s}` and the set piece of element `e` as `${id}/${e}`.
 *
 * @evidence contracts/common.md#principled-implementation `validateBuiltEnvironment` checks version/units, models and references, spaces and element hierarchy, population declarations, building-unit ownership, boundaries/openings, connectors and support surfaces. With no prior error it checks rest panel fit, carriage-origin service and finite world-TRS named configurations. Lowering and guarded drawing/schedule/quantity entry points refuse rejected records; low-level queries can instead require already admitted inputs.
 * @evidence contracts/common.md#clear-and-simple-design Flat arrays of separately validated records joined by ids, so each concern (elements, spaces, boundaries, openings, connectors, surfaces, populations) is owned by one list and one validator section rather than by nested element trees.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Site context is a separate contract; collision checking against building-reserved ids requires the context caller to supply those ids, which production build review does rather than every standalone analysis call. Compact populations remain compact through lowering, and absent units or unattributed hierarchy members refuse. Typed nested containers and executable traversal/resource depth remain premises; validation does not authenticate imported bytes or prove every geometric containment and physical relation.
 * @evidence contracts/common.md#meaningful-documentation States the element and space separation, the building scope and what lives outside it, the units, the lowering naming scheme, unit ownership, the meaning of omitted populations, and which lists ids must resolve into.
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
