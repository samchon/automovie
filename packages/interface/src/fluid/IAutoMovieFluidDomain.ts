import { IAutoMovieFluidBoundaries } from "./IAutoMovieFluidBoundaries";
import { IAutoMovieFluidDrain } from "./IAutoMovieFluidDrain";
import { IAutoMovieFluidGrid } from "./IAutoMovieFluidGrid";
import { IAutoMovieFluidSolver } from "./IAutoMovieFluidSolver";
import { IAutoMovieFluidSource } from "./IAutoMovieFluidSource";
import { IAutoMovieFluidSpray } from "./IAutoMovieFluidSpray";

/**
 * One independent deterministic fluid computation domain.
 *
 * The record is not a member of the architecture package. A pond in an atrium,
 * a channel around a courtyard, a fountain basin and a falling water wall are
 * the same computational object as a tank in a production world with no
 * building at all; a building only binds a domain to one of its logical spaces
 * through `IAutoMovieWaterFeature`. Making the solver a child of the building
 * would make the same water two different things depending on who owns the
 * frame.
 *
 * The state is a fixed-grid, fixed-step shallow-water field: a per-cell water
 * depth over a per-cell bed elevation plus horizontal face velocities. It is not
 * a 3D Navier-Stokes solver: it does not resolve breaking waves, vertical
 * recirculation or surface tension, and it does not promise byte-identical
 * results from a GPU projection. The CPU reference state from
 * `simulateFluidDomain` is the only normative one.
 *
 * All cell-indexed arrays are row-major: index `row * grid.columns + column`,
 * with `column` increasing along `+x` and `row` along `+z`.
 *
 * The authored state is water at rest: a domain states depths over a bed, and
 * every face velocity starts at zero. Motion comes from what the water cannot
 * be in equilibrium with, such as an uneven free surface, a declared source or
 * drain, or an open rim, so an author never states a velocity field.
 *
 * The solver assumes a record `validateFluidDomain` accepted: version `1`,
 * units `meter`, a non-blank id, arrays of the right length, finite values,
 * depths within the design depth, flows off solid cells, declared counts within
 * their caps, and a stable step. It does not re-check them while integrating.
 *
 * @evidence contracts/common.md#principled-implementation A linearized shallow-water field on an Arakawa C grid, cell depths and beds at centres and velocities on faces, integrated explicitly by `simulateFluidDomain` under the Courant bound the validator enforces at `solver.referenceDepth`; the representation conserves volume except through declared sources, drains and open edges.
 * @evidence contracts/common.md#clear-and-simple-design The domain owns only lattice, solver settings, edges, per-cell arrays and declared flows; its placement in a building is a separate `IAutoMovieWaterFeature` binding, so the same record serves a building basin and a building-free world.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No initial velocity field is accepted, so motion is always derived from the stated surface and flows, and an invalid record is refused by `validateFluidDomain` rather than clamped by the solver.
 * @evidence contracts/common.md#meaningful-documentation States why the domain is independent of architecture, the model and what it does not resolve, the normative CPU state, the row-major layout, the at-rest initial state, and the validation preconditions; members give units, lengths, datums and caps.
 * @author Samchon
 */
export interface IAutoMovieFluidDomain {
  /** Schema version; the validator accepts only `1`. */
  version: 1;

  /**
   * Stable, non-blank identity; `validateWaterFeatures` also refuses two
   * domains with one id among those a binding is checked against.
   */
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
   * Finite bed elevation of every cell in metres above `grid.origin.y`,
   * row-major, exactly `grid.columns * grid.rows` long. The world elevation of
   * dry ground in a cell is therefore `grid.origin.y + bed[k]`.
   */
  bed: number[];

  /**
   * Initial water depth of every cell in metres, row-major, each finite, `>= 0`
   * and at most `solver.referenceDepth`. The world elevation of the free
   * surface is `grid.origin.y + bed[k] + depth[k]`.
   */
  depth: number[];

  /**
   * Cells occupied by solid matter such as a pier, an island or a channel wall,
   * row-major, exactly `grid.columns * grid.rows` booleans. A solid cell holds
   * no water (its `depth` must be `0`), every face touching it reflects, and no
   * source, drain or spray may sit on it.
   */
  solid: boolean[];

  /** Declared inflows, at most 256, whose added volume is counted. */
  sources: IAutoMovieFluidSource[];

  /**
   * Declared outflows such as a fountain return or a basin overflow, at most
   * 256, whose removed volume is counted.
   */
  drains: IAutoMovieFluidDrain[];

  /**
   * Decorative spray emitters, at most 32. Spray is not part of the conserved
   * water: it is a bounded particle garnish sampled from the same clock, and
   * its mass never enters or leaves the depth field.
   */
  sprays: IAutoMovieFluidSpray[];
}
