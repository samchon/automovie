import type {
  IAutoMovieAffordance,
  IAutoMovieBodyContact,
  IAutoMovieBodyDrag,
  IAutoMovieMaterial,
  IAutoMovieModelPart,
} from "@automovie/interface";

import type { AutoMovieArchetypeConvexCell } from "./AutoMovieArchetypeConvexCell";
import type { AutoMovieArchetypeDrawSession } from "./AutoMovieArchetypeDrawSession";
import type { AutoMovieArchetypeFracture } from "./AutoMovieArchetypeFracture";
import type { AutoMovieArchetypeFriction } from "./AutoMovieArchetypeFriction";
import type { AutoMovieArchetypeMass } from "./AutoMovieArchetypeMass";
import type { AutoMovieArchetypeMaterial } from "./AutoMovieArchetypeMaterial";
import type { AutoMovieArchetypeSpan } from "./AutoMovieArchetypeSpan";

/**
 * What a producer built: the archetype at rest, which `AutoMovieArchetype`
 * reads as `AutoMovieArchetype.IProps`.
 *
 * @template Id The archetype's affordance ids, a closed union the producer
 *   declares.
 * @template Dimension The archetype's free dimensions, a closed union the
 *   producer declares.
 * @template Physical Mass properties of a solid or null for a visual-only
 *   archetype.
 */
export interface IAutoMovieArchetypeProps<
  Id extends string,
  Dimension extends string,
  Physical extends AutoMovieArchetypeMass.IProperties | null =
    AutoMovieArchetypeMass.IProperties,
> {
  /** The producer's name, such as `chair`. */
  archetype: string;

  /** Model id. */
  id: string;

  /** Readable name. */
  name: string;

  /** The parts at rest, with unit scale. */
  parts: IAutoMovieModelPart[];

  /**
   * Explicit convex wall cells by part id; absent for legacy primitive-only
   * records. Cell points remain local and follow each part's current rigid
   * transform.
   */
  cells?: AutoMovieArchetypeConvexCell.Table;

  /** The affordances at rest, each id one of `Id`. */
  affordances: (IAutoMovieAffordance & { id: Id })[];

  /** The materials the parts cite. */
  materials: IAutoMovieMaterial[];

  /** Mass, centre of mass and inertia, or null for a visual-only archetype. */
  properties: Physical;

  /**
   * Static Coulomb friction coefficient of what the model rests on against its
   * ground, 0 to 1; null when its producer has not declared what it rests on.
   */
  friction: number | null;

  /**
   * Kinetic Coulomb friction coefficient of the same pair, 0 to 1; null when no
   * measured pair gives it.
   */
  kineticFriction: number | null;

  /**
   * What each part's surface is made of, by part id, for the parts whose
   * producer declared it.
   */
  surfaces: Readonly<Record<string, AutoMovieArchetypeFriction.Material>>;

  /**
   * The body's declared physical reference material; null for a heterogeneous
   * assembly without one common material.
   */
  material: AutoMovieArchetypeMaterial.Kind | null;

  /**
   * Explicit authored or calibrated normal restitution, 0 to 1; null when no
   * coefficient was declared.
   */
  restitution: number | null;

  /** The air's drag on the body in flight; null when no source measured it. */
  drag: IAutoMovieBodyDrag | null;

  /**
   * How the body ends a flight against what it strikes; null when it declares
   * none.
   */
  contact: IAutoMovieBodyContact | null;

  /**
   * The sets of parts a hit breaks off, each a fragment; empty for an archetype
   * that does not break.
   */
  fractures: readonly AutoMovieArchetypeFracture.ISet[];

  /**
   * Each part's own mass, kilograms, by part id, the shares its mass properties
   * were built from.
   */
  masses: Readonly<Record<string, number>>;

  /** The value of each free dimension the variant has. */
  dimensions: Readonly<Partial<Record<Dimension, number>>>;

  /**
   * Where each dimension came from: the band of each drawn one and the model
   * picked on each axis.
   */
  provenance: AutoMovieArchetypeDrawSession.IProvenance<Dimension>;

  /**
   * The spans laid between moving frames after every pose; empty for most
   * archetypes.
   */
  spans: readonly AutoMovieArchetypeSpan.ISpan[];
}
