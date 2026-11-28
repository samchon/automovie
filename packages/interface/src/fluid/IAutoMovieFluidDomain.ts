import type { IAutoMovieFluidBoundaries } from "./IAutoMovieFluidBoundaries";
import type { IAutoMovieFluidDrain } from "./IAutoMovieFluidDrain";
import type { IAutoMovieFluidGrid } from "./IAutoMovieFluidGrid";
import type { IAutoMovieFluidSolver } from "./IAutoMovieFluidSolver";
import type { IAutoMovieFluidSource } from "./IAutoMovieFluidSource";
import type { IAutoMovieFluidSpray } from "./IAutoMovieFluidSpray";

/**
 * One independent deterministic fluid computation domain.
 *
 * A domain is independent of architecture: IAutoMovieWaterFeature binds it to a
 * logical basin, while a building-free production can use the same domain
 * directly. The grid, state and flow model do not depend on which record owns
 * its placement.
 *
 * The fixed-grid, fixed-step shallow-water state stores cell depths/bed
 * elevations and horizontal face velocities. It does not resolve 3D
 * Navier-Stokes flow, breaking waves, vertical recirculation or surface
 * tension. simulateFluidDomain's CPU state is normative; GPU projection
 * supplies no byte-identity guarantee.
 *
 * Cell arrays are row-major at row * grid.columns + column, with columns
 * increasing along +X and rows along +Z.
 *
 * Authored initial depths sit over the bed with zero face velocity. An uneven
 * free surface, declared flow or open rim drives subsequent motion; this record
 * exposes no initial velocity field.
 *
 * The solver assumes caller-run validateFluidDomain admission for version 1,
 * metre units, identity, array lengths, finite authored values, initial depths
 * within design depth, nonsolid flow sites and count budgets. It does not
 * repeat those checks. Admission requires a Courant value at most one at the
 * design depth. Integration, surface and spray arithmetic retain separate
 * finite-result and representation limits.
 */
export interface IAutoMovieFluidDomain {
  /** Schema version; the validator accepts only `1`. */
  version: 1;

  /**
   * Stable, nonblank identity; validateWaterFeatures also rejects duplicate
   * domain ids in the supplied binding population.
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
   * Finite cell bed elevations in metres above grid.origin.y, row-major with
   * grid.columns * grid.rows entries. Dry ground's world height is
   * grid.origin.y + bed[k].
   */
  bed: number[];

  /**
   * Initial cell water depths in metres, row-major, each finite and within [0,
   * solver.referenceDepth]. The free surface's world height is grid.origin.y +
   * bed[k] + depth[k].
   */
  depth: number[];

  /**
   * Solid-cell flags in row-major order, with grid.columns * grid.rows
   * booleans. A solid cell must have zero depth, touching faces reflect, and no
   * source, drain or spray may occupy it.
   */
  solid: boolean[];

  /** Declared inflows, at most 256, whose added volume is counted. */
  sources: IAutoMovieFluidSource[];

  /**
   * Declared outflows such as a return or overflow, at most 256, whose removed
   * volume is counted.
   */
  drains: IAutoMovieFluidDrain[];

  /**
   * Decorative spray emitters, at most 32, sampled on the same clock outside
   * the conserved depth field. Their particle mass is not added to or removed
   * from water depth.
   */
  sprays: IAutoMovieFluidSpray[];
}
