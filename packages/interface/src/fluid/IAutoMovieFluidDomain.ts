import { IAutoMovieFluidBoundaries } from "./IAutoMovieFluidBoundaries";
import { IAutoMovieFluidDrain } from "./IAutoMovieFluidDrain";
import { IAutoMovieFluidGrid } from "./IAutoMovieFluidGrid";
import { IAutoMovieFluidSolver } from "./IAutoMovieFluidSolver";
import { IAutoMovieFluidSource } from "./IAutoMovieFluidSource";
import { IAutoMovieFluidSpray } from "./IAutoMovieFluidSpray";

/**
 * One independent deterministic fluid computation domain.
 *
 * The record is deliberately **not** a member of the architecture package. A
 * pond in an atrium, a circulating channel around a courtyard, a fountain basin
 * and a falling water wall are all the same computational object as a tank in a
 * production world with no building at all; the building only _binds_ a domain
 * to one of its logical spaces (see `IAutoMovieWaterFeature`). Making the
 * solver a child of the building would make the same water two different things
 * depending on who owns the frame.
 *
 * The state is a **fixed grid, fixed step** shallow-water field: a per-cell
 * water depth over a per-cell bed elevation plus horizontal face velocities.
 * That is a bounded first tier on purpose. It is not an arbitrary 3D
 * Navier-Stokes solver, it does not resolve breaking waves, vertical
 * recirculation, or surface tension, and it does not promise byte-identical
 * results from a GPU projection: the CPU reference state defined here is the
 * only normative one.
 *
 * All cell-indexed arrays are **row-major**: index `row * grid.columns +
 * column`, with `column` increasing along `+x` and `row` along `+z`.
 *
 * The authored state is **water at rest**: a domain states depths over a bed,
 * and every face velocity starts at zero. Motion comes from what the water
 * cannot be in equilibrium with — an uneven free surface, a declared source or
 * drain, an open rim — so an initial velocity field is not a thing an author
 * has to invent, and two authors cannot state the same current twice.
 *
 * The solver assumes a record `validateFluidDomain` accepted: arrays of the
 * right length, depths within the design depth, flows off solid cells, and a
 * stable step. It does not re-check them while integrating.
 *
 * @author Samchon
 */
export interface IAutoMovieFluidDomain {
  /** Schema version. */
  version: 1;

  /** Stable, non-blank identity of this fluid domain. */
  id: string;

  /** All authored lengths are measured in metres. */
  units: "meter";

  /** Fixed computational lattice. */
  grid: IAutoMovieFluidGrid;

  /** Fixed-step integration settings and declared budgets. */
  solver: IAutoMovieFluidSolver;

  /** Which side of the lattice reflects and which lets water leave. */
  boundaries: IAutoMovieFluidBoundaries;

  /**
   * Bed elevation of every cell in metres **above `grid.origin.y`**, row-major.
   * Length must be exactly `grid.columns * grid.rows`. The world elevation of
   * dry ground in a cell is therefore `grid.origin.y + bed[k]`.
   */
  bed: number[];

  /**
   * Initial water depth of every cell in metres, row-major, each `>= 0` and at
   * most `solver.referenceDepth`. The world elevation of the free surface is
   * `grid.origin.y + bed[k] + depth[k]`.
   */
  depth: number[];

  /**
   * Cells occupied by solid matter (a pier, an island, a channel wall). A solid
   * cell holds no water (its `depth` must be `0`), every face touching it
   * reflects, and no source, drain, or spray may sit on it. Length must be
   * exactly `grid.columns * grid.rows`, row-major, and every entry a boolean.
   */
  solid: boolean[];

  /**
   * Declared inflows, at most 256. Water they add is counted, never invented
   * silently.
   */
  sources: IAutoMovieFluidSource[];

  /**
   * Declared outflows such as a fountain return or a basin overflow, at most
   * 256.
   */
  drains: IAutoMovieFluidDrain[];

  /**
   * Decorative bounded spray emitters, at most 32. Spray is **not** part of the
   * conserved water: it is a bounded particle garnish sampled from the same
   * clock, and its mass never enters or leaves the depth field.
   */
  sprays: IAutoMovieFluidSpray[];
}
