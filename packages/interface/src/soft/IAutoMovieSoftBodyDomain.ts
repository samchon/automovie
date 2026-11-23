import type { IAutoMovieSoftAnchor } from "./IAutoMovieSoftAnchor";
import type { IAutoMovieSoftCollider } from "./IAutoMovieSoftCollider";
import type { IAutoMovieSoftContact } from "./IAutoMovieSoftContact";
import type { IAutoMovieSoftLattice } from "./IAutoMovieSoftLattice";
import type { IAutoMovieSoftNamedState } from "./IAutoMovieSoftNamedState";
import type { IAutoMovieSoftSolver } from "./IAutoMovieSoftSolver";
import type { IAutoMovieSoftWind } from "./IAutoMovieSoftWind";

/**
 * Independent fixed-lattice, fixed-step position-based cloth domain.
 *
 * A building can bind the domain through {@link IAutoMovieSoftFurnishing}; the
 * solver also accepts domains without architecture ownership.
 *
 * Lattice particles carry mass and velocity; row, column, diagonal and
 * second-neighbour distance constraints resist stretching, shearing and
 * folding, weighted by relaxation stiffness or, when the solver declares
 * compliance, as compliant constraints (XPBD). With `contact`, colliders exert
 * Coulomb friction and a cord keeps its segments apart; the CPU reference
 * solver provides no finite-element shell, cloth-on-cloth contact or
 * anisotropic air drag.
 *
 * Particle arrays use row-major index `row * lattice.columns + column`.
 * World-space rest positions supply orientation; lattice axes are not fixed to
 * world axes.
 *
 * Constraint rest lengths come from the authored rest coordinates. Starting
 * from those coordinates with no forces, changed anchor targets or collider
 * projections gives zero distance residual in representable arithmetic; a
 * collider can displace an otherwise unforced rest shape.
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
   * World-space rest position of every particle, `[x, y, z, ...]`, row-major.
   * Length must be exactly `3 * lattice.columns * lattice.rows`.
   *
   * This is the panel's authored shape and, simultaneously, the definition of
   * every constraint's rest length. A pre-folded curtain, a draped runner and a
   * flat sheet are all stated here; the solver never invents a rest shape.
   */
  rest: number[];

  /**
   * Mass of every particle in kilograms, row-major, each strictly positive.
   * Length must be exactly `lattice.columns * lattice.rows`; relative inverse
   * masses determine constraint correction shares.
   */
  mass: number[];

  /**
   * Where the panel is fixed: a curtain's rings on its track, a rug's tacked
   * corner, the seam a cushion cover is sewn along.
   *
   * An anchored particle is a hard boundary condition: it holds its target
   * position exactly and carries zero velocity, so no constraint and no
   * collider can drag it away.
   */
  anchors: IAutoMovieSoftAnchor[];

  /**
   * Named configurations of the anchors: `open` and `closed` for a curtain,
   * `spread` and `folded` for a throw.
   *
   * A named state holds anchor targets for the seek rather than interpolating a
   * keyframe or directly prescribing creases.
   */
  states: IAutoMovieSoftNamedState[];

  /** What the panel may not pass through: the floor, a rail, a sofa arm. */
  colliders: IAutoMovieSoftCollider[];

  /** A deterministic draught, or `null` for still air. */
  wind: IAutoMovieSoftWind | null;

  /**
   * Whether the author is asking for contact of the body with itself.
   *
   * On a cord, a one-wide lattice with `contact` declared, the solver projects
   * detected nonadjacent segment penetrations toward twice the cord's radius
   * and applies friction. The ordered discrete pass skips coincident closest
   * points and does not rebuild its grid after each correction, so it does not
   * guarantee pair separation or prevent tunnelling. Cloth on cloth is not
   * evaluated: furnishing lowering reports the request as unsupported and
   * returns the rest configuration, and a sheet with `contact` that asks for it
   * is refused.
   */
  selfCollision: boolean;

  /**
   * The body's thickness and its Coulomb friction, for a cord's contact with
   * itself and friction at every collider. Absent or null keeps the
   * frictionless solve with no self-contact.
   */
  contact?: IAutoMovieSoftContact | null;
}
