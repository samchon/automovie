import { IAutoMovieSoftAnchor } from "./IAutoMovieSoftAnchor";
import { IAutoMovieSoftCollider } from "./IAutoMovieSoftCollider";
import { IAutoMovieSoftLattice } from "./IAutoMovieSoftLattice";
import { IAutoMovieSoftNamedState } from "./IAutoMovieSoftNamedState";
import { IAutoMovieSoftSolver } from "./IAutoMovieSoftSolver";
import { IAutoMovieSoftWind } from "./IAutoMovieSoftWind";

/**
 * Independent fixed-lattice, fixed-step position-based cloth domain.
 *
 * A building can bind the domain through {@link IAutoMovieSoftFurnishing}; the solver also accepts domains without architecture ownership.
 *
 * Lattice particles carry mass and velocity; row, column, diagonal and second-neighbour distance constraints resist stretching, shearing and folding. The CPU reference solver provides no finite-element shell, self-collision, friction or anisotropic air drag.
 *
 * Particle arrays use row-major index `row * lattice.columns + column`. World-space rest positions supply orientation; lattice axes are not fixed to world axes.
 *
 * Constraint rest lengths come from the authored rest coordinates. With no forces or moved anchors, distance corrections remain zero because the same coordinates define both measured and rest lengths.
 *
 * @evidence contracts/common.md#principled-implementation simulateSoftBody uses fixed-step position prediction and Jacobi distance projection on an authored lattice, with rest lengths measured from rest coordinates and zero inverse mass at anchors.
 * @evidence contracts/common.md#clear-and-simple-design The independent domain owns solver inputs; architecture furnishing references it rather than changing the cloth algorithm according to its room.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The tier has no self-collision or friction solve. Collider projection is discrete and ordered, and the declared referenceSpeed travel bound does not clamp measured speed or prove continuous collision avoidance.
 * @evidence contracts/common.md#meaningful-documentation Members specify row-major arrays, world metre coordinates, kilogram masses, hard anchors, named boundary states and the unsupported self-collision request.
 * @author Samchon
 */
export interface IAutoMovieSoftBodyDomain {
  /** Schema version. */
  version: 1;

  /** Stable identity of this soft-body domain. */
  id: string;

  /** All authored lengths are measured in metres. */
  units: "meter";

  /** Fixed particle lattice. */
  lattice: IAutoMovieSoftLattice;

  /** Fixed-step integration settings and declared budgets. */
  solver: IAutoMovieSoftSolver;

  /**
   * World-space rest position of every particle, `[x, y, z, ...]`, row-major. Length must be exactly `3 * lattice.columns * lattice.rows`.
   *
   * This is the panel's authored shape and, simultaneously, the definition of every constraint's rest length. A pre-folded curtain, a draped runner and a flat sheet are all stated here; the solver never invents a rest shape.
   */
  rest: number[];

  /**
   * Mass of every particle in kilograms, row-major, each strictly positive. Length must be exactly `lattice.columns * lattice.rows`; relative inverse masses determine constraint correction shares.
   */
  mass: number[];

  /**
   * Where the panel is fixed: a curtain's rings on its track, a rug's tacked corner, the seam a cushion cover is sewn along.
   *
   * An anchored particle is a hard boundary condition: it holds its target position exactly and carries zero velocity, so no constraint and no collider can drag it away.
   */
  anchors: IAutoMovieSoftAnchor[];

  /**
   * Named configurations of the anchors: `open` and `closed` for a curtain, `spread` and `folded` for a throw.
   *
   * A named state holds anchor targets for the seek rather than interpolating a keyframe or directly prescribing creases.
   */
  states: IAutoMovieSoftNamedState[];

  /** What the panel may not pass through: the floor, a rail, a sofa arm. */
  colliders: IAutoMovieSoftCollider[];

  /** A deterministic draught, or `null` for still air. */
  wind: IAutoMovieSoftWind | null;

  /**
   * Whether the author is asking for cloth-on-cloth contact.
   *
   * Furnishing lowering reports this request as unsupported and returns the rest configuration; the solver tier does not evaluate cloth-on-cloth contact.
   */
  selfCollision: boolean;
}
