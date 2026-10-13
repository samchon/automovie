import { IAutoMovieSoftAnchor } from "./IAutoMovieSoftAnchor";
import { IAutoMovieSoftCollider } from "./IAutoMovieSoftCollider";
import { IAutoMovieSoftLattice } from "./IAutoMovieSoftLattice";
import { IAutoMovieSoftNamedState } from "./IAutoMovieSoftNamedState";
import { IAutoMovieSoftSolver } from "./IAutoMovieSoftSolver";
import { IAutoMovieSoftWind } from "./IAutoMovieSoftWind";

/**
 * One independent deterministic soft-body computation domain: a curtain, a
 * blind, a rug, a cushion cover, a bed sheet, a hanging membrane.
 *
 * The record is deliberately **not** a member of the architecture package, for
 * the same reason a fluid domain is not. A curtain across an atrium window, a
 * banner in a hall and a sheet over a prop crate are the same computational
 * object as a flag in a production world with no building at all; a building
 * only _binds_ a domain to one of its logical spaces (see
 * {@link IAutoMovieSoftFurnishing}). Making the solver a child of the building
 * would make the same cloth two different things depending on who owns the
 * frame.
 *
 * The state is a **fixed lattice, fixed step** position-based cloth: particles
 * at the lattice sites carry mass and velocity, and distance constraints along
 * the lattice rows, columns, diagonals and second neighbours resist stretching,
 * shearing and folding. That is a bounded first tier on purpose. It is not a
 * finite-element continuum shell, it does not resolve cloth-on-cloth contact
 * (see {@link selfCollision}), it has no friction or air-drag anisotropy, and it
 * does not promise byte-identical results from a GPU projection: the CPU
 * reference state defined here is the only normative one.
 *
 * Particle-indexed arrays are **row-major**: index `row * lattice.columns +
 * column`, with `column` increasing along the panel's first authored axis and
 * `row` along its second. Nothing here fixes those axes to world `x` and `z`: a
 * rug lies flat and a curtain hangs vertically, and both are stated by the
 * world-space {@link rest} positions rather than by an orientation field that
 * two authors could disagree about.
 *
 * The authored configuration is **cloth at rest**: every distance constraint
 * takes its rest length from {@link rest} itself, so an undisturbed panel with
 * no gravity, no wind and unmoved anchors produces numerically exact zero
 * corrections and never drifts, however many steps are integrated.
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
   * Length must be exactly `lattice.columns * lattice.rows`. A heavier hem
   * makes a curtain hang straighter, which is the physical way to author weight
   * rather than a decorative one.
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
   * A named state is a boundary condition, not a keyframe. It moves the
   * declared anchors and lets the solver find the folds; nothing here dictates
   * where a crease lands, which is exactly why two states of the same panel
   * cannot contradict each other's physics.
   */
  states: IAutoMovieSoftNamedState[];

  /** What the panel may not pass through: the floor, a rail, a sofa arm. */
  colliders: IAutoMovieSoftCollider[];

  /** A deterministic draught, or `null` for still air. */
  wind: IAutoMovieSoftWind | null;

  /**
   * Whether the author is asking for cloth-on-cloth contact.
   *
   * This tier does not provide it. Declaring it is legitimate — it states what
   * the panel actually needs — and the engine answers with an `unsupported`
   * capability status rather than quietly solving a panel that passes through
   * itself and presenting the result as a simulation.
   */
  selfCollision: boolean;
}
